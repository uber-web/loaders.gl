import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {isTileGeometryInsideBoundingVolume, getGeometryVsTextureMetrics} from '../tile-debug';

const TileValidatorContainer = styled.div`
  display: flex;
  margin: 10px 0;
  flex-direction: column;
`;

const ValidateButton = styled.button`
  display: flex;
  padding: 6px 12px;
  color: white;
  background: green;
  align-items: center;
  height: 20px;
  width: 100px;
  cursor: pointer;
  margin-bottom: 5px;
`;

const ValidatorInfoList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 100px;
  overflow-y: scroll;
`;

const VALIDATE_TILE = 'Validate Tile';
const WARNING_TYPE = 'warning';
const OK_TYPE = 'ok';

const propTypes = {
  tile: PropTypes.object
};

const defaultProps = {
  tile: null
};

export default class TileValidator extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      geometryInfo: null,
      triangleMessages: null
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.tile.id !== prevProps.tile.id) {
      this.setState({geometryInfo: null, triangleMessages: null});
    }
  }

  _onValidateTile(tile) {
    this._validateGeometryInsideBoundingVolume(tile);
    this._validateGeometryVsTexture(tile);
  }

  _validateGeometryInsideBoundingVolume(tile) {
    const result = isTileGeometryInsideBoundingVolume(tile);

    if (result instanceof Error) {
      const geometryError = 'Geometry validation error';
      this.setState({geometryInfo: {type: WARNING_TYPE, title: geometryError}});
    }

    if (!result) {
      const geometryError = `Geometry doesn't fit into BoundingVolume`;
      this.setState({geometryInfo: {type: WARNING_TYPE, title: geometryError}});
    } else {
      const geometryError = `Geometry fits into BoundingVolume`;
      this.setState({geometryInfo: {type: OK_TYPE, title: geometryError}});
    }
  }

  _validateGeometryVsTexture(tile) {
    const triangleMetrics = getGeometryVsTextureMetrics(tile);
    if (!triangleMetrics) {
      return;
    }
    const triangleMessages = [];
    triangleMessages.push({
      key: 'trianglesTotal',
      text: `Triangles total: ${triangleMetrics.triangles}`
    });
    if (triangleMetrics.geometryNullTriangleCount) {
      triangleMessages.push({
        key: 'geometryNullTriangleCount',
        type: WARNING_TYPE,
        text: `Geometry triangles area is null: ${triangleMetrics.geometryNullTriangleCount}`
      });
    } else {
      triangleMessages.push({
        key: 'geometryNullTriangleCount',
        type: OK_TYPE,
        text: `Geometry triangles area is null: ${triangleMetrics.geometryNullTriangleCount}`
      });
    }

    if (triangleMetrics.geometrySmallTriangleCount) {
      triangleMessages.push({
        key: 'geometrySmallTriangleCount',
        type: WARNING_TYPE,
        text: `Geometry small triangles (less than 1 squared mm): ${
          triangleMetrics.geometrySmallTriangleCount
        }`
      });
      triangleMessages.push({
        key: 'minGeometryArea',
        type: WARNING_TYPE,
        text: `Geometry smallest triangle: ${triangleMetrics.minGeometryArea} m^2`
      });
    } else {
      triangleMessages.push({
        key: 'geometrySmallTriangleCount',
        type: OK_TYPE,
        text: `Geometry small triangles (less than 1 squared mm): ${
          triangleMetrics.geometrySmallTriangleCount
        }`
      });
    }

    if (triangleMetrics.texCoordNullTriangleCount) {
      triangleMessages.push({
        key: 'texCoordNullTriangleCount',
        type: WARNING_TYPE,
        text: `UV0 triangles area is null: ${triangleMetrics.texCoordNullTriangleCount}`
      });
    } else {
      triangleMessages.push({
        key: 'texCoordNullTriangleCount',
        type: OK_TYPE,
        text: `UV0 triangles area is null: ${triangleMetrics.texCoordNullTriangleCount}`
      });
    }

    if (triangleMetrics.texCoordSmallTriangleCount) {
      triangleMessages.push({
        key: 'texCoordSmallTriangleCount',
        type: WARNING_TYPE,
        text: `UV0 small triangles (occupies less than 1 pixel): ${
          triangleMetrics.texCoordSmallTriangleCount
        }`
      });
      triangleMessages.push({
        key: 'minTexCoordArea',
        type: WARNING_TYPE,
        text: `UV0 smallest triangle: ${triangleMetrics.minTexCoordArea}`
      });
      triangleMessages.push({
        key: 'pixelArea',
        type: WARNING_TYPE,
        text: `UV0 pixel area: ${triangleMetrics.pixelArea}`
      });
    } else {
      triangleMessages.push({
        key: 'texCoordSmallTriangleCount',
        type: OK_TYPE,
        text: `UV0 small triangles (less than 1 squared mm): ${
          triangleMetrics.texCoordSmallTriangleCount
        }`
      });
    }
    this.setState({triangleMessages});
  }

  getInfoStyle(type) {
    return {
      color: type === WARNING_TYPE ? 'red' : 'green',
      marginTop: '10px'
    };
  }

  _renderTriangleMetrics() {
    const {triangleMessages} = this.state;
    if (!triangleMessages) {
      return null;
    }
    return triangleMessages.map(message => (
      <span key={message.key} style={this.getInfoStyle(message.type)}>
        {message.text}
      </span>
    ));
  }

  render() {
    const {tile} = this.props;
    const {geometryInfo} = this.state;

    return (
      <TileValidatorContainer>
        <ValidateButton onClick={() => this._onValidateTile(tile)}>{VALIDATE_TILE}</ValidateButton>
        <ValidatorInfoList>
          {geometryInfo && (
            <span style={this.getInfoStyle(geometryInfo.type)}>{geometryInfo.title}</span>
          )}
          {this._renderTriangleMetrics()}
        </ValidatorInfoList>
      </TileValidatorContainer>
    );
  }
}

TileValidator.propTypes = propTypes;
TileValidator.defaultProps = defaultProps;
