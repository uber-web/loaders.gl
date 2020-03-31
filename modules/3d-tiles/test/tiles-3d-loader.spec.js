// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parse, fetchFile} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {DracoLoader} from '@loaders.gl/draco';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/tileset.json';
const TILE_B3DM_WITH_DRACO_URL = '@loaders.gl/3d-tiles/test/data/143.b3dm';

test('Tiles3DLoader#Tileset file', async t => {
  const response = await fetchFile(TILESET_URL);
  const tileset = await parse(response, Tiles3DLoader);
  t.ok(tileset);

  t.equals(tileset.type, 'TILES3D');
  t.equals(tileset.lodMetricType, 'geometricError');
  t.equals(tileset.lodMetricValue, 0);
  t.equals(tileset.loader, Tiles3DLoader);

  t.equals(tileset.root.refine, 1);
  t.deepEqual(tileset.root.boundingVolume.region, [
    -1.3197004795898053,
    0.6988582109,
    -1.3196595204101946,
    0.6988897891,
    0,
    20
  ]);

  t.equals(tileset.root.geometricError, 0);
  t.equals(tileset.root.content.uri, 'batchedColors.b3dm');
  t.equals(tileset.root.lodMetricType, 'geometricError');
  t.equals(tileset.root.lodMetricValue, 0);
  t.equals(tileset.root.type, 'scenegraph');

  t.end();
});

test('Tiles3DLoader#Tile with GLB w/ Draco bufferviews', async t => {
  const response = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  const tile = await parse(response, [Tiles3DLoader, DracoLoader]);
  t.ok(tile);
  t.ok(tile.gltf);
  t.equals(tile.type, 'b3dm', 'Should parse the correct tiles type.');
  t.end();
});
