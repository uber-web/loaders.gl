import BinaryChunkReader from '../streaming/binary-chunk-reader';
import {parseRecord} from './parse-shp-geometry';

const LITTLE_ENDIAN = true;
const BIG_ENDIAN = false;

const SHP_MAGIC_NUMBER = 0x0000270a;
const SHP_HEADER_SIZE = 100;
// According to the spec, the record header is just 8 bytes, but here we set it
// to 12 so that we can also access the record's type
const SHP_RECORD_HEADER_SIZE = 12;

const STATE = {
  EXPECTING_HEADER: 0,
  EXPECTING_RECORD: 1,
  END: 2,
  ERROR: 3
};

class SHPParser {
  constructor() {
    this.binaryReader = new BinaryChunkReader();
    this.state = STATE.EXPECTING_HEADER;
    this.result = {};
  }

  write(arrayBuffer) {
    this.binaryReader.write(arrayBuffer);
    this.state = parseState(this.state, this.result, this.binaryReader);
  }

  end() {
    this.binaryReader.end();
    this.state = parseState(this.state, this.result, this.binaryReader);
    // this.result.progress.bytesUsed = this.binaryReader.bytesUsed();
    if (this.state !== STATE.END) {
      this.state = STATE.ERROR;
      this.result.error = 'SHP incomplete file';
    }
  }
}

export default function parseSHP(arrayBuffer, options) {
  const shpParser = new SHPParser();
  shpParser.write(arrayBuffer);
  shpParser.end();

  return shpParser.result;
}

/* eslint-disable complexity, max-depth */
function parseState(state, result = {}, binaryReader) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      switch (state) {
        case STATE.ERROR:
        case STATE.END:
          return state;

        case STATE.EXPECTING_HEADER:
          // Parse initial file header
          const dataView = binaryReader.getDataView(SHP_HEADER_SIZE, 'SHP header');
          if (!dataView) {
            return state;
          }
          result.header = parseSHPHeader(dataView);
          result.geometries = [];
          result.progress = {
            bytesUsed: 0,
            bytesTotal: result.header.length,
            rows: 0
          };
          // index numbering starts at 1
          result.currentIndex = 1;
          state = STATE.EXPECTING_RECORD;
          break;

        case STATE.EXPECTING_RECORD:
          while (binaryReader.hasAvailableBytes(SHP_RECORD_HEADER_SIZE)) {
            const recordHeaderView = binaryReader.getDataView(SHP_RECORD_HEADER_SIZE);
            const recordHeader = {
              recordNumber: recordHeaderView.getInt32(0, BIG_ENDIAN),
              // 2 byte words; includes the four words of record header
              byteLength: recordHeaderView.getInt32(4, BIG_ENDIAN) * 2,
              // This is actually part of the record, not the header...
              type: recordHeaderView.getInt32(8, LITTLE_ENDIAN)
            };

            if (!binaryReader.hasAvailableBytes(recordHeader.byteLength - SHP_RECORD_HEADER_SIZE)) {
              binaryReader.rewind(SHP_RECORD_HEADER_SIZE);
              return state;
            }

            const invalidRecord =
              recordHeader.byteLength < 4 ||
              recordHeader.type !== result.header.type ||
              recordHeader.recordNumber !== result.currentIndex;

            // All records must have at least four bytes (for the record shape type)
            if (invalidRecord) {
              // Malformed record, try again, advancing just 4 bytes
              // Note: this is a rewind because binaryReader.getDataView above
              // moved the pointer forward 12 bytes, so rewinding 8 bytes still
              // leaves us 4 bytes ahead
              binaryReader.rewind(SHP_RECORD_HEADER_SIZE - 4);
            } else {
              // Note: type is actually part of the record, not the header, so
              // rewind 4 bytes before reading record
              binaryReader.rewind(4);

              const recordView = binaryReader.getDataView(recordHeader.byteLength);
              const geometry = parseRecord(recordView);
              result.geometries.push(geometry);

              result.currentIndex++;
              result.progress.rows = result.currentIndex - 1;
            }
          }
          state = STATE.END;
          break;

        default:
          state = STATE.ERROR;
          result.error = `illegal parser state ${state}`;
          return state;
      }
    } catch (error) {
      state = STATE.ERROR;
      result.error = `SHP parsing failed: ${error.message}`;
      return state;
    }
  }
}

/**
 * Extract the binary header
 * @param {DataView} headerView
 */
function parseSHPHeader(headerView) {
  // Note: The SHP format switches endianness between fields!
  // https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf
  const header = {
    magic: headerView.getInt32(0, BIG_ENDIAN),
    // Length is stored as # of 2-byte words; multiply by 2 to get # of bytes
    length: headerView.getInt32(24, BIG_ENDIAN) * 2,
    version: headerView.getInt32(28, LITTLE_ENDIAN),
    type: headerView.getInt32(32, LITTLE_ENDIAN),
    bbox: {
      minX: headerView.getFloat64(36, LITTLE_ENDIAN),
      minY: headerView.getFloat64(44, LITTLE_ENDIAN),
      minZ: headerView.getFloat64(68, LITTLE_ENDIAN),
      minM: headerView.getFloat64(84, LITTLE_ENDIAN),
      maxX: headerView.getFloat64(52, LITTLE_ENDIAN),
      maxY: headerView.getFloat64(60, LITTLE_ENDIAN),
      maxZ: headerView.getFloat64(76, LITTLE_ENDIAN),
      maxM: headerView.getFloat64(92, LITTLE_ENDIAN)
    }
  };
  if (header.magic !== SHP_MAGIC_NUMBER) {
    // eslint-disable-next-line
    console.error(`SHP file: bad magic number ${header.magic}`);
  }
  if (header.version !== 1000) {
    // eslint-disable-next-line
    console.error(`SHP file: bad version ${header.version}`);
  }
  return header;
}
