// This code is inspired by example code in the DRACO repository
/** @typedef {import('../types/draco-types')} Draco3D */
/** @typedef {import('../types/draco-types').Decoder} Decoder */
import {getMeshBoundingBox} from '@loaders.gl/loader-utils';

const GEOMETRY_TYPE = {
  TRIANGULAR_MESH: 0,
  POINT_CLOUD: 1
};

// Native Draco attribute names to GLTF attribute names.
const DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP = {
  POSITION: 'POSITION',
  NORMAL: 'NORMAL',
  COLOR: 'COLOR_0',
  TEX_COORD: 'TEXCOORD_0'
};

const DRACO_DATA_TYPE_TO_TYPED_ARRAY_MAP = {
  1: Int8Array,
  2: Uint8Array,
  3: Int16Array,
  4: Uint16Array,
  5: Int32Array,
  6: Uint32Array,
  9: Float32Array
};

export default class DracoParser {
  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco) {
    /** @type {Draco3D} */
    this.draco = draco;
    this.drawMode = 'TRIANGLE';
  }

  destroy() {}

  destroyGeometry(dracoGeometry) {
    if (dracoGeometry) {
      this.draco.destroy(dracoGeometry.dracoGeometry);
    }
  }

  // NOTE: caller must call `destroyGeometry` on the return value after using it
  parseSync(arrayBuffer, options = {}) {
    const buffer = new this.draco.DecoderBuffer();
    buffer.Init(new Int8Array(arrayBuffer), arrayBuffer.byteLength);

    const decoder = new this.draco.Decoder();

    const data = {};
    let dracoStatus;
    let dracoGeometry;
    let header;

    try {
      const geometryType = decoder.GetEncodedGeometryType(buffer);
      switch (geometryType) {
        case this.draco.TRIANGULAR_MESH:
          dracoGeometry = new this.draco.Mesh();
          dracoStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
          header = {
            type: GEOMETRY_TYPE.TRIANGULAR_MESH,
            faceCount: dracoGeometry.num_faces(),
            attributeCount: dracoGeometry.num_attributes(),
            vertexCount: dracoGeometry.num_points()
          };
          break;

        case this.draco.POINT_CLOUD:
          dracoGeometry = new this.draco.PointCloud();
          dracoStatus = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
          header = {
            type: GEOMETRY_TYPE.POINT_CLOUD,
            attributeCount: dracoGeometry.num_attributes(),
            vertexCount: dracoGeometry.num_points()
          };
          break;

        default:
          throw new Error('Unknown DRACO geometry type.');
      }

      // @ts-ignore .ptr
      if (!dracoStatus.ok() || !dracoGeometry.ptr) {
        const message = `DRACO decompression failed: ${dracoStatus.error_msg()}`;
        // console.error(message);
        if (dracoGeometry) {
          this.draco.destroy(dracoGeometry);
        }
        throw new Error(message);
      }

      data.loaderData = {header};

      this._extractDRACOGeometry(decoder, dracoGeometry, geometryType, data, options);

      data.header = {
        vertexCount: header.vertexCount,
        boundingBox: getMeshBoundingBox(data.attributes)
      };
    } finally {
      this.draco.destroy(decoder);
      this.draco.destroy(buffer);
    }

    return data;
  }

  /**
   * @param {Decoder} decoder
   * @param {*} dracoGeometry
   * @param {*} geometryType
   * @param {*} geometry
   * @param {object} options
   */
  _extractDRACOGeometry(decoder, dracoGeometry, geometryType, geometry, options) {
    const attributes = this._getAttributes(decoder, dracoGeometry, options);

    const positionAttribute = attributes.POSITION;
    if (!positionAttribute) {
      throw new Error('DRACO decompressor: No position attribute found.');
    }

    // For meshes, we need indices to define the faces.
    if (geometryType === this.draco.TRIANGULAR_MESH) {
      attributes.indices =
        this.drawMode === 'TRIANGLE_STRIP'
          ? /**
             *
             * @param {*} decoder
             * @param {*} dracoGeometry
             */
            this._getMeshStripIndices(decoder, dracoGeometry)
          : this._getMeshFaceIndices(decoder, dracoGeometry);
      geometry.mode =
        this.drawMode === 'TRIANGLE_STRIP'
          ? 5 // GL.TRIANGLE_STRIP
          : 4; // GL.TRIANGLES
    } else {
      geometry.mode = 0; // GL.POINTS
    }

    if (attributes.indices) {
      geometry.indices = {value: attributes.indices, size: 1};
      delete attributes.indices;
    }
    geometry.attributes = attributes;

    return geometry;
  }

  _getAttributes(decoder, dracoGeometry, options) {
    const attributes = {};
    const numPoints = dracoGeometry.num_points();
    // const attributeUniqueIdMap = {};

    // Note: Draco docs do not seem clear on `GetAttribute` accepting a zero-based index,
    // but it seems to work this way
    for (let attributeId = 0; attributeId < dracoGeometry.num_attributes(); attributeId++) {
      const dracoAttribute = decoder.GetAttribute(dracoGeometry, attributeId);
      const attributeData = {
        uniqueId: dracoAttribute.unique_id(),
        attributeType: dracoAttribute.attribute_type(),
        dataType: DRACO_DATA_TYPE_TO_TYPED_ARRAY_MAP[dracoAttribute.data_type()],
        size: dracoAttribute.size(),
        numComponents: dracoAttribute.num_components(),
        byteOffset: dracoAttribute.byte_offset(),
        byteStride: dracoAttribute.byte_stride(),
        normalized: dracoAttribute.normalized()
      };

      // DRACO does not save attribute names - We need to deduce an attribute name
      const attributeName = this._deduceAttributeName(attributeData, options);
      const {typedArray} = this._getAttributeTypedArray(
        decoder,
        dracoGeometry,
        dracoAttribute,
        attributeName
      );
      attributes[attributeName] = {
        value: typedArray,
        size: typedArray.length / numPoints
      };
    }

    return attributes;
  }

  /**
   * For meshes, we need indices to define the faces.
   * @param {Decoder} decoder
   * @param {*} dracoGeometry
   */
  _getMeshFaceIndices(decoder, dracoGeometry) {
    // Example on how to retrieve mesh and attributes.
    const numFaces = dracoGeometry.num_faces();

    const numIndices = numFaces * 3;
    const indices = new Uint32Array(numIndices);
    const dracoArray = new this.draco.DracoInt32Array();
    for (let i = 0; i < numFaces; ++i) {
      decoder.GetFaceFromMesh(dracoGeometry, i, dracoArray);
      const index = i * 3;
      indices[index] = dracoArray.GetValue(0);
      indices[index + 1] = dracoArray.GetValue(1);
      indices[index + 2] = dracoArray.GetValue(2);
    }

    this.draco.destroy(dracoArray);
    return indices;
  }

  /**
   * For meshes, we need indices to define the faces.
   * @param {Decoder} decoder
   * @param {*} dracoGeometry
   */
  _getMeshStripIndices(decoder, dracoGeometry) {
    const dracoArray = new this.draco.DracoInt32Array();
    /* const numStrips = */ decoder.GetTriangleStripsFromMesh(dracoGeometry, dracoArray);
    const indices = new Uint32Array(dracoArray.size());
    for (let i = 0; i < dracoArray.size(); ++i) {
      indices[i] = dracoArray.GetValue(i);
    }
    this.draco.destroy(dracoArray);
    return indices;
  }

  /**
   *
   * @param {Decoder} decoder
   * @param {*} dracoGeometry
   * @param {*} dracoAttribute
   * @param {*} attributeName
   */
  _getAttributeTypedArray(decoder, dracoGeometry, dracoAttribute, attributeName) {
    if (dracoAttribute.ptr === 0) {
      const message = `DRACO decode bad attribute ${attributeName}`;
      // console.error(message);
      throw new Error(message);
    }

    const attributeType = DRACO_DATA_TYPE_TO_TYPED_ARRAY_MAP[dracoAttribute.data_type()];
    const numComponents = dracoAttribute.num_components();
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;

    let dracoArray;
    let typedArray;

    switch (attributeType) {
      case Float32Array:
        dracoArray = new this.draco.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Float32Array(numValues);
        break;

      case Int8Array:
        dracoArray = new this.draco.DracoInt8Array();
        decoder.GetAttributeInt8ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Int8Array(numValues);
        break;

      case Int16Array:
        dracoArray = new this.draco.DracoInt16Array();
        decoder.GetAttributeInt16ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Int16Array(numValues);
        break;

      case Int32Array:
        dracoArray = new this.draco.DracoInt32Array();
        decoder.GetAttributeInt32ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Int32Array(numValues);
        break;

      case Uint8Array:
        dracoArray = new this.draco.DracoUInt8Array();
        decoder.GetAttributeUInt8ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Uint8Array(numValues);
        break;

      case Uint16Array:
        dracoArray = new this.draco.DracoUInt16Array();
        decoder.GetAttributeUInt16ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Uint16Array(numValues);
        break;

      case Uint32Array:
        dracoArray = new this.draco.DracoUInt32Array();
        decoder.GetAttributeUInt32ForAllPoints(dracoGeometry, dracoAttribute, dracoArray);
        typedArray = new Uint32Array(numValues);
        break;

      default:
        const errorMsg = 'DRACO decoder: unexpected attribute type.';
        // console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Copy data from decoder.
    for (let i = 0; i < numValues; i++) {
      typedArray[i] = dracoArray.GetValue(i);
    }

    this.draco.destroy(dracoArray);

    return {typedArray, components: numComponents};
  }

  /**
   * Deduce an attribute name.
   * @note DRACO does not save attribute names, just general type (POSITION, COLOR)
   * to help optimize compression. We generate GLTF compatible names for the Draco-recognized
   * types
   * @param {object} attributeData
   */
  _deduceAttributeName(attributeData, options) {
    const {extraAttributes = {}} = options;
    for (const [attributeName, attributeUniqueId] of Object.entries(extraAttributes)) {
      if (attributeUniqueId === attributeData.uniqueId) {
        return attributeName;
      }
    }

    for (const dracoAttributeConstant in DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP) {
      const attributeType = this.draco[dracoAttributeConstant];
      if (attributeData.attributeType === attributeType) {
        // TODO - Return unique names if there multiple attributes per type
        // (e.g. multiple TEX_COORDS or COLORS)
        return DRACO_TO_GLTF_ATTRIBUTE_NAME_MAP[dracoAttributeConstant];
      }
    }

    // TODO look for name in metadata?
    // The loaders.gl DracoEncoder could write a name into metadata...

    // Attribute of "GENERIC" type, we need to assign some name
    return `CUSTOM_ATTRIBUTE_${attributeData.uniqueId}`;
  }

  // DEPRECATED

  decode(arrayBuffer, options) {
    return this.parseSync(arrayBuffer, options);
  }
}
