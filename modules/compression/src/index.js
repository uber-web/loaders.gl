/** @typedef {import('@loaders.gl/loader-utils').WorkerObject} WorkerObject */

export {default as ZlibDeflateTransform} from './lib/zlib/zlib-deflate-transform';
export {default as ZlibInflateTransform} from './lib/zlib/zlib-inflate-transform';

export {default as LZ4DeflateTransform} from './lib/lz4/lz4-deflate-transform';
export {default as LZ4InflateTransform} from './lib/lz4/lz4-inflate-transform';

// Move to WIP due to enormous dependency size
// export {default as ZstdDeflateTransform} from './lib/zstd/zstd-deflate-transform';
// export {default as ZstdInflateTransform} from './lib/zstd/zstd-inflate-transform';\

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const ZlibWorker = {
  id: 'zlib',
  name: 'zlib',
  module: 'compression',
  version: VERSION,
  options: {
    zlib: {
      // level
    }
  }
};
