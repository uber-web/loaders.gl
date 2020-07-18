import {concatenateChunksAsync} from '@loaders.gl/loader-utils';
import parseSHP from './lib/parse-shp';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export const SHPWorkerLoader = {
  id: 'shp',
  name: 'SHP',
  category: 'geometry',
  version: VERSION,
  extensions: ['shp'],
  mimeTypes: [],
  options: {
    shp: {
      workerUrl: `https://unpkg.com/@loaders.gl/shapefile@${VERSION}/dist/shp-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const SHPLoader = {
  ...SHPWorkerLoader,
  parse: async (arrayBuffer, options) => parseSHP(arrayBuffer),
  parseSync: parseSHP,
  parseInBatches
};

// TODO actually parse .shp file in batches; instead of concatenating chunks
async function* parseInBatches(asyncIterator, options) {
  const arrayBuffer = await concatenateChunksAsync(asyncIterator);
  yield parseSHP(arrayBuffer);
}
