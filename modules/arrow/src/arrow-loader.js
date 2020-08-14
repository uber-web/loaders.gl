/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parseSync from './lib/parse-arrow-sync';
import {parseArrowInBatches} from './lib/parse-arrow-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const ArrowWorkerLoader = {
  id: 'arrow',
  name: 'Apache Arrow',
  version: VERSION,
  extensions: ['arrow', 'feather'],
  mimeTypes: ['application/octet-stream'],
  category: 'table',
  binary: true,
  tests: ['ARROW'],
  options: {
    arrow: {
      workerUrl: `https://unpkg.com/@loaders.gl/arrow@${VERSION}/dist/arrow-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const ArrowLoader = {
  ...ArrowWorkerLoader,
  parse: async (arraybuffer, options) => parseSync(arraybuffer, options),
  parseSync,
  parseInBatches: parseArrowInBatches
};
