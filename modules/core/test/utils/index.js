import test from 'tape-promise/tape';
import {validateLoaderVersion} from '@loaders.gl/core/lib/loader-utils/validate-loader-version';
import {global} from '@loaders.gl/loader-utils';

test('validateLoaderVersion', t => {
  const version = global.__VERSION__;

  global.__VERSION__ = '1.10.3';
  t.doesNotThrow(() => validateLoaderVersion({}), 'missing verison is ignored');
  t.doesNotThrow(() => validateLoaderVersion({version: '1.10.0'}), 'verison is valid');
  t.throws(() => validateLoaderVersion({version: '1.9.0'}), 'verison is not valid');
  t.throws(() => validateLoaderVersion({version: '2.0.0-alpha.1'}), 'verison is not valid');

  delete global.__VERSION__;
  t.doesNotThrow(() => validateLoaderVersion({version: '1.10.0'}), 'missing verison is ignored');

  global.__VERSION__ = version;
  t.end();
});
