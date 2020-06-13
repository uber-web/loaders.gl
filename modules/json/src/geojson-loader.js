/* global TextDecoder */
import {RowTableBatch} from '@loaders.gl/tables';
import parseJSONSync from './lib/parse-json';
import parseJSONInBatches from './lib/parse-json-in-batches';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const GeoJSONLoaderOptions = {
  geojson: {
    TableBatch: RowTableBatch,
    batchSize: 'auto',
    workerUrl: `https://unpkg.com/@loaders.gl/json@${VERSION}/dist/geojson-loader.worker.js`
  }
};

/** @type {LoaderObject} */
export const GeoJSONWorkerLoader = {
  id: 'geojson',
  name: 'GeoJSON',
  version: VERSION,
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
  // TODO - support various line based JSON formats
  /*
  extensions: {
    json: null,
    jsonl: {stream: true},
    ndjson: {stream: true}
  },
  mimeTypes: {
    'application/json': null,
    'application/json-seq': {stream: true},
    'application/x-ndjson': {stream: true}
  },
  */
  category: 'geometry',
  testText: null,
  text: true,
  options: GeoJSONLoaderOptions
};

/** @type {LoaderObject} */
export const GeoJSONLoader = {
  ...GeoJSONWorkerLoader,
  parse,
  parseTextSync,
  parseInBatches
};

async function parse(arrayBuffer, options) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoaderOptions, ...options};
  options.json = {...GeoJSONLoaderOptions.geojson, ...options.geojson};
  return parseJSONSync(text, options);
}

async function parseInBatches(asyncIterator, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoaderOptions, ...options};
  options.json = {...GeoJSONLoaderOptions.geojson, ...options.geojson};
  return parseJSONInBatches(asyncIterator, options);
}
