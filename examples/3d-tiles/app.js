/* global fetch */
import '@babel/polyfill';

import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {Vector3} from 'math.gl';
// import '@loaders.gl/polyfills';
// import '@luma.gl/debug';

import Tile3DLayer from './tile-3d-layer';

import ControlPanel from './components/control-panel';
import fileDrop from './components/file-drop';
import {updateStatWidgets} from './components/stats-widgets';

const DATA_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';
const INDEX_FILE = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

const ION_ACCESS_TOKEN = process.env.IonAccessToken; // eslint-disable-line

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v9';
const DEPTH_LIMIT = 2; // TODO: Remove this after sse traversal is working since this is just to prevent full load of tileset

const INITIAL_EXAMPLE_CATEGORY = 'additional';
const INITIAL_EXAMPLE_NAME = 'royalExhibitionBuilding';
// const INITIAL_EXAMPLE_CATEGORY = 'Instanced';
// const INITIAL_EXAMPLE_NAME = 'InstancedGltfExternal';
// const INITIAL_EXAMPLE_CATEGORY = 'PointCloud';
// const INITIAL_EXAMPLE_NAME = 'PointCloudRGB';

const scratchLongLatZoom = new Vector3();

const ADDITIONAL_EXAMPLES = {
  name: 'additional',
  examples: {
    royalExhibitionBuilding: {
      tilesetUrl:
        'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/3d-tiles/RoyalExhibitionBuilding/tileset.json',
      depthLimit: DEPTH_LIMIT, // TODO: Remove this after sse traversal is working since this is just to prevent full load of tileset
      color: [115, 101, 152, 200]
    },
    'St Helen (Cesium ion)': {
      ionAssetId: 33301, // St Helen
      ionAccessToken: ION_ACCESS_TOKEN
    }
  }
};

const EXAMPLES_VIEWSTATE = {
  latitude: 40.04248558075302,
  longitude: -75.61213987669433
};

export const INITIAL_VIEW_STATE = {
  ...EXAMPLES_VIEWSTATE,
  pitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 17
};

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      viewState: INITIAL_VIEW_STATE,
      featureTable: null,
      batchTable: null,
      droppedFile: null,
      examplesByCategory: null,
      tilesetExampleProps: {},
      category: INITIAL_EXAMPLE_CATEGORY,
      name: INITIAL_EXAMPLE_NAME,

      // stats (TODO should be managed by Tileset3D)
      tileCount: 0,
      pointCount: 0
    };

    this._deckRef = null;
  }

  async componentDidMount() {
    fileDrop(this._deckRef.deckCanvas, (promise, file) => {
      // eslint-disable-next-line
      alert('File drop of tilesets not yet implemented');
      // this.setState({ droppedFile: file, tile: null });
      // load(promise, Tile3DLoader).then(this._onLoad);
    });

    await this._loadExampleIndex();
    await this._loadInitialTileset();
  }

  async _loadExampleIndex() {
    // load the index file that lists example tilesets
    const response = await fetch(INDEX_FILE);
    const data = await response.json();
    this.setState({
      examplesByCategory: {
        ...data,
        additional: ADDITIONAL_EXAMPLES,
        custom: {
          name: 'Custom',
          examples: {
            'Custom Tileset': {},
            'ION Tileset': {}
          }
        }
      }
    });
  }

  async _loadInitialTileset() {
    /* global URL */
    const parsedUrl = new URL(window.location.href);
    const ionAssetId = parsedUrl.searchParams.get('ionAssetId');
    let ionAccessToken = parsedUrl.searchParams.get('ionAccessToken');
    if (ionAssetId || ionAccessToken) {
      // load the tileset specified in the URL
      ionAccessToken = ionAccessToken || ION_ACCESS_TOKEN;
      await this._loadTilesetFromIonAsset(ionAccessToken, ionAssetId);
      return;
    }

    const tilesetUrl = parsedUrl.searchParams.get('tileset');
    if (tilesetUrl) {
      // load the tileset specified in the URL
      await this._loadTilesetFromUrl(tilesetUrl);
      return;
    }

    // load the default example tileset
    const {category, name} = this.state;
    await this._loadExampleTileset(category, name);
  }

  async _loadExampleTileset(category, name) {
    const {examplesByCategory} = this.state;

    let tilesetUrl;
    let tilesetExampleProps;
    if (category === 'additional') {
      tilesetExampleProps = ADDITIONAL_EXAMPLES.examples[name];
    } else {
      const selectedExample = examplesByCategory[category].examples[name];
      if (selectedExample && selectedExample.tileset) {
        tilesetUrl = `${DATA_URI}/${selectedExample.path}/${selectedExample.tileset}`;
        tilesetExampleProps = {
          tilesetUrl,
          isWGS84: true
        };
      }
    }

    this.setState({
      tilesetExampleProps
    });
  }

  async _loadTilesetFromIonAsset(ionAccessToken, ionAssetId) {
    this.setState({
      tilesetExampleProps: {
        ionAccessToken,
        ionAssetId
      },
      category: 'custom',
      name: 'ION Tileset'
    });
  }

  async _loadTilesetFromUrl(tilesetUrl) {
    this.setState({
      tilesetExampleProps: {
        tilesetUrl
      },
      category: 'custom',
      name: 'Custom Tileset'
    });
  }

  // CONTROL PANEL
  async _onSelectExample({category, name}) {
    this.setState({category, name});
    await this._loadExampleTileset(category, name);
  }

  _renderControlPanel() {
    const {examplesByCategory, category, name, viewState} = this.state;
    if (!examplesByCategory) {
      return null;
    }

    return (
      <ControlPanel
        data={examplesByCategory}
        category={category}
        name={name}
        onChange={this._onSelectExample.bind(this)}
      >
        <div>
          Loaded {this.state.tileCount | 0} tiles {(this.state.pointCount / 1e6).toFixed(2)} M
          points
        </div>
        <div>
          {' '}
          {viewState.longitude.toFixed(5)} {viewState.latitude.toFixed(5)} {viewState.zoom}{' '}
        </div>
      </ControlPanel>
    );
  }

  _onTilesetLoaded(tileset) {
    tileset._getCartographicCenterAndZoom(scratchLongLatZoom);
    this.setState({
      viewState: {
        ...this.state.viewState,
        longitude: scratchLongLatZoom[0],
        latitude: scratchLongLatZoom[1],
        zoom: scratchLongLatZoom[2]
      }
    });

    this.forceUpdate();
  }

  _onTileLoaded(tileHeader) {
    const pointCount = tileHeader.content.pointsLength || 0;
    this.setState({
      tileCount: this.state.tileCount + 1,
      pointCount: this.state.pointCount + pointCount
    });
  }

  // MAIN

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _renderLayer() {
    const {tilesetExampleProps} = this.state;
    if (!tilesetExampleProps) {
      return null;
    }

    const {
      tilesetUrl,
      ionAssetId,
      ionAccessToken,
      coordinateOrigin,
      depthLimit = DEPTH_LIMIT,
      color = [255, 0, 0, 255]
    } = tilesetExampleProps;
    return new Tile3DLayer({
      id: 'tile-3d-layer',
      tilesetUrl,
      ionAssetId,
      ionAccessToken,
      coordinateOrigin,
      depthLimit,
      color,
      onTileLoaded: this._onTileLoaded.bind(this),
      onTilesetLoaded: this._onTilesetLoaded.bind(this)
    });
  }

  render() {
    const {viewState} = this.state;
    const layer = this._renderLayer();

    return (
      <div>
        {this._renderControlPanel()}
        <DeckGL
          ref={_ => (this._deckRef = _)}
          layers={[layer]}
          initialViewState={INITIAL_VIEW_STATE}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85}}
          onAfterRender={() => updateStatWidgets()}
        >
          <StaticMap mapStyle={MAPBOX_STYLE} mapboxApiAccessToken={MAPBOX_TOKEN} />
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
