# Tiles3DLoader

Parses a [3D tile](https://github.com/AnalyticalGraphicsInc/3d-tiles).

| Loader                | Characteristic                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| File Extensions       | `.b3dm`,`.i3dm`, `.pnts`, `.cmpt`                                                                                  |
| File Type             | Binary (with linked assets)                                                                                        |
| File Format           | [3D Tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#tile-format-specifications) |
| Data Format           | [Data Formats](#data-formats)                                                                                      |
| Decoder Type          | Asynchronous                                                                                                       |
| Worker Thread Support | No                                                                                                                 |
| Streaming Support     | No \*                                                                                                              |
| Subloaders            | `DracoLoader` (`.pnts`), `GLTFLoader` (`.b3dm`, `.i3dm`)                                                           |

\* Streaming is not supported for individual tiles, however tilesets are streamed by loading only the tiles needed for the

## Usage

Load a tileset file.

```js
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
const tilesetUrl = 'https://assets.cesium.com/43978/tileset.json';
const tilesetJson = await load(tilesetUrl, Tiles3DLoader);
```

To decompress tiles containing Draco compressed glTF models or Draco compressed point clouds:

```js
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {DracoWorkerLoader} from '@loaders.gl/draco';
const tileUrl = 'https://assets.cesium.com/43978/1.pnts';
const tile = await load(tileUrl, Tiles3DLoader, {DracoWorkerLoader, decompress: true});
```

Load a tileset and dynamically load/unload tiles based on viewport with helper class `Tileset3D` (`@loaders.gl/tiles`)

```js
import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import WebMercatorViewport from '@math.gl/web-mercator';

const tilesetUrl = 'https://assets.cesium.com/43978/tileset.json';
const tilesetJson = await load(tilesetUrl, Tiles3DLoader);
const tileset3d = new Tileset3D(tilesetJson, {
  onTileLoad: tile => console.log(tile)
});

const viewport = new WebMercatorViewport({latitude, longitude, zoom});
tileset3d.update(viewport);

// visible tiles
const visibleTiles = tileset3d.tiles.filter(tile => tile.selected);
// Note that visibleTiles will likely not immediately include all tiles
// tiles will keep loading and file `onTileLoad` callbacks
```

## Options

| Option               | Type   | Default | Description                                                                            |
| -------------------- | ------ | ------- | -------------------------------------------------------------------------------------- |
| `3d-tiles.isTileset` | Bool   | `false` | Whether to load a `Tileset` file. If not specifies, will infer based on url extension. |
| `3d-tiles.headers`   | Object | null    | Used to load data from server                                                          |

To enable parsing of DRACO compressed point clouds and glTF tiles, make sure to first register the [DracoLoader](/docs/api-reference/draco/draco-loader).

Point cloud tie options

| Option                              | Type      | Default | Description                          |
| ----------------------------------- | --------- | ------- | ------------------------------------ |
| `3d-tiles.decodeQuantizedPositions` | `Boolean` | `false` | Pre-decode quantized position on CPU |

For i3dm and b3dm tiles:

| Option              | Type    | Default | Description                           |
| ------------------- | ------- | ------- | ------------------------------------- |
| `3d-tiles.loadGLTF` | Boolean | `true`  | Fetch and parse any linked glTF files |

If `options['3d-tiles'].loadGLTF` is `true`, GLTF loading can be controlled by providing [`GLTFLoader` options](modules/gltf/docs/api-reference/gltf-loader.md) via the `options.gltf` sub options.

## Notes about Tile Types

### b3dm, i3dm

glTF file into a hierarchical Scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries. Can load both binary `.glb` files and JSON `.gltf` files.

## Data formats

This section specifies the loaded data formats.

### Tileset Object

The following fields are guaranteed. Additionally, the loaded tileset object will contain all the data fetched from the provided url.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                                                                   |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loader`         | `Object` | Tiles3DLoader                                                                                                                                                                                                                                                                                                              |
| `root`           | `Object` | The root tile header object                                                                                                                                                                                                                                                                                                |
| `url`            | `String` | The url of this tileset                                                                                                                                                                                                                                                                                                    |
| `type`           | `String` | Value is `TILES3D`. Indicates the returned object is a Cesium `3D Tiles` tileset.                                                                                                                                                                                                                                          |
| `lodMetricType`  | `String` | Root's Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Used for deciding if this tile is sufficient given current viewport. Cesium use [`geometricError`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#geometric-error). |
| `lodMetricValue` | `Number` | Root's level of detail (LoD) metric value.                                                                                                                                                                                                                                                                                 |

### Tile Object

The following fields are guaranteed. Additionally, the loaded tile object will contain all the data fetched from the provided url.

| Field             | Type         | Contents                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`             | `String`     | The url of this tile.                                                                                                                                                                                                                                                                                               |
| `contentUrl`      | `String`     | The contentUrl of this tile.                                                                                                                                                                                                                                                                                        |
| `boundingVolume`  | `Object`     | A bounding volume in Cartesian coordinates that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))                                                               |
| `lodMetricType`   | `String`     | Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Used for deciding if this tile is sufficient given current viewport. Cesium use [`geometricError`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#geometric-error). |
| `lodMetricValue`  | `String`     | Level of Detail (LoD) metric value.                                                                                                                                                                                                                                                                                 |
| `children`        | `Array`      | An array of objects that define child tiles. Each child tile content is fully enclosed by its parent tile's bounding volume and, generally, has more details than parent. for leaf tiles, the length of this array is zero, and children may not be defined.                                                        |
| `content`         | `String`     | The actual payload of the tile or the url point to the actual payload.                                                                                                                                                                                                                                              |
| `id`              | `String`     | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                                                                         |
| `refine`          | `String`     | Refinement type of the tile, `ADD` or `REPLACE`                                                                                                                                                                                                                                                                     |
| `type`            | `String`     | Type of the tile, one of `pointcloud` (`.pnts`), `scenegraph` (`.i3dm`, `.b3dm`)                                                                                                                                                                                                                                    |
| `transformMatrix` | `Number[16]` | A matrix that transforms from the tile's local coordinate system to the parent tile's coordinate system—or the tileset's coordinate system in the case of the root tile                                                                                                                                             |

### Tile Content

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type         | Contents                                                                                                                               |
| -------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `cartesianOrigin`    | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                                             |
| `cartographicOrigin` | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                                                 |
| `modelMatrix`        | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                                                          |
| `attributes`         | `Object`     | Each attribute follows luma.gl [accessor](https://github.com/uber/luma.gl/blob/master/docs/api-reference/webgl/accessor.md) properties |

`attributes` contains following fields

| Field                  | Type     | Contents                          |
| ---------------------- | -------- | --------------------------------- |
| `attributes.positions` | `Object` | `{value, type, size, normalized}` |
| `attributes.normals`   | `Object` | `{value, type, size, normalized}` |
| `attributes.colors`    | `Object` | `{value, type, size, normalized}` |

PointCloud Fields

| Field        | Type                       | Contents                                                 |
| ------------ | -------------------------- | -------------------------------------------------------- |
| `pointCount` | `Number`                   | Number of points                                         |
| `color`      | `Number[3]` or `Number[4]` | Color of the tile when there are not `attributes.colors` |

Scenegraph Fields

| Field  | Type     | Contents                                                                                             |
| ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `gltf` | `Object` | check [GLTFLoader](https://loaders.gl/modules/gltf/docs/api-reference/gltf-loader) for detailed spec |
