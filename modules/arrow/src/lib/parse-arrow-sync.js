import {Table} from 'apache-arrow/Arrow.es5.min';

// Parses arrow to a columnar table
export default function parseArrowSync(arrayBuffer, options) {
  const arrowTable = Table.from([new Uint8Array(arrayBuffer)]);

  // Extract columns

  // TODO - avoid calling `getColumn` on columns we are not interested in?
  // Add options object?
  const columnarTable = {};

  arrowTable.schema.fields.forEach(field => {
    // This (is intended to) coalesce all record batches into a single typed array
    const arrowColumn = arrowTable.getColumn(field.name);
    const values = arrowColumn.toArray();
    columnarTable[field.name] = values;
  });

  return columnarTable;
}
