import {GL} from '../constants';

// Reference:
// https://github.com/AnalyticalGraphicsInc/cesium/blob/1de96d087f0b17575eb1a3f736407b348c765d59/Source/Scene/Cesium3DTileFeatureTable.js
export default class Tile3DFeatureTable {
  constructor({featureTableJson, featureTableBinary}) {
    this.json = featureTableJson;
    this.buffer = featureTableBinary;
    this.featuresLength = 0;
    this._cachedTypedArrays = {};
  }

  getExtension(extensionName) {
    return this.json.extensions && this.json.extensions[extensionName];
  }

  hasProperty(propertyName) {
    return Boolean(this.json[propertyName]);
  }

  getGlobalProperty(propertyName, componentType = GL.UNSIGNED_INT, componentLength = 1) {
    const jsonValue = this.json[propertyName];

    if (jsonValue && Number.isFinite(jsonValue.byteOffset)) {
      return this._getTypedArrayFromBinary(
        propertyName,
        componentType,
        componentLength,
        1,
        jsonValue.byteOffset
      );
    }

    return jsonValue;
  }

  getPropertyArray(propertyName, componentType, componentLength) {
    const jsonValue = this.json[propertyName];

    if (jsonValue && Number.isFinite(jsonValue.byteOffset)) {
      if ('componentType' in jsonValue) {
        // componentType = ComponentDatatype.fromName(jsonValue.componentType);
      }
      return this._getTypedArrayFromBinary(
        this,
        propertyName,
        componentType,
        componentLength,
        this.featuresLength,
        jsonValue.byteOffset
      );
    }

    return this._getTypedArrayFromArray(this, propertyName, componentType, jsonValue);
  }

  getProperty(propertyName, componentType, componentLength, featureId, result) {
    const jsonValue = this.json[propertyName];
    if (!jsonValue) {
      return jsonValue;
    }

    const typedArray = this.getPropertyArray(propertyName, componentType, componentLength);

    if (componentLength === 1) {
      return typedArray[featureId];
    }

    for (let i = 0; i < componentLength; ++i) {
      result[i] = typedArray[componentLength * featureId + i];
    }

    return result;
  }

  // HELPERS

  _getTypedArrayFromBinary(propertyName, componentType, componentLength, count, byteOffset) {
    // const cachedTypedArrays = this._cachedTypedArrays;
    // let typedArray = cachedTypedArrays[propertyName];
    // if (!typedArray) {
    //   typedArray = ComponentDatatype.createArrayBufferView(
    //     componentType,
    //     this.buffer.buffer,
    //     this.buffer.byteOffset + byteOffset,
    //     count * componentLength
    //   );
    //   cachedTypedArrays[propertyName] = typedArray;
    // }
    // return typedArray;
  }

  _getTypedArrayFromArray(propertyName, componentType, array) {
    // const cachedTypedArrays = this._cachedTypedArrays;
    // const typedArray = cachedTypedArrays[propertyName];
    // if (!typedArray) {
    //   typedArray = ComponentDatatype.createTypedArray(componentType, array);
    //   cachedTypedArrays[propertyName] = typedArray;
    // }
    // return typedArray;
  }
}
