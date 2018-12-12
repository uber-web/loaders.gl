// Binary container format for glTF

import {GLBParser} from '@loaders.gl/glb';
import GLTFParser from './gltf-parser';

export function parseTextGLTF(json, options = {}) {
  return new GLTFParser(json).parse(options);
}

export function parseBinaryGLTF(glbArrayBuffer, options = {}) {
  const {json, arrayBuffer} = new GLBParser(glbArrayBuffer).parseWithMetadata(options);
  return new GLTFParser(json, arrayBuffer).parse(options);
}

export default {
  name: 'glTF',
  extension: 'gltf',
  parseText: parseTextGLTF,
  parseBinary: parseBinaryGLTF
};
