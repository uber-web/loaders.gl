import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  max-width: 280px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px 24px;
  margin: 20px;
  font-size: 13px;
  line-height: 2;
  outline: none;
  z-index: 100;
`;

const DropDown = styled.select`
  margin-bottom: 12px;
`;

const TilesetDropDown = styled.select`
  margin-bottom: 12px;
  font-weight: 800;
  font-size: medium;
`;

const propTypes = {
  category: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  droppedFile: PropTypes.string,
  attributions: PropTypes.array,
  mapStyles: PropTypes.object.isRequired,
  selectedMapStyle: PropTypes.string.isRequired,
  onExampleChange: PropTypes.func,
  onMapStyleChange: PropTypes.func,
  children: PropTypes.node
};

const defaultProps = {
  droppedFile: null,
  onChange: () => {}
};

export default class ControlPanel extends PureComponent {
  _renderByCategories() {
    const {category, name, onExampleChange, data} = this.props;
    const categories = Object.keys(data);
    const selectedValue = `${category}.${name}`;

    return (
      <TilesetDropDown
        value={selectedValue}
        onChange={evt => {
          const selected = evt.target.value;
          const [newCategory, newName] = selected.split('.');
          const categoryExamples = data[newCategory].examples;
          onExampleChange({
            category: newCategory,
            name: newName,
            example: categoryExamples[newName]
          });
        }}
      >
        {categories.map((c, i) => {
          const categoryExamples = data[c].examples;
          return (
            <optgroup key={i} label={data[c].name}>
              {Object.keys(categoryExamples).map((e, j) => {
                const value = `${c}.${e}`;
                return (
                  <option key={j} value={value}>
                    {e}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </TilesetDropDown>
    );
  }

  _renderMapStyles() {
    const {onMapStyleChange, mapStyles, selectedMapStyle} = this.props;

    return (
      <DropDown
        value={selectedMapStyle}
        onChange={evt => {
          const selected = evt.target.value;
          onMapStyleChange({selectedMapStyle: selected});
        }}
      >
        {Object.keys(mapStyles).map(key => {
          return (
            <option key={key} value={mapStyles[key]}>
              {key}
            </option>
          );
        })}
      </DropDown>
    );
  }

  _renderDropped() {
    const {droppedFile} = this.props;
    return droppedFile ? <div>Dropped file: {JSON.stringify(droppedFile.name)}</div> : null;
  }

  _renderAttributions() {
    const {attributions} = this.props;
    if (!attributions || attributions.length === 0) {
      return null;
    }
    return (
      <div style={{marginTop: '0.5cm'}}>
        <div style={{textAlign: 'center'}}>
          {Boolean(attributions.length) && <b>Tileset Attribution</b>}
          <div style={{borderStyle: 'solid', borderWidth: 1}} />
          {attributions.map(attribution => (
            <div key={attribution.html} dangerouslySetInnerHTML={{__html: attribution.html}} />
          ))}
        </div>
      </div>
    );
  }

  render() {
    return (
      <Container>
        {this._renderByCategories()}
        {this._renderDropped()}
        {this._renderMapStyles()}
        {this.props.children}
        {this._renderAttributions()}
      </Container>
    );
  }
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;
