// LOADING FUNCTIONS

export {loadFile} from './common/file-utils/load-file';
export {loadBinaryFile} from './common/file-utils/load-binary-file';
export {smartFetch, smartParse} from './common/file-utils/smart-fetch';
export {saveBinaryFile} from './common/file-utils/save-binary-file';

export {loadUri} from './common/loader-utils/load-uri.js';

// UTILS

export {
  isImage,
  getImageSize
} from './common/loader-utils/get-image-size';

export {
  toArrayBuffer,
  toBuffer,
  toDataView
} from './common/loader-utils/binary-utils';

export {
  TextDecoder,
  TextEncoder
} from './common/loader-utils/text-encoding';

// LOADER UTILS

export {default as assert} from './common/loader-utils/assert';

export {flattenToTypedArray} from './common/loader-utils/flatten';

export {
  padTo4Bytes,
  copyArrayBuffer
} from './common/loader-utils/array-utils';

export {
  getAccessorTypeFromSize,
  getComponentTypeFromArray
} from './common/mesh-utils/gltf-type-utils';
export {
  getGLTFAccessors,
  getGLTFIndices,
  getGLTFAttributeMap
} from './common/mesh-utils/gltf-attribute-utils';

export {getMeshSize as _getMeshSize} from './common/mesh-utils/mesh-utils';
