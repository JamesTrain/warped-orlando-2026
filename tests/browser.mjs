// Browser smoke test: npm run test:browser (requires Playwright + Chromium).
import { fileURLToPath } from 'node:url';
import { resolve, basename } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const qaOutput = process.env.QA_OUTPUT || resolve(repo, 'test-results');
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const server=spawn('python3',['-m','http.server','4173','--directory',resolve(repo,'..')],{stdio:'ignore'});
let browser;
try {
  for(let i=0;i<30;i++){try{if((await fetch('http://127.0.0.1:4173/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['geolocation'],geolocation:{latitude:28.539,longitude:-81.403,accuracy:12}});
  // Tile fetching is deliberately stubbed; geographic view logic still runs.
  await context.route('https://tile.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:4173/${basename(repo)}/`;
  await page.goto(url);await page.waitForFunction(()=>document.getElementById('offline-label').textContent==='Offline map ready');
  await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  assert.equal(await page.locator('.leaflet-image-layer').evaluate(img=>img.complete&&img.naturalWidth===1080),true);
  await page.setViewportSize({width:390,height:844});
  await page.setViewportSize({width:1440,height:1000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),true,'Desktop shell fits the viewport');
  await page.locator('#locate').click();await page.waitForFunction(()=>document.getElementById('location-title').textContent==='You’re on the map.');
  assert.equal(await page.locator('#art-map .you-marker').count(),1);
  await page.locator('#street-tab').click();assert.equal(await page.locator('#street-map').isVisible(),true);
  assert.equal(await page.locator('#street-map .you-marker').count(),1);
  await page.locator('#art-tab').click();
  await mkdir(qaOutput,{recursive:true});
  await page.screenshot({path:resolve(qaOutput,'desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(qaOutput,'mobile.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.locator('#install').click();assert.equal(await page.locator('dialog').isVisible(),true);
  assert.match(await page.locator('dialog').textContent(),/Add to Home Screen/);
  await page.locator('.close-dialog').click();
  await page.evaluate(()=>{navigator.share=async data=>{window.sharedData=data;};});
  await page.locator('#share').click();assert.equal(await page.evaluate(()=>window.sharedData.url),url);
  await page.evaluate(()=>{navigator.share=undefined;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('blocked');}}});});
  await page.locator('#share').click();assert.equal(await page.locator('#share-url').inputValue(),url);
  assert.equal(await page.locator('dialog').getAttribute('aria-labelledby'),'dialog-heading');
  await page.locator('.close-dialog').click();
  await page.locator('#stop-location').click();
  await context.setGeolocation({latitude:40.7,longitude:-74,accuracy:20});
  await page.locator('#locate').click();
  try { await page.waitForFunction(()=>document.getElementById('location-title').textContent==='Outside the festival map.',{},{timeout:7000}); } catch(e) {console.log('GPS diagnostic',await page.locator('.location-card').innerText(),await page.evaluate(()=>document.visibilityState));throw e;}
  assert.equal(await page.locator('#art-map .you-marker').count(),0);
  await page.locator('#stop-location').click();assert.equal(await page.locator('.you-marker').count(),0);
  await context.setOffline(true);await page.reload();
  await page.waitForFunction(()=>document.getElementById('offline-label').textContent==='Offline · festival map saved');
  assert.equal(await page.locator('.leaflet-image-layer').evaluate(img=>img.complete&&img.naturalWidth===1080),true);
  assert.equal(errors.length,0,errors.join('\n'));
  await context.setOffline(false);
  const denied=await browser.newContext({viewport:{width:390,height:844}});
  await denied.addInitScript(()=>{navigator.geolocation.watchPosition=(success,error)=>{setTimeout(()=>error({code:1}),50);return 1;};navigator.geolocation.clearWatch=()=>{};});
  const p=await denied.newPage();await p.goto(url);await p.locator('#locate').click();
  await p.waitForFunction(()=>document.getElementById('location-title').textContent==='Location access is off.');
  assert.match(await p.locator('#location-detail').textContent(),/settings/);
  await denied.close();
  const pending=await browser.newContext();
  await pending.addInitScript(()=>{navigator.geolocation.watchPosition=()=>1;navigator.geolocation.clearWatch=()=>{};});
  const pendingPage=await pending.newPage();const pendingErrors=[];pendingPage.on('pageerror',e=>pendingErrors.push(e.message));
  await pendingPage.goto(url);await pendingPage.locator('#locate').click();await pendingPage.locator('#center').click();await pendingPage.locator('#locate').click();
  assert.equal(pendingErrors.length,0,'Repeated locate while waiting must not recurse: '+pendingErrors.join(','));
  await pending.close();
  console.log('PASS: artwork, opted-in GPS marker, geographic view, mobile layout, install guidance, private sharing, outside/stop/denied GPS, offline reload under repo path, no page errors.');
} finally {if(browser)await browser.close();server.kill();}
