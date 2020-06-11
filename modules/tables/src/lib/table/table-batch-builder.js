const DEFAULT_BATCH_SIZE = 100;

export default class TableBatchBuilder {
  constructor(TableBatchType, schema, batchSize = DEFAULT_BATCH_SIZE, options) {
    this.TableBatchType = TableBatchType;
    this.schema = schema;
    this.batchSize = batchSize;
    this.batch = null;
    this.batchCount = 0;
    this.bytesRead = 0;
    this.options = options;
  }

  addRow(row, meta) {
    if (!this.batch) {
      const {TableBatchType} = this;
      this.batch = new TableBatchType(this.schema, this.batchSize, this.options);
    }

    this.batch.addRow(row, meta);
  }

  chunkComplete(chunk) {
    this.bytesRead += chunk.byteLength || chunk.length || 0;
    if (this.batch) {
      this.batch.chunkComplete();
    }
  }

  isFull() {
    return this.batch && this.batch.isFull();
  }

  hasBatch() {
    return Boolean(this.batch);
  }

  getNormalizedBatch() {
    if (this.batch) {
      const normalizedBatch = this.batch.getNormalizedBatch();
      this.batch = null;
      normalizedBatch.count = this.batchCount;
      this.batchCount++;
      normalizedBatch.bytesRead = this.bytesRead;
      return normalizedBatch;
    }
    return null;
  }
}
