import {BatchableDataType, LoaderObject, LoaderContext} from '@loaders.gl/loader-utils/';
/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function parseInBatches(
  data: BatchableDataType,
  loaders: LoaderObject | LoaderObject[],
  options?: object,
  context?: LoaderContext
): Promise<AsyncIterable<any>>;
