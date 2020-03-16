# What's New

## v2.1 (In Development)

Target Release Date: mid-Feb, 2019. `alpha` releases will be made available.

**@loaders.gl/core**

- The `load` and `parse` functions can now read data directly from `Stream` objects both in node and browser.

**@loaders.gl/arrow**

- The ArrowJS dependency has been upgraded to v0.16.
- The ArrowJS API documentation in the loaders.gl website has been improved.

**@loaders.gl/images**

- Images can now be loaded as data: Using the `ImageLoader` with `options.image.type: 'data'` parameter will return an _image data object_ with width, height and a typed array containing the image data (instead of an opaque `Image` or `ImageBitmap` instance).
- `ImageBitmap` loading now works reliably, use `ImageLoader` with `options.image.type: 'imagebitmap'`.

**@loaders.gl/json**

- The streaming JSON loader now has an experimental option `_rootObjectBatches` that returns the top-level JSON object containing the JSON array being streamed, as additional first (partial) and last (complete) batches.

**@loaders.gl/i3s** (new loader module)

- New loader module for loading [I3S](https://github.com/Esri/i3s-spec) tiles.

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td style="text-align: center;">
        <img style="max-height:200px" src="https://raw.github.com/uber-web/loaders.gl/master/website/static/images/example-i3s.jpg" />
        <p><strong>Tiles3DLoader</strong></p>
      </td>
    </tr>
  </tbody>
</table>

**@loaders.gl/mvt** (new loader module)

- New loader module for loading [Mapbox Vector Tiles](https://github.com/mapbox/vector-tile-spec) tiles.

**@loaders.gl/terrain** (new loader module)

- New loader module for reconstructing mesh surfaces from height map images.

**@loaders.gl/wkt** (new loader module)

- New loader module for the Well-Known Text geometry format.

## v2.0

Release Date: Dec 20, 2019

The 2.0 release brings potentially dramatic bundle size savings through dynamic loading of loaders and workers, significant overhauls to several loaders including , image loading improvements and the glTF loader, and a powerful loader composition system.

- **Loader-Specific Options** Each loader now defines its own sub object in the options object. This makes it possible to cleanly specify options for multiple loaders at the same time. This is helpful when loaders.gl auto-selects a pre-registered loader or when passing options to a sub-loader when using a composite loader.

- **Smaller Loaders** Big loaders such as `DracoLoader` and `BasisLoader` that use large libraries (e.g. WASM/WebAssembly or emscripten/C++ transpiled to JavaScript) now load those libraries dynamically from `unpkg.com` CDN resulting in dramatic bundle size savings. E.g the bundle size impact of the `DracoLoader` was reduced from > 1MB to just over 10KB.

- **Worker Loaders**

  - Ease-of-use: Worker loading is provided by the main loader objects. It is not necessary to import the `...WorkerLoader` objects to enable worker loading (but see below about bundle size)
  - Performance: Loading on worker threads is now the default: All worker enabled loaders now run on worker threads by default (set `options.worker: false` to disable worker-thread loading and run the loader on the main thread).
  - Debugging: Development builds of workers are now available on `unpkg.com` CDN, eabling debugging of worker loaders.
  - Bundle size: Workers are no longer bundled, but loaded from from the `unpkg.com` CDN.
  - Bundle size: Note that the old `...WorkerLoader` classes are still available. Using these can save even more bundle space since during tree-shaking since they do not depend on the non-worker parser.

- **Composite Loaders**
  - The new _composite loader_ architecture enables complex loaders like `Tiles3DLoader` and `GLTFLoader` to be composed from more primitive loaders without losing the ability to run some parts on worker, pass arguments to sub-loaders etc.

### New Loader Modules

- **@loaders.gl/basis** (Experimental) A new module for the basis format that enables. This module also provides a `CompressedImageLoader` for more traditional compressed images.
- **@loaders.gl/json** (Experimental) A new streaming `JSONLoader` that supports batched (i.e. streaming) parsing from standard JSON files, e.g. geojson. No need to reformat your files as line delimited JSON.

### Update Loader Modules

- `@loaders.gl/gltf` the `GLTFLoader` is now a "composite loader". The perhaps most important change is that `load(url, GLTFLoader)` also loads all sub-assets, including images, Draco compressed meshes, etc making the loaded data easier for applications to use.
- `@loaders.gl/images` see below for a list of changes

### @loaders.gl/images Updates

- **New ImageLoader options** `options: {image: {}}` contain common options that apply across the category
  - `options.image.type`, Ability to control loaded image type enabling faster `ImageBitmap` instances to be loaded via `type: 'imagebitmap`. Default `auto` setting returns traditional HTML image objects.
- Image Decoding. `options.image.decodeHTML: true` - `ImageLoader` now ensures HTML images are completely decoded and ready to be used when the image is returned (by calling `Image.decode()`).

- **Parsed Image API** Since the type of images returned by the `ImageLoader` depends on the `{image: {type: ...}}` option, a set of functions are provided to work portably with loaded images: `isImage()`, `getImageType()`, `getImageData()`, ...
- **Binary Image API** Separate API to work with unparsed images in binary data form: `isBinaryImage()`, `getBinaryImageType()`, `getBinaryImageSize()`, ...
- **"Texture" Loading API** New methods `loadImages` and `loadImageCube` can signficantly simplify loading of arrays of arrays of (mipmapped) images that are often used in 3D applications. These methods allow an entire complex of images (e.g. 6 cube faces with 10 mip images each) to be loaded using a single async call.
- **Improved Node.js support** More image test cases are now run in both browser and Node.js and a couple of important Node.js issues were uncovered and fixed.

## v1.3

Release Date: Sep 13, 2019

The 1.3 release is focused on production quality 3D tiles support, maturing the v2 glTF parser, and provides some improvements to the core API.

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td style="text-align: center;">
        <img style="max-height:200px" src="https://raw.github.com/uber-web/loaders.gl/master/website/static/images/example-3d-tiles.png" />
        <p><strong>Tiles3DLoader</strong></p>
      </td>
    </tr>
  </tbody>
</table>

### @loaders.gl/3d-tiles

- **Tile3DLayer moved to deck.gl**

  - The `Tile3DLayer` can now be imported from `@deck.gl/geo-layers`, and no longer needs to be copied from the loaders.gl `3d-tiles` example

- **Batched 3D Model Tile Support**

  - `b3dm` tiles can now be loaded and displayed by the `Tile3DLayer` (in addition to `pnts` tiles).

- **Performance Tracking**

  - `Tileset3D` now contain a `stats` object which tracks the loading process to help profile big tilesets.
  - Easily displayed in your UI via the `@probe.gl/stats-widget` module (see 3d-tiles example).

- **Request Scheduling**
  - The `Tileset3D` class now cancels loads for not-yet loaded tiles that are no longer in view).
  - Scheduling dramatically improves loading performance when panning/zooming through large tilesets.

### @loaders.gl/gltf

- **Version 2 Improvements**
  - Select the new glTF parser by passing `options.gltf.parserVersion: 2` to the `GLTFLoader`.
  - Many improvements to the v2 glTF parser.

### @loaders.gl/core

- **Loader Selection Improvements**

  - The loader selection mechanism is now exposed to apps through the new `selectLoader` API.
  - Loaders can now examine the first bytes of a file
  - This complements the existing URL extension based auto detection mechanisms.

- **Worker Thread Pool**
  - Now reuses worker threads. Performance gains by avoiding worker startup overhead.
  - Worker threads are named, easy to track in debugger
  - Worker based loaders can now call `parse` recursively to delegate parsing of embedded data (e.g. glTF, Draco) to other loaders

## v1.2

The 1.2 release is a smaller release that resolves various issues encountered while using 1.1.

Release Date: Aug 8, 2019

- `@loaders.gl/core`: File Type Auto Detection now supports binary files
- `@loaders.gl/polyfills`: Fixed `TextEncoder` warnings
- `@loaders.gl/arrow`: Improved Node 8 support
- `@loaders.gl/images`: Image file extensions now added to loader object
- `@loaders.gl/gltf`: Generate default sampler parameters if none provided in gltf file

### @loaders.gl/3d-tiles (EXPERIMENTAL)

- Support for dynamic traversal of 3D tilesets (automatically loads and unloads tiles based on viewer position and view frustum).
- Support for loading tilesets from Cesium ION servers.
- Asynchronous tileset loading
- Auto centering of view based on tileset bounding volumes
- deck.gl `Tile3DLayer` class provided in examples.

## v1.1

The 1.1 release addresses a number of gaps in original loaders.gl release, introduces the `GLTFLoader`, and initiates work on 3DTiles support.

Release Date: May 30, 2019

<table style="border: 0;" align="center">
  <tbody>
    <tr>
      <td style="text-align: center;">
        <img style="max-height:200px" src="https://raw.github.com/uber-web/loaders.gl/master/website/static/images/example-gltf.jpg" />
        <p><strong>GLTFLoader</strong></p>
      </td>
    </tr>
  </tbody>
</table>

### @loaders.gl/core

- `fetchFile` function - Can now read browser `File` objects (from drag and drop or file selection dialogs).
- `isImage(arrayBuffer [, mimeType])` function - can now accept a MIME type as second argument.

### @loaders.gl/images

- `getImageMIMEType(arrayBuffer)` function ( EW) - returns the MIME type of the image in the supplied `ArrayBuffer`.
- `isImage(arrayBuffer [, mimeType])` function - can now accept a MIME type as second argument.

### @loaders.gl/gltf

- The glTF module has been refactored with the aim of simplifying the loaded data and orthogonalizing the API.
- "Embedded' GLB data (GLBs inside other binary formats) can now be parsed (e.g. the glTF parser can now extract embedded glTF inside 3D tile files).

- New classes/functions:
  - [`GLTFScenegraph`](/docs/api-reference/gltf/gltf-scenegraph) class (NEW) - A helper class that provides methods for structured access to and modification/creation of glTF data.
  - [`postProcessGLTF`](/docs/api-reference/gltf/post-process-gltf) function ( EW) - Function that performs a set of transformations on loaded glTF data that simplify application processing.
  - [`GLBLoader`](/docs/api-reference/gltf/glb-loader)/[`GLBWriter`](NEW) - loader/writer pair that enables loading/saving custom (non-glTF) data in the binary GLB format.
  - [`GLTFLoader`](/docs/api-reference/gltf/gltf-loader), letting application separately handle post-processing.

### @loaders.gl/3d-tiles (NEW MODULE)

- Support for the 3D tiles format is being developed in the new `@loaders.gl/3d-tiles` module.
- Loading of individual point cloud tiles, including support for Draco compression and compact color formats such as RGB565 is supported.

### @loaders.gl/polyfills (NEW MODULE)

Node support now requires importing `@loaders.gl/polyfills` before use. This reduces the number of dependencies, bundle size and potential build complications when using other loaders.gl modules when not using Node.js support.

### @loaders.gl/loader-utils (NEW MODULE)

Helper functions for loaders have been broken out from `@loaders.gl/core`. Individual loaders no longer depend on`@loaders.gl/core` but only on `@loaders.gl/loader-utils`.

## v1.0

Release Date: April 2019

First Official Release
