import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const CONTAINER_STYLE = {
  display: 'flex',
  position: 'absolute',
  backgroundColor: 'white',
  flexFlow: 'column',
  top: '150px',
  right: '20px',
  width: '300px',
  padding: '12px 18px',
  maxHeight: '50%',
  overflowY: 'auto'
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

const propTypes = {
  attributesObject: PropTypes.object,
  attributesHeader: PropTypes.string
};

const defaultProps = {
  attributesObject: {},
  attributesHeader: 'NAME'
};

export default class AttributesPanel extends PureComponent {
  prepareTable() {
    const {attributesObject, attributesHeader} = this.props;
    const tableColumns = [];

    for (const key in attributesObject) {
      const value = attributesObject[key];
      const column = this.createTableColumn(key, value);
      tableColumns.push(column);
    }

    return (
      <div>
        <h2>{attributesObject[attributesHeader]}</h2>
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

  render() {
    const {attributesObject} = this.props;
    return <div style={CONTAINER_STYLE}>{attributesObject && this.prepareTable()}</div>;
  }
}

AttributesPanel.propTypes = propTypes;
AttributesPanel.defaultProps = defaultProps;
