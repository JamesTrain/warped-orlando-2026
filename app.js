import { FESTIVAL } from './config.js';
import { projectToArtwork, distanceMeters, locationIsFresh, canonicalShareUrl } from './geo.js';

const $ = id => document.getElementById(id);
let installPrompt=null, view='art', streetMap=null, watchId=null, lastFix=null, tracking=false;
let artDot=null, artAccuracy=null, streetDot=null, streetAccuracy=null, toastTimer, waitingWorker=null;
const dialog=$('info-dialog');
const icon=stale=>L.divIcon({className:`you-marker${stale?' stale':''}`,html:'<span class="you-dot"></span>',iconSize:[22,22],iconAnchor:[11,11]});
const artwork=FESTIVAL.artwork;
const artBounds=L.latLngBounds([[0,0],[artwork.height,artwork.width]]);
const artMap=L.map('art-map',{crs:L.CRS.Simple,zoomControl:false,attributionControl:false,minZoom:-3,maxZoom:3,zoomSnap:.25,maxBounds:artBounds.pad(.3),maxBoundsViscosity:.8});
L.imageOverlay(artwork.url,artBounds,{alt:'Official Vans Warped Tour Orlando 2026 festival map: stages, food, water, first aid, restrooms and entrance.',interactive:false}).addTo(artMap);
function fitArtwork() {
  artMap.invalidateSize();
  const z=artMap.getBoundsZoom(artBounds,false,[10,10]);
  artMap.setMinZoom(z-.5);
  artMap.fitBounds(artBounds,{padding:[8,8],animate:false});
}
fitArtwork();
function currentMap(){return view==='art'?artMap:streetMap;}
function toast(message) {
  clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,4500);
}
function openDialog(html) {
  $('dialog-content').innerHTML=html;
  const heading=$('dialog-content').querySelector('h2');
  if(heading){heading.id='dialog-heading';dialog.setAttribute('aria-labelledby','dialog-heading');}
  if (!dialog.open) dialog.showModal();
}
function ensureStreetMap() {
  if(streetMap) return;
  streetMap=L.map('street-map',{zoomControl:false,maxZoom:19});
  streetMap.attributionControl.setPrefix(false);
  const tiles=L.tileLayer(FESTIVAL.tileUrl,{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(streetMap);
  let tileWarning=false;
  tiles.on('tileerror',()=>{if(!tileWarning){tileWarning=true;toast('Street tiles could not load. The festival artwork is available offline.');}});
  L.marker(FESTIVAL.center,{icon:L.divIcon({className:'venue-marker',html:'<span style="display:block;width:15px;height:15px;background:#ff6b28;border:3px solid white;border-radius:50%;box-shadow:0 1px 5px #0005"></span>',iconSize:[15,15]})}).addTo(streetMap).bindTooltip('Camping World Stadium');
  fitStreet();
  if(lastFix) renderFix();
}
function fitStreet(){streetMap.fitBounds([[28.5359,-81.4064],[28.5410,-81.3973]],{padding:[35,35],animate:false});}
function changeView(next) {
  view=next;
  $('art-map').hidden=next!=='art'; $('street-map').hidden=next!=='street';
  for(const [id,selected] of [['art-tab',next==='art'],['street-tab',next==='street']]){
    $(id).classList.toggle('selected',selected); $(id).setAttribute('aria-pressed',String(selected));
  }
  $('map-stamp').innerHTML=next==='art'?'<span class="tiny-dot"></span> OFFICIAL 2026 ARTWORK':'<span class="tiny-dot"></span> GEOGRAPHIC VIEW · NORTH UP';
  $('map-caption').textContent=next==='art'?'PINCH TO ZOOM · DRAG TO EXPLORE':'STREET TILES REQUIRE INTERNET';
  $('map-download').hidden=next!=='art';
  if(next==='street'){ensureStreetMap();streetMap.invalidateSize();}else artMap.invalidateSize();
}
$('art-tab').onclick=()=>changeView('art'); $('street-tab').onclick=()=>changeView('street');
$('zoom-in').onclick=()=>currentMap().zoomIn(); $('zoom-out').onclick=()=>currentMap().zoomOut();
$('fit').onclick=()=>view==='art'?fitArtwork():fitStreet();
new ResizeObserver(()=>{artMap.invalidateSize();if(streetMap)streetMap.invalidateSize();}).observe($('art-map'));

function setLocationStatus(title,detail,label='Locate me',gps='GPS OFF') {
  $('location-title').textContent=title;$('location-detail').textContent=detail;
  $('locate-label').textContent=label; $('gps-label').textContent=gps;
  $('signal-dot').classList.toggle('active',gps==='LIVE');
}
function clearWatch() {
  if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;}
  tracking=false;$('stop-location').hidden=true;
}
function renderFix() {
  if(!lastFix)return;
  const {latitude:lat,longitude:lon,accuracy}=lastFix.coords;
  const fresh=tracking && locationIsFresh(lastFix.timestamp);
  const projected=projectToArtwork(lat,lon);
  if(artDot){artMap.removeLayer(artDot);artDot=null;}
  if(artAccuracy){artMap.removeLayer(artAccuracy);artAccuracy=null;}
  if(projected?.inside){
    const pt=[artwork.height-projected.y,projected.x];
    const p2=projectToArtwork(lat+accuracy/111195,lon+accuracy/(111195*Math.cos(lat*Math.PI/180)));
    const radius=Math.hypot(p2.x-projected.x,p2.y-projected.y)/Math.SQRT2;
    artAccuracy=L.circle(pt,{radius,color:fresh?'#2476f5':'#77857d',weight:1,fillOpacity:.12,interactive:false}).addTo(artMap);
    artDot=L.marker(pt,{icon:icon(!fresh),keyboard:false}).addTo(artMap).bindTooltip(fresh?'You · approximate':'Last location · approximate',{permanent:true,direction:'top',offset:[0,-12],className:'you-label'});
  }
  if(streetMap){
    if(streetDot)streetMap.removeLayer(streetDot);
    if(streetAccuracy)streetMap.removeLayer(streetAccuracy);
    streetAccuracy=L.circle([lat,lon],{radius:accuracy,color:fresh?'#2476f5':'#77857d',weight:1,fillOpacity:.12,interactive:false}).addTo(streetMap);
    streetDot=L.marker([lat,lon],{icon:icon(!fresh),keyboard:false}).addTo(streetMap).bindTooltip(fresh?'You':'Last location',{permanent:true,direction:'top',offset:[0,-12],className:'you-label'});
  }
  document.querySelector('.map-footer>span:first-child').innerHTML='<span class="location-key"></span>'+(fresh?`GPS accuracy ±${Math.round(accuracy)} m · artwork approximate`:'Last location · no live GPS fix');
  if(tracking){
    if(!fresh){setLocationStatus('Waiting for a fresh fix.','Your last location is over a minute old. Keep this app open with a clear view of the sky.','Recenter','STALE');return;}
    if(!projected?.inside){
      const distance=distanceMeters(lat,lon,...FESTIVAL.center);
      const readable=distance>=1000?`${(distance/1000).toFixed(1)} km`:`${Math.round(distance)} m`;
      setLocationStatus('Outside the festival map.',`You’re about ${readable} from the venue. Street map shows your geographic position. GPS accuracy ±${Math.round(accuracy)} m.`,'Show my location','LIVE');
    }else{
      setLocationStatus(accuracy>100?'Your GPS signal is broad.':'You’re on the map.',`Approximate artwork position · GPS accuracy ±${Math.round(accuracy)} m. ${accuracy>100?'Try an open area for a better fix.':'Street map shows your geographic position.'}`,'Recenter on me','LIVE');
    }
  }
}
function centerOnLocation() {
  if(!lastFix){if(tracking){toast('Waiting for the first GPS fix…');return;}startLocation();return;}
  if(!tracking){startLocation();return;}
  const p=projectToArtwork(lastFix.coords.latitude,lastFix.coords.longitude);
  if(view==='art'&&!p?.inside)changeView('street');
  if(view==='art')artMap.setView([artwork.height-p.y,p.x],Math.max(artMap.getZoom(),0),{animate:false});
  else streetMap.setView([lastFix.coords.latitude,lastFix.coords.longitude],17,{animate:false});
}
function startLocation() {
  if(tracking){centerOnLocation();return;}
  if(!window.isSecureContext){setLocationStatus('A secure connection is needed.','Open the HTTPS GitHub Pages address to use your location.');return;}
  if(!navigator.geolocation){setLocationStatus('Location isn’t supported.','Try opening this app in Safari or Chrome. You can still explore both maps.');return;}
  tracking=true; $('stop-location').hidden=false;
  setLocationStatus('Finding you…','Allow location access when your browser asks. The first fix can take a few seconds.','Waiting for GPS…','SEARCHING');
  watchId=navigator.geolocation.watchPosition(position=>{
    if(!tracking)return;
    const {latitude,longitude,accuracy}=position.coords;
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(accuracy)||accuracy<0)return;
    const first=!lastFix;
    lastFix={coords:{latitude,longitude,accuracy},timestamp:position.timestamp};
    renderFix();
    if(first)centerOnLocation();
  },error=>{
    clearWatch(); if(lastFix)renderFix();
    const messages={1:['Location access is off.','Allow location for this site in your browser or phone settings, then try again.'],2:['Couldn’t find your location.','Check that Location Services is on, move to an open area, and try again.'],3:['GPS is taking a little longer.','Move to an open area and try again. The map is ready to explore.']};
    const [title,detail]=messages[error.code]||messages[2];setLocationStatus(title,detail,'Try location again');
  },{enableHighAccuracy:true,maximumAge:10000,timeout:20000});
}
$('locate').onclick=startLocation;$('center').onclick=centerOnLocation;
$('stop-location').onclick=()=>{
  clearWatch();lastFix=null;
  for(const [map,layer] of [[artMap,artDot],[artMap,artAccuracy],[streetMap,streetDot],[streetMap,streetAccuracy]])if(map&&layer)map.removeLayer(layer);
  artDot=artAccuracy=streetDot=streetAccuracy=null;
  setLocationStatus('Location is off.','Your location has been cleared. Tap below whenever you want to find yourself again.');
  document.querySelector('.map-footer>span:first-child').innerHTML='<span class="location-key"></span> Your dot appears when location is on';
};
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&tracking){clearWatch();renderFix();setLocationStatus('Location paused.','GPS pauses when you leave the app. Tap below for a fresh location.','Resume location','PAUSED');}
});
setInterval(()=>{if(tracking&&lastFix)renderFix();},10000);

function shareFallback(url){
  openDialog('<h2>Bring your crew.</h2><p>Share this app link. Your location is never included.</p><label for="share-url">Map link</label><input id="share-url" readonly><button id="copy-link" class="primary">Copy link</button>');
  $('share-url').value=url;
  $('share-url').onclick=()=>{$('share-url').select();};
  $('copy-link').onclick=async()=>{
    try {await navigator.clipboard.writeText(url);toast('Map link copied.');dialog.close();}
    catch{$('share-url').focus();$('share-url').select();toast('Select and copy the link to share it.');}
  };
}
$('share').onclick=async()=>{
  const url=canonicalShareUrl(window.location.href);
  if(navigator.share){try{await navigator.share({title:'Warped Orlando 2026 · Pocket Map',text:'Find your next set. Here’s the festival map.',url});return;}catch(error){if(error.name==='AbortError')return;}}
  try{await navigator.clipboard.writeText(url);toast('Map link copied. Send it to your crew.');}catch{shareFallback(url);}
};
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
window.addEventListener('appinstalled',()=>{installPrompt=null;$('install').innerHTML='<svg><use href="#i-check"/></svg>Installed';toast('You’re set. Find Warped Map on your home screen.');});
$('install').onclick=async()=>{
  if(installPrompt){const prompt=installPrompt;installPrompt=null;try{await prompt.prompt();await prompt.userChoice;return;}catch{/* Platform instructions remain available. */}}
  const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  if(standalone){openDialog('<h2>You’re already installed.</h2><p>This is the home-screen app. Once the offline indicator says “Offline map ready,” your festival artwork is saved on this device.</p>');return;}
  openDialog('<h2>Your pocket. Your map.</h2><p>Add Warped Map to your home screen for quick access between sets.</p><ol><li><strong>iPhone / iPad:</strong> open this link in Safari. Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong> (or More → Add to Home Screen), then Add.</li><li><strong>Android:</strong> open in Chrome. Tap the <strong>⋮ menu</strong>, then <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li><strong>Desktop:</strong> use the install icon in Chrome or Edge’s address bar, if available.</li></ol><p>Wait for “Offline map ready” before heading out. Street map tiles need internet; GPS can work offline if your device can obtain a fix.</p>');
};
$('about').onclick=()=>{
  openDialog('<h2>A little map context.</h2><p>This unofficial fan companion uses the <a href="https://www.vanswarpedtourorlando.com/hoursandinfo" target="_blank" rel="noopener noreferrer">official Orlando 2026 festival artwork</a>. Stage names and amenities are part of that image.</p><p><strong>Your dot on the artwork is approximate.</strong> We align GPS coordinates to street and stadium landmarks, but the drawing distorts real distances. Use Street map to check your geographic position. This app does not provide walking routes.</p><p><strong>Privacy:</strong> location starts only when you tap Locate me, stays in memory, and pauses when you leave the app. Stop location clears it. Sharing sends only the app link. Street map loads tiles from OpenStreetMap, which receives the viewed map area and your IP address.</p><p><strong>Offline:</strong> the artwork and app are saved after the first successful load. Street tiles require internet. Your phone controls location permissions and accuracy. A gray dot is an old or paused fix.</p><p><a href="https://github.com/JamesTrain/warped-orlando-2026" target="_blank" rel="noopener noreferrer">Source & map references ↗</a></p>'+(waitingWorker?'<button id="update-app" class="primary">Load app update</button>':''));
  if($('update-app'))$('update-app').onclick=()=>waitingWorker.postMessage({type:'SKIP_WAITING'});
};
document.querySelector('.close-dialog').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});

function offlineStatus(ready=false){
  $('offline-status').classList.toggle('ready',ready);
  $('offline-label').textContent=ready?(navigator.onLine?'Offline map ready':'Offline · festival map saved'):(navigator.onLine?'Preparing offline map…':'Offline map not saved yet');
}
let offlineReady=false;
async function registerOffline(){
  if(!('serviceWorker' in navigator)){ $('offline-label').textContent='Offline saving isn’t supported here';return;}
  try{
    const registration=await navigator.serviceWorker.register('./sw.js');
    if(registration.waiting)waitingWorker=registration.waiting;
    registration.addEventListener('updatefound',()=>{
      const worker=registration.installing;
      worker?.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller){waitingWorker=worker;toast('A map update is ready. Open map info to load it.');}
        if(worker.state==='redundant'&&!offlineReady)$('offline-label').textContent='Offline save failed · reload to retry';
      });
    });
    await navigator.serviceWorker.ready;
    offlineReady=true;offlineStatus(true);
    let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(waitingWorker&&!reloading){reloading=true;window.location.reload();}});
  }catch{$('offline-label').textContent='Offline save failed · reload to retry';}
}
window.addEventListener('online',()=>offlineStatus(offlineReady));window.addEventListener('offline',()=>offlineStatus(offlineReady));
registerOffline();
