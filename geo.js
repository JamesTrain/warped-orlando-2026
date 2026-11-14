// Geographic coordinates are converted to approximate illustration pixels.
// Piecewise control points preserve the stadium footprint in this distorted art.
// Sources and limitations: docs/map-sources.md.
const LON = [[-81.4054887,100],[-81.4038477,414],[-81.4016739,553],[-81.3982898,978]];
const LAT = [[28.5368227,810],[28.5381798,468],[28.5399435,282],[28.5401504,272]];
function interpolate(value, knots) {
  let i = knots.findIndex(([v])=>v >= value)-1;
  if (i<0) i=value <= knots[0][0] ? 0 : knots.length-2;
  const [a,b]=[knots[i],knots[i+1]];
  return a[1]+(value-a[0])/(b[0]-a[0])*(b[1]-a[1]);
}
export function projectToArtwork(lat, lon) {
  if (!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return null;
  const x=interpolate(lon,LON), y=interpolate(lat,LAT);
  return {x,y,inside:x>=90 && x<=990 && y>=265 && y<=975};
}
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const rad=Math.PI/180;
  const a=Math.sin((lat2-lat1)*rad/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin((lon2-lon1)*rad/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
}
export function locationIsFresh(timestamp, now=Date.now()) {return now>=timestamp && now-timestamp<60000;}
export function canonicalShareUrl(url) {const clean=new URL(url);clean.search='';clean.hash='';return clean.href;}
