import test from 'node:test';
import assert from 'node:assert/strict';
import { projectToArtwork, distanceMeters, locationIsFresh, canonicalShareUrl } from '../geo.js';
const points = [
  [28.5401504,-81.4054887,100,272],
  [28.5401504,-81.3982898,978,272],
  [28.5368227,-81.4054887,100,810],
  [28.5399435,-81.4038477,414,282],
  [28.5381798,-81.4016739,553,468],
];
test('documented street and stadium anchors map to artwork control points',()=>{
  for(const [lat,lon,x,y] of points) {
    const p=projectToArtwork(lat,lon);
    assert.ok(Math.abs(p.x-x)<0.01); assert.ok(Math.abs(p.y-y)<0.01);
  }
});
test('outside and invalid locations never become an on-site dot',()=>{
  assert.equal(projectToArtwork(40,-74).inside,false);
  assert.equal(projectToArtwork(NaN,-81),null);
  assert.equal(projectToArtwork(95,0),null);
});
test('distance is geographic and freshness rejects old/future fixes',()=>{
  assert.equal(distanceMeters(28.539,-81.403,28.539,-81.403),0);
  assert.ok(Math.abs(distanceMeters(0,0,0,1)-111195)<10);
  assert.equal(locationIsFresh(10000,20000),true);
  assert.equal(locationIsFresh(10000,100000),false);
  assert.equal(locationIsFresh(30000,20000),false);
});
test('sharing removes all query strings and hash coordinates',()=>{
  assert.equal(canonicalShareUrl('https://jamestrain.github.io/warped-orlando-2026/?lat=28#lon=81'),'https://jamestrain.github.io/warped-orlando-2026/');
});
