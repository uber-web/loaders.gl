import test from 'tape-promise/tape';
import {
  generateRandomArrayBuffer,
  compareArrayBuffers
} from '@loaders.gl/compression/test/utils/test-utils';
import {makeTransformIterator, concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import {fetchFile, parseInBatches, makeIterator} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {CryptoHashTransform} from '@loaders.gl/crypto';
import * as CryptoJS from 'crypto-js';

const CSV_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
/** Externally computed hash: `openssl md5 -binary sample-very-long.json | openssl base64` */
const CSV_MD5 = 'zmLuuVSkigYR9r5FcsKkCw==';
const SIZE = 100 * 1000;

test('CryptoHashTransform#hashSync(CSV, against external hash)', async t => {
  const response = await fetchFile(CSV_URL);
  const data = await response.arrayBuffer();

  const hash = CryptoHashTransform.hashSync(data, {CryptoJS});
  t.equal(hash, CSV_MD5, 'repeated data MD5 hash is correct');

  t.end();
});

test('CryptoHashTransform#iterator(CSV stream, against external hash)', async t => {
  const response = await fetchFile(CSV_URL);

  let hash;

  let iterator = makeIterator(response);
  // @ts-ignore
  iterator = makeTransformIterator(iterator, CryptoHashTransform, {
    CryptoJS,
    onEnd: result => {
      hash = result.hash;
    }
  });

  const csvIterator = await parseInBatches(iterator, CSVLoader);

  let csv;
  for await (const batch of csvIterator) {
    csv = batch;
  }
  t.ok(Array.isArray(csv.data), 'parsing from wrapped iterator works');

  t.equal(hash, CSV_MD5, 'streaming MD5 hash is correct');

  t.end();
});

test('CryptoHashTransform#hashSync(MD5 = default)', t => {
  const {binaryData, repeatedData} = getBinaryData();

  let hash = CryptoHashTransform.hashSync(binaryData, {CryptoJS});
  t.equal(hash, 'YnxTb+lyen1CsNkpmLv+qA==', 'binary data MD5 hash is correct');

  hash = CryptoHashTransform.hashSync(repeatedData, {CryptoJS});
  t.equal(hash, '2d4uZUoLXXO/XWJGnrVl5Q==', 'repeated data MD5 hash is correct');

  t.end();
});

test('CryptoHashTransform#hashSync(SHA256)', t => {
  const {binaryData, repeatedData} = getBinaryData();

  let hash = CryptoHashTransform.hashSync(binaryData, {
    CryptoJS,
    crypto: {algorithm: CryptoJS.algo.SHA256}
  });
  t.equal(
    hash,
    'gsoMi29gqdIBCEdTdRJW8VPFx5PQyFPTF4Lv7TJ4eQw=',
    'binary data SHA256 hash is correct'
  );

  hash = CryptoHashTransform.hashSync(repeatedData, {
    CryptoJS,
    crypto: {algorithm: CryptoJS.algo.SHA256}
  });
  t.equal(
    hash,
    'bSCTuOJei5XsmAnqtmm2Aw/2EvUHldNdAxYb3mjSK9s=',
    'repeated data SHA256 hash is correct'
  );

  t.end();
});

test('makeTransformIterator#CryptoHashTransform(small chunks)', async t => {
  const inputChunks = [
    new Uint8Array([1, 2, 3]).buffer,
    new Uint8Array([4, 5, 6]).buffer,
    new Uint8Array([7, 8, 9]).buffer
  ];

  let hash;

  // @ts-ignore
  const transformIterator = makeTransformIterator(inputChunks, CryptoHashTransform, {
    CryptoJS,
    onEnd: result => {
      hash = result.hash;
    }
  });

  const transformedChunks = [];
  for await (const chunk of transformIterator) {
    transformedChunks.push(chunk);
  }

  t.equal(hash, 'hZbBr1WxS3syARKUT8uFNg==', 'CryptoHashTransform generated correct hash');

  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = concatenateArrayBuffers(...transformedChunks);

  t.ok(compareArrayBuffers(inputData, transformedData), 'CryptoHashTransform passed through data');

  t.end();
});

test('makeTransformIterator#CryptoHashTransform(100K)', async t => {
  const {binaryData} = getBinaryData();

  const inputChunks = [binaryData];

  let hash;

  // @ts-ignore
  const transformIterator = makeTransformIterator(inputChunks, CryptoHashTransform, {
    CryptoJS,
    onEnd: result => {
      hash = result.hash;
    }
  });

  const transformedChunks = [];
  for await (const chunk of transformIterator) {
    transformedChunks.push(chunk);
  }

  t.equal(hash, 'YnxTb+lyen1CsNkpmLv+qA==', 'CryptoHashTransform generated correct hash');

  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = concatenateArrayBuffers(...transformedChunks);

  t.ok(compareArrayBuffers(inputData, transformedData), 'CryptoHashTransform passed through data');

  t.end();
});

// UTILITIES

const data = {};

export function getBinaryData() {
  data.binaryData = data.binaryData || generateRandomArrayBuffer({size: SIZE});
  data.repeatedData =
    data.repeatedData || generateRandomArrayBuffer({size: SIZE / 10, repetitions: 10});
  return data;
}
