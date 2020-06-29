/* global fetch */
import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';
import {isBrowser} from '@loaders.gl/core';

const GITHUB_MASTER = 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/';
const PLY_CUBE_ATT_URL = `${GITHUB_MASTER}ply/test/data/cube_att.ply`;
const PLY_CUBE_ATT_SIZE = 853;

test('polyfills#fetch() (NODE)', async t => {
  if (!isBrowser) {
    const response = await fetch(PLY_CUBE_ATT_URL);
    t.ok(response.headers, 'fetch polyfill successfully returned headers under Node.js');
    const data = await response.arrayBuffer();
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js');
  }
  t.end();
});

test('polyfills#fetch() ignores url query params when loading file (NODE)', async t => {
  if (!isBrowser) {
    const response = await fetch(`${PLY_CUBE_ATT_URL}?v=1.2.3`);
    const data = await response.text();
    t.ok(response.headers, 'fetch polyfill successfully returned headers under Node.js');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js');
  }
  t.end();
});

test('polyfills#fetch() error handling (NODE)', async t => {
  if (!isBrowser) {
    let response = await fetch('non-existent-file');
    t.ok(response.statusText.includes('ENOENT'), 'fetch statusText forwards node ENOENT error');
    t.notOk(response.ok, 'fetch polyfill fails cleanly on non-existent file');
    t.ok(response.arrayBuffer(), 'Response.arrayBuffer() does not throw');

    response = await fetch('.');
    t.ok(response.statusText.includes('EISDIR'), 'fetch statusText forwards node EISDIR error');
    t.notOk(response.ok, 'fetch polyfill fails cleanly on directory');
    t.ok(response.arrayBuffer(), 'Response.arrayBuffer() does not throw');
  }
  t.end();
});

test('polyfills#fetch() able to handle "Accept-Encoding: gzip" (NODE)', async t => {
  if (!isBrowser) {
    // Github will serve the desired compression
    const headers = {
      'Accept-Encoding': 'gzip'
    };
    // Test will pass even if server will refuse to encode into 'gzip' and just return plaintext
    // In case of GitHub URL, it's honoring gzip and properly returning compressed data
    const response = await fetch(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.equal(data.length, PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "gzip" encoding');
  }
  t.end();
});

test('polyfills#fetch() able to handle "Accept-Encoding: br" (NODE)', async t => {
  if (!isBrowser) {
    // Github will serve the desired compression
    const headers = {
      'Accept-Encoding': 'br'
    };
    // Test will pass even if server will refuse to encode into 'br' and just return plaintext
    const response = await fetch(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.ok(data.length === PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "br" encoding');
  }
  t.end();
});

test('polyfills#fetch() able to handle "Accept-Encoding: deflate"', async t => {
  if (!isBrowser) {
    // Github will serve the desired compression
    const headers = {
      'Accept-Encoding': 'deflate'
    };
    // Test will pass even if server will refuse to encode into 'deflate' and just return plaintext
    const response = await fetch(PLY_CUBE_ATT_URL, {headers});
    const data = await response.text();
    t.ok(data.length === PLY_CUBE_ATT_SIZE, 'fetch polyfill data size as expected');
    t.ok(data, 'fetch polyfill successfully loaded data under Node.js with "deflate" encoding');
  }
  t.end();
});
