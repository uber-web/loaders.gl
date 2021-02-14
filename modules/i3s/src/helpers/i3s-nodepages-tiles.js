import {load} from '@loaders.gl/core';
import {normalizeTileNonUrlData} from '../lib/parsers/parse-i3s';
import {convertI3SObbToMbs} from '../utils/convert-i3s-obb-to-mbs';
import {I3SNodePageLoader} from '../i3s-node-page-loader';
import {generateTilesetAttributeUrls} from '../lib/parsers/url-utils';
import {getSupportedGPUTextureFormats} from '@loaders.gl/textures';

export default class I3SNodePagesTiles {
  constructor(tileset, options) {
    this.tileset = tileset;
    this.nodesPerPage = tileset.nodePages.nodesPerPage;
    this.lodSelectionMetricType = tileset.nodePages.lodSelectionMetricType;
    this.options = options;
    this.nodePages = [];
    this.textureDefinitionsSelectedFormats = [];

    this._initSelectedFormatsForTextureDefinitions(tileset);
  }

  async getNodeById(id) {
    const pageIndex = Math.floor(id / this.nodesPerPage);
    if (!this.nodePages[pageIndex]) {
      const nodePageUrl = `${this.tileset.url}/nodepages/${pageIndex}`;
      this.nodePages[pageIndex] = load(nodePageUrl, I3SNodePageLoader, this.options);
      this.nodePages[pageIndex] = await this.nodePages[pageIndex];
    }
    if (this.nodePages[pageIndex] instanceof Promise) {
      this.nodePages[pageIndex] = await this.nodePages[pageIndex];
    }
    const nodeIndex = id % this.nodesPerPage;
    return this.nodePages[pageIndex].nodes[nodeIndex];
  }

  async formTileFromNodePages(id) {
    const node = await this.getNodeById(id);
    const children = [];
    for (const child of node.children || []) {
      const childNode = await this.getNodeById(child);
      children.push({
        id: child,
        obb: childNode.obb,
        mbs: convertI3SObbToMbs(childNode.obb)
      });
    }

    let contentUrl = null;
    let textureUrl = null;
    let materialDefinition = null;
    let textureFormat = 'jpeg';
    let attributeUrls = [];

    if (node && node.mesh) {
      if (node.mesh.geometry) {
        contentUrl = `${this.tileset.url}/nodes/${node.mesh.geometry.resource}/geometries/0`;
      }

      const [textureData, nodeMaterialDefinition] = this._getInformationFromMaterial(
        node.mesh.material
      );
      materialDefinition = nodeMaterialDefinition;
      textureFormat = textureData.format || textureFormat;
      if (textureData.name) {
        textureUrl = `${this.tileset.url}/nodes/${node.mesh.material.resource}/textures/${
          textureData.name
        }`;
      }

      if (this.tileset.attributeStorageInfo) {
        attributeUrls = generateTilesetAttributeUrls(this.tileset, node.mesh.material.resource);
      }
    }

    const lodSelection = [];
    if (this.lodSelectionMetricType === 'maxScreenThresholdSQ') {
      lodSelection.push({
        metricType: 'maxScreenThreshold',
        maxError: Math.sqrt(node.lodThreshold / (Math.PI * 0.25))
      });
    }
    lodSelection.push({
      metricType: this.lodSelectionMetricType,
      maxError: node.lodThreshold
    });

    return normalizeTileNonUrlData({
      id,
      lodSelection,
      obb: node.obb,
      mbs: convertI3SObbToMbs(node.obb),
      contentUrl,
      textureUrl,
      attributeUrls,
      materialDefinition,
      textureFormat,
      children
    });
  }

  _getInformationFromMaterial(material) {
    const textureDataDefault = {name: null, format: null};
    if (material) {
      const materialDefinition = this.tileset.materialDefinitions[material.definition];
      const textureSetDefinitionIndex =
        materialDefinition &&
        materialDefinition.pbrMetallicRoughness &&
        materialDefinition.pbrMetallicRoughness.baseColorTexture &&
        materialDefinition.pbrMetallicRoughness.baseColorTexture.textureSetDefinitionId;
      if (textureSetDefinitionIndex || textureSetDefinitionIndex === 0) {
        const textureData =
          this.textureDefinitionsSelectedFormats[textureSetDefinitionIndex] || textureDataDefault;
        return [textureData, materialDefinition];
      }
      return [textureDataDefault, materialDefinition];
    }
    return [textureDataDefault, null];
  }

  _initSelectedFormatsForTextureDefinitions(tileset) {
    this.textureDefinitionsSelectedFormats = [];
    const possibleI3sFormats = this._getSupportedTextureFormats();
    const textureSetDefinitions = tileset.textureSetDefinitions || [];
    for (const textureSetDefinition of textureSetDefinitions) {
      const formats = (textureSetDefinition && textureSetDefinition.formats) || [];
      let selectedFormat = null;
      for (const i3sFormat of possibleI3sFormats) {
        const format = formats.find(value => value.format === i3sFormat);
        if (format) {
          selectedFormat = format;
          break;
        }
      }
      this.textureDefinitionsSelectedFormats.push(selectedFormat);
    }
  }

  _getSupportedTextureFormats() {
    const result = [];
    const supportedCompressedFormats = getSupportedGPUTextureFormats();
    // List of possible in i3s formats:
    // https://github.com/Esri/i3s-spec/blob/master/docs/1.7/textureSetDefinitionFormat.cmn.md
    if (supportedCompressedFormats.has('etc2')) {
      result.push('ktx-etc2');
    }
    if (supportedCompressedFormats.has('dxt')) {
      result.push('dds');
    }
    result.push('jpg');
    result.push('png');
    return result;
  }
}
