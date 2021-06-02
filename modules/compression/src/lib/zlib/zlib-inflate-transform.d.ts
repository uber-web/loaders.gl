import {IncrementalTransform} from '@loaders.gl/loader-utils';

/**
 * A transform that incrementally decompresses / inflates zlib compressed input
 */
export default class ZlibInflateTransform implements IncrementalTransform {
  /**
   * Inflate
   */
  static run(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;

  /**
   * Alternate interface for chunking & without exceptions
   * @param options
   */
  constructor(options: object);

  write(chunk: ArrayBuffer): ArrayBuffer | null;

  end(): ArrayBuffer | null;
}
