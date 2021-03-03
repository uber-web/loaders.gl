import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const CONTAINER_STYLE = {
  display: 'flex',
  position: 'absolute',
  backgroundColor: 'white',
  flexFlow: 'column',
  top: 0,
  right: 0,
  width: '300px',
  padding: '12px 18px',
  maxHeight: '80%',
  margin: '20px',
  zIndex: 1000
};

const STYLED_TH = {
  width: '50%',
  textAlign: 'left',
  borderRight: '3px solid rgba(0,0,0,.05)',
  padding: '.5em .7em'
};

const STYLED_TD = {
  width: '50%',
  padding: '.5em .7em'
};

const TABLE_WRAPPER_STYLE = {
  maxHeight: '50%',
  overflowY: 'auto'
};

const HEADER_STYLE = {
  display: 'flex',
  flexFlow: 'row nowrap',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const CLOSE_BUTTON_STYLE = {
  height: '30px',
  color: '#6e6e6e',
  border: 'none',
  cursor: 'pointer',
  outline: 'none',
  fontSize: '19px'
};

const propTypes = {
  attributesObject: PropTypes.object,
  attributesHeader: PropTypes.string,
  handleClosePanel: PropTypes.func
};

const defaultProps = {
  attributesObject: {},
  attributesHeader: 'NAME',
  handleClosePanel: () => {}
};

const NO_DATA = 'No Data';
export default class AttributesPanel extends PureComponent {
  prepareTable() {
    const {attributesObject} = this.props;
    const tableColumns = [];

    for (const key in attributesObject) {
      const value = this.formatValue(attributesObject[key]);
      const column = this.createTableColumn(key, value);
      tableColumns.push(column);
    }

    return (
      <div style={TABLE_WRAPPER_STYLE}>
        <table>
          <tbody>{tableColumns}</tbody>
        </table>
      </div>
    );
  }

  createTableColumn(key, value) {
    return (
      <tr key={key}>
        <th style={STYLED_TH}>{key}</th>
        <td style={STYLED_TD}>{value}</td>
      </tr>
    );
  }

  formatValue(value) {
    return (
      value
        .toString()
        .replace(/[{}']+/g, '')
        .trim() || NO_DATA
    );
  }

  render() {
    const {attributesObject, handleClosePanel, attributesHeader} = this.props;

    return (
      <div style={CONTAINER_STYLE}>
        <div style={HEADER_STYLE}>
          <h2>{attributesObject[attributesHeader]}</h2>
          <button style={CLOSE_BUTTON_STYLE} onClick={handleClosePanel}>
            X
          </button>
        </div>
        {attributesObject && this.prepareTable()}
      </div>
    );
  }
}

AttributesPanel.propTypes = propTypes;
AttributesPanel.defaultProps = defaultProps;
