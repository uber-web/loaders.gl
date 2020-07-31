# ZlibInflateTransform

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" /> 
</p>

## Static Methods

### `ZlibInflateTransform.inflate(data: ArrayBuffer, options?: object): Promise<ArrayBuffer>`

### `ZlibInflateTransform.inflateSync(data: ArrayBuffer, options?: object): ArrayBuffer`

Decompresses (inflates) Zlib encoded data.

## Remarks

- options are passed through to the underlying `pako` library.
