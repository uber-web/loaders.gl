import type {WriterObject} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeGLTFSync} from './lib/encoders/encode-gltf';

/**
 * GLTF exporter
 */
export const GLTFWriter = {
  name: 'glTF',
  id: 'gltf',
  module: 'gltf',
  version: VERSION,

  extensions: ['glb'], // We only support encoding to binary GLB, not to JSON GLTF
  mimeTypes: ['model/gltf-binary'], // 'model/gltf+json',
  binary: true,

  encodeSync,

  options: {
    gltf: {}
  }
};

function encodeSync(gltf, options: {[key: string]: any} = {}) {
  const {byteOffset = 0} = options;

  // Calculate length, then create arraybuffer and encode
  const byteLength = encodeGLTFSync(gltf, null, byteOffset, options);
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  encodeGLTFSync(gltf, dataView, byteOffset, options);

  return arrayBuffer;
}

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckGLBLoader: WriterObject = GLTFWriter;
