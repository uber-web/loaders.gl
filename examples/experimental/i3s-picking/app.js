/* global window, fetch, URL */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {load} from '@loaders.gl/core';
import {lumaStats} from '@luma.gl/core';
import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import MeshLayer from './mesh-layer/mesh-layer';

import {I3SLoader, I3SAttributeLoader} from '@loaders.gl/i3s';
import {StatsWidget} from '@probe.gl/stats-widget';

import {INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';
import ControlPanel from './components/control-panel';

import {INITIAL_MAP_STYLE} from './constants';

const TRANSITION_DURAITON = 4000;

const INITIAL_VIEW_STATE = {
  longitude: -120,
  latitude: 34,
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

const STATS_WIDGET_STYLE = {
  wordBreak: 'break-word',
  position: 'absolute',
  padding: 12,
  zIndex: '10000',
  maxWidth: 300,
  background: '#000',
  color: '#fff'
};

// Use our custom MeshLayer
class TileLayer extends Tile3DLayer {
  getSubLayerClass(id) {
    // if (id.startsWith('mesh')) - we only have one sublayer type
    return MeshLayer;
  }
}

function parseTilesetUrlFromUrl() {
  const parsedUrl = new URL(window.location.href);
  return parsedUrl.searchParams.get('url');
}

function parseTilesetUrlParams(url, options) {
  const parsedUrl = new URL(url);
  const index = url.lastIndexOf('/layers/0');
  let metadataUrl = url.substring(0, index);
  let token = options && options.token;
  if (parsedUrl.search) {
    token = parsedUrl.searchParams.get('token');
    metadataUrl = `${metadataUrl}${parsedUrl.search}`;
  }
  return {...options, tilesetUrl: url, token, metadataUrl};
}

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this._tilesetStatsWidget = null;
    this.state = {
      url: null,
      token: null,
      name: INITIAL_EXAMPLE_NAME,
      viewState: INITIAL_VIEW_STATE,
      selectedMapStyle: INITIAL_MAP_STYLE,
      attributeStorageInfo: []
    };
    this._onSelectTileset = this._onSelectTileset.bind(this);
  }

  componentDidMount() {
    this._memWidget = new StatsWidget(lumaStats.get('Memory Usage'), {
      framesPerUpdate: 1,
      formatters: {
        'GPU Memory': 'memory',
        'Buffer Memory': 'memory',
        'Renderbuffer Memory': 'memory',
        'Texture Memory': 'memory'
      },
      container: this._statsWidgetContainer
    });
    this._tilesetStatsWidget = new StatsWidget(null, {
      container: this._statsWidgetContainer
    });

    // Check if a tileset is specified in the query params
    let tileset;
    const tilesetUrl = parseTilesetUrlFromUrl();
    if (tilesetUrl) {
      tileset = {url: tilesetUrl};
    } else {
      tileset = EXAMPLES[INITIAL_EXAMPLE_NAME];
    }
    this._onSelectTileset(tileset);
  }

  async _onSelectTileset(tileset) {
    const params = parseTilesetUrlParams(tileset.url, tileset);
    const {tilesetUrl, token, name, metadataUrl} = params;
    this.setState({tilesetUrl, name, token});
    const metadata = await fetch(metadataUrl).then(resp => resp.json());
    this.setState({metadata});
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();
    this._tilesetStatsWidget.update();
  }

  _onTilesetLoad(tileset) {
    const {zoom, cartographicCenter} = tileset;
    const [longitude, latitude] = cartographicCenter;

    const viewState = {
      ...this.state.viewState,
      zoom: zoom + 2.5,
      longitude,
      latitude
    };
    const attributeStorageInfo = tileset.tileset.attributeStorageInfo;

    this.setState({
      tileset,
      attributeStorageInfo,
      viewState: {
        ...viewState,
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      }
    });

    this._tilesetStatsWidget.setStats(tileset.stats);
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _onSelectMapStyle({selectedMapStyle}) {
    this.setState({selectedMapStyle});
  }

  _renderLayers() {
    const {tilesetUrl, token} = this.state;
    const loadOptions = {throttleRequests: true};
    if (token) {
      loadOptions.token = token;
    }
    return [
      new TileLayer({
        data: tilesetUrl,
        loader: I3SLoader,
        onTilesetLoad: this._onTilesetLoad.bind(this),
        onTileLoad: () => this._updateStatWidgets(),
        onTileUnload: () => this._updateStatWidgets(),
        onClick: info => this.handleRenderAttributes(info),
        pickable: true,
        loadOptions
      })
    ];
  }

  async handleRenderAttributes(info) {
    const {attributeStorageInfo} = this.state;
    console.log('color', info.color); //eslint-disable-line

    const attributeUrls = info.object.header.attributeUrls;
    const attributes = [];

    for (let index = 0; index < attributeStorageInfo.length; index++) {
      const url = attributeUrls[index];
      const attributeName = attributeStorageInfo[index].name;
      const attributeType = this.getAttributeValueType(attributeStorageInfo[index]);
      const attribute = await load(url, I3SAttributeLoader, {attributeName, attributeType});
      attributes.push(attribute);
    }

    console.log('attributes', attributes); //eslint-disable-line
  }

  getAttributeValueType(attribute) {
    if (attribute.hasOwnProperty('objectIds')) {
      return 'Oid32';
    } else if (attribute.hasOwnProperty('attributeValues')) {
      return attribute.attributeValues.valueType;
    }
    return null;
  }

  _renderStats() {
    // TODO - too verbose, get more default styling from stats widget?
    return <div style={STATS_WIDGET_STYLE} ref={_ => (this._statsWidgetContainer = _)} />;
  }

  _renderControlPanel() {
    const {name, tileset, token, metadata, selectedMapStyle} = this.state;
    return (
      <ControlPanel
        tileset={tileset}
        name={name}
        metadata={metadata}
        token={token}
        onExampleChange={this._onSelectTileset}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        selectedMapStyle={selectedMapStyle}
      />
    );
  }

  render() {
    const layers = this._renderLayers();
    const {viewState, selectedMapStyle} = this.state;

    return (
      <div style={{position: 'relative', height: '100%'}}>
        {this._renderStats()}
        {this._renderControlPanel()}
        <DeckGL
          layers={layers}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85}}
          onAfterRender={() => this._updateStatWidgets()}
        >
          <StaticMap mapStyle={selectedMapStyle} preventStyleDiffing />
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
