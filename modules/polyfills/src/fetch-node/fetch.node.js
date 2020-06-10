import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import Response from './response.node';
import Headers from './headers.node';
import {createReadStream} from './create-stream.node';

const isDataURL = url => url.startsWith('data:');
const isRequestURL = url => url.startsWith('http:') || url.startsWith('https:');

export default async function fetchNode(url, options) {
  // Need to create the stream in advance since response.object needs to be ssync
  try {
    const httpResponseOrStream = await createReadStream(url, options);
    const body = httpResponseOrStream;
    const headers = getHeaders(url, httpResponseOrStream);
    return new Response(url, options, body, headers);
  } catch (error) {
    return new Response(url, options, null, null, error);
  }
}

// HELPER FUNCTIONS
// PRIVATE

function getHeaders(url, httpResponse) {
  // Under Node.js we return a mock "fetch response object"
  // so that apps can use the same API as in the browser.
  //
  // Note: This is intended to be a lightweight implementation and will have limitations.
  // Apps that require more complete fech emulation in Node
  // are encouraged to use dedicated fetch polyfill modules.

  const headers = {};

  if (httpResponse && httpResponse.getHeaders) {
    const httpHeaders = httpResponse.getHeaders();
    for (const name in httpHeaders) {
      const header = headers[name];
      headers[name] = String(header);
    }
  } else {
    const contentLength = getContentLength(url);
    if (Number.isFinite(contentLength)) {
      headers['Content-Length'] = contentLength;
    }
  }

  return new Headers(headers);
}

function getContentLength(url) {
  if (isRequestURL(url)) {
    // Needs to be read from actual headers
    return null;
  } else if (isDataURL(url)) {
    // TODO - remove media type etc
    return url.length - 'data:'.length;
  }
  // File URL
  // TODO - how to handle non-existing file, this presumably just throws
  const stats = fs.statSync(url);
  return stats.size;
}