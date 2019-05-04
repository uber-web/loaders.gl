/* eslint-disable max-len */
import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';
import {isBrowser} from '@loaders.gl/polyfills/utils/globals';

/* global _encodeImageNode, _parseImageNode */
test('Node image polyfills', t => {
  if (!isBrowser) {
    t.equals(typeof _encodeImageNode, 'function', 'global._encodeImageNode successfully installed');

    t.equals(typeof _parseImageNode, 'function', 'global._parseImageNode successfully installed');
  }
  t.end();
});
