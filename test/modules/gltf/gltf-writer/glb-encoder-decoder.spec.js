/* eslint-disable max-len */
import test from 'tape-catch';

import {GLBBuilder, GLBParser} from '@loaders.gl/gltf';
import unpackGLBBuffers from '@loaders.gl/gltf/glb-loader/unpack-glb-buffers';

import TEST_JSON from 'test-data/glb/test-data.json';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

test('GLB#encode-and-decode', t => {
  const glbBuilder = new GLBBuilder();

  // Add buffers
  for (const buffer of BUFFERS) {
    glbBuilder.addBuffer(buffer, {size: 1});
  }

  glbBuilder.addExtras(TEST_JSON);

  const glbFileBuffer = glbBuilder.encode();

  t.equal(glbFileBuffer.byteLength, 1620, 'should be equal');

  const {arrayBuffer, json, binaryByteOffset} = new GLBParser(glbFileBuffer)._parseBinary();

  t.equal(binaryByteOffset, 1592);
  t.deepEqual(json.extras, TEST_JSON, 'JSON is equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, json, binaryByteOffset);

  for (const key in buffers2.accessors) {
    delete buffers2.accessors[key].accessor;
  }

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2.accessors));
  t.deepEqual(buffers2.accessors, BUFFERS, 'buffers should be deep equal');
  t.end();
});
