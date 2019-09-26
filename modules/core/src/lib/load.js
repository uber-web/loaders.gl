import {isFileReadable} from '../javascript-utils/is-type';
import {fetchFile} from './fetch/fetch-file';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeOptions} from './loader-utils/merge-options';
import {selectLoader} from './select-loader';

import {parse} from './parse';
import {parseInBatches} from './parse-in-batches';

export async function loadInBatches(url, loaders, options) {
  const response = await fetchFile(url, options);
  return parseInBatches(response, loaders, options, url);
}

// Note: Load does duplicate a lot of parse.
// it can also call fetchFile on string urls, which `parse` won't do.
export async function load(url, loaders, options) {
  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    options = loaders;
    loaders = null;
  }

  // at this point, data can be binary or text
  let data = url;
  if (isFileReadable(data) || typeof data === 'string') {
    data = await fetchFile(url, options);
  }

  // Fall back to parse
  // Note: An improved round of autodetection is possible now that data has been loaded
  // This means that another loader might be selected
  return parse(data, loaders, options, url);
}
