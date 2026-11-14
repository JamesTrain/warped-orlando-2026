import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function harness() {
  const code = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const handlers = {};
  const stores = new Map();
  const deleted = [];
  let network = async () => new Response('network', { status: 200 });
  let skipped = 0;
  const scope = 'https://example.test/warped-orlando-2026/';
  const key = request => new URL(typeof request === 'string' ? request : request.url, scope).href;
  const cache = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const data = stores.get(name);
    return {
      addAll: async urls => { for (const url of urls) data.set(key(url), new Response(`cached:${url}`)); },
      match: async request => data.get(key(request))?.clone(),
      put: async (request, response) => data.set(key(request), response.clone())
    };
  };
  vm.runInNewContext(code, {
    URL, Response, Request,
    fetch: (...args) => network(...args),
    caches: { open: async name => cache(name), keys: async () => [...stores.keys()], delete: async name => {deleted.push(name); return stores.delete(name);} },
    self: {
      registration: {scope}, location: {origin: 'https://example.test'},
      clients: {claim: async () => {}},
      skipWaiting: async () => { skipped++; },
      addEventListener: (name, handler) => handlers[name] = handler
    }
  });
  const lifecycle = async name => {
    let work;
    handlers[name]({ waitUntil: promise => work = promise });
    await work;
  };
  const request = async (path, mode = 'cors') => {
    let response, work;
    const req = {url: new URL(path, scope).href, method: 'GET', mode};
    handlers.fetch({request: req, respondWith: promise => response = promise, waitUntil: promise => work = promise});
    const result = await response;
    await work;
    return result;
  };
  return {stores, deleted, scope, handlers, lifecycle, request,
    setNetwork: fn => network = fn,
    get skipped() {return skipped;}
  };
}

test('install saves the official map and all local shell dependencies', async () => {
  const h = await harness();
  await h.lifecycle('install');
  const stored = [...h.stores.values()][0];
  for (const path of ['index.html', 'app.js', 'styles.css', 'geo.js', 'config.js', 'assets/festival-map.png', 'assets/leaflet.js', 'assets/leaflet.css', 'manifest.webmanifest']) {
    assert.ok(stored.has(h.scope + path), `missing ${path}`);
  }
});

test('offline navigation under a Pages subpath falls back to the saved app', async () => {
  const h = await harness();
  await h.lifecycle('install');
  h.setNetwork(async () => {throw new Error('offline');});
  const response = await h.request('./?shared=true', 'navigate');
  assert.match(await response.text(), /cached:.*index.html/);
  assert.ok([...h.stores.values()].every(store => [...store.keys()].every(url => !url.includes('?'))));
});

test('offline static assets return the real cached file without an HTML fallback', async () => {
  const h = await harness();
  await h.lifecycle('install');
  h.setNetwork(async () => {throw new Error('offline');});
  assert.match(await (await h.request('./assets/festival-map.png')).text(), /festival-map.png/);
  assert.equal(await h.request('./assets/missing.png'), undefined);
});

test('does not intercept query assets, external requests, or sibling repositories', async () => {
  const h = await harness();
  for (const path of ['./app.js?location=private', 'https://tiles.example.test/1.png', '/other-repo/app.js']) {
    assert.equal(await h.request(path), undefined);
  }
});

test('activation only removes old versions of this app and scope', async () => {
  const h = await harness();
  await h.lifecycle('install');
  const current = [...h.stores.keys()][0];
  const old = current.replace(/v\d+$/, 'v0');
  h.stores.set(old, new Map());
  h.stores.set('unrelated-app', new Map());
  h.stores.set('warped-orlando-2026:/another-repo/:v0', new Map());
  await h.lifecycle('activate');
  assert.deepEqual(h.deleted, [old]);
  assert.ok(h.stores.has('unrelated-app'));
  assert.ok(h.stores.has('warped-orlando-2026:/another-repo/:v0'));
});

test('an update activates only after the app requests it', async () => {
  const h = await harness();
  await h.lifecycle('install');
  assert.equal(h.skipped, 0);
  let work;
  h.handlers.message({data: {type: 'SKIP_WAITING'}, waitUntil: promise => work = promise});
  await work;
  assert.equal(h.skipped, 1);
});

test('a new network release cannot mix new HTML with the current cached scripts', async () => {
  const h=await harness();await h.lifecycle('install');
  h.setNetwork(async()=>new Response('next release'));
  assert.match(await (await h.request('./','navigate')).text(),/cached:.*index.html/);
  assert.match(await (await h.request('./app.js')).text(),/cached:.*app.js/);
});
