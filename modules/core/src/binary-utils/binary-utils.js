/* global FileReader, Blob, ArrayBuffer, Buffer */
import assert from '../utils/assert';
import {TextEncoder} from './text-encoding';
import {padTo4Bytes} from './memory-copy-utils';

export function toArrayBuffer(binaryData) {
  if (binaryData instanceof ArrayBuffer) {
    return binaryData;
  }

  if (typeof Blob !== 'undefined' && binaryData instanceof Blob) {
    return blobToArrayBuffer(binaryData);
  }

  // if (ArrayBuffer.isView(binaryData)) {
  //   return binaryData.buffer;
  // }

  if (typeof binaryData === 'string') {
    return stringToArrayBuffer(binaryData);
  }

  return nodeBufferToArrayBuffer(binaryData);
  // assert(false);
  // return null;
}

// Convert (copy) ArrayBuffer to Buffer
export function toBuffer(binaryData) {
  if (ArrayBuffer.isView(binaryData)) {
    binaryData = binaryData.buffer;
  }

  if (typeof Buffer !== 'undefined' && binaryData instanceof ArrayBuffer) {
    /* global Buffer */
    const buffer = new Buffer(binaryData.byteLength);
    const view = new Uint8Array(binaryData);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  }

  assert(false);
  return null;
}

export function toDataView(buffer) {
  return new DataView(toArrayBuffer(buffer));
}

/**
 * Copy from source to target at the targetOffset
 *
 * @param {ArrayBuffer|TypedArray} source - The data to copy
 * @param {TypedArray} target - The destination to copy data into
 * @param {Number} targetOffset - The start offset into target to place the copied data
 *
 * @return {Number} Returns the new offset taking into account proper padding
 */
export function copyToArray(source, target, targetOffset) {
  let sourceArray;

  if (source instanceof ArrayBuffer) {
    sourceArray = new Uint8Array(source);
  } else {
    // Pack buffer onto the big target array
    //
    // 'source.data.buffer' could be a view onto a larger buffer.
    // We MUST use this constructor to ensure the byteOffset and byteLength is
    // set to correct values from 'source.data' and not the underlying
    // buffer for target.set() to work properly.
    const srcByteOffset = source.byteOffset;
    const srcByteLength = source.byteLength;
    sourceArray = new Uint8Array(source.buffer, srcByteOffset, srcByteLength);
  }

  // Pack buffer onto the big target array
  target.set(sourceArray, targetOffset);

  return targetOffset + padTo4Bytes(sourceArray.byteLength);
}

// Helper functions

export function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    let arrayBuffer;
    const fileReader = new FileReader();
    fileReader.onload = event => {
      arrayBuffer = event.target.result;
    };
    fileReader.onloadend = event => resolve(arrayBuffer);
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(blob);
  });
}

export function stringToArrayBuffer(text) {
  const uint8Array = new TextEncoder().encode(text);
  return uint8Array.buffer;
}

function nodeBufferToArrayBuffer(buffer) {
  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  const typedArray = new Uint8Array(buffer);
  return typedArray.buffer;
}
