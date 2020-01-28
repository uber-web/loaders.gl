# JSONLoader

Streaming loader for JSON encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.json`,                                             |
| File Type      | Text                                                 |
| File Format    | [JSON](https://www.json.org/json-en.html)            |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

## Usage

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, JSONLoader, {json: options});
```

The JSONLoader supports streaming JSON parsing, in which case it will yield "batches" of rows from the first array it encounters in the JSON. To e.g. parse a stream of GeoJSON:

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await loadInBatches('geojson.json', JSONLoader);

for await (const batch of batches) {
  // batch.data will contain a number of rows
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
      ...
    }
  }
}
```

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option            | Type    | Default | Description                                                            |
| ----------------- | ------- | ------- | ---------------------------------------------------------------------- |
| `json.table`      | Boolean | TBD     | Parse JSON as table, i.e. return the first embedded array in the JSON. |
| `json._container` | Boolean | TBD     | Yield batches of                                                       |

## About streaming loading

When batch parsing an embedded JSON array as a table, set `{json: {_container: true}}` to get access to the containing object. The loader will yield an initial and a final batch with the wrapper object in `batch.container` and `batch.batchType` set to `opencontainer` and `closecontainer` respectively.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
