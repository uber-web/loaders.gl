import type {Writer} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ParquetWriterOptions = {};

const DEFAULT_PARQUET_LOADER_OPTIONS = {};

export const ParquetWriter: Writer = {
  name: 'Apache Parquet',
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  encodeSync,
  binary: true,
  options: DEFAULT_PARQUET_LOADER_OPTIONS
};

function encodeSync(data, options?: ParquetWriterOptions) {
  return new ArrayBuffer(0);
}
