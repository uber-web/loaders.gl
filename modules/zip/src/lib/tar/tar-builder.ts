import Tar from './tar';

export type TAR_BUILDER_OPTIONS = {
  recordsPerBlock: number;
};
const TAR_BUILDER_OPTIONS = {
  recordsPerBlock: 20
};

export default class TARBuilder {
  options: TAR_BUILDER_OPTIONS;
  tape: Tar;
  count: number;

  static get properties() {
    return {
      id: 'tar',
      name: 'TAR',
      extensions: ['tar'],
      mimeTypes: ['application/x-tar'],
      builder: TARBuilder,
      options: TAR_BUILDER_OPTIONS
    };
  }

  /**
   * @param options
   */
  constructor(options?: Partial<TAR_BUILDER_OPTIONS>) {
    this.options = {...TAR_BUILDER_OPTIONS, ...options};
    this.tape = new Tar(this.options.recordsPerBlock);
    this.count = 0;
  }

  /**
   * @param filename
   * @param buffer
   */
  addFile(filename: any, buffer: ArrayBuffer): void {
    this.tape.append(filename, new Uint8Array(buffer));
    this.count++;
  }

  async build(): Promise<ArrayBuffer> {
    return new Response(this.tape.save()).arrayBuffer();
  }
}
