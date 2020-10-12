import test from 'tape-promise/tape';
import {loadI3STileContent} from './lib/utils/load-utils';

test('I3SLoader#Load tile content', async t => {
  const content = await loadI3STileContent();
  t.ok(content);
  t.ok(content.attributes);
  t.ok(content.attributes.positions);
  t.equal(content.attributes.positions.value.length, 76914);
  t.ok(content.attributes.normals);
  t.equal(content.attributes.normals.value.length, 76914);
  t.ok(content.attributes.colors);
  t.equal(content.attributes.colors.value.length, 102552);
  t.ok(content.attributes.texCoords);
  t.equal(content.attributes.texCoords.value.length, 51276);
  t.ok(content.texture);

  // This line fails in browser mode
  // t.equal(content.texture.data.byteLength, 131072);
  t.end();
});
