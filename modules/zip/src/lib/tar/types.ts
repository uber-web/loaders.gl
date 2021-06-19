export interface Structure {
  [index: string]: number;
}
export interface Data {
  [index: string]: string;
}
export interface Blocks {
  [index: string]: any;
  header?: Uint8Array;
  input?: string | Uint8Array;
  headerLength?: number;
  inputLength?: number;
}
export type Options = {
  mode?: number;
  mtime?: number;
  uid?: number;
  gid?: number;
  owner?: any;
  group?: any;
};
export interface Chunk {
  [index: number]: any;
}
export interface Chunks {
  [index: number]: Chunk;
  length?: number;
  blocks?: any;
}
export interface ZIPWriter {
  name: string;
  extensions: string[];
  category: string;
  mimeTypes: string[];
  encode: (data: any, options: {[key: string]: any}) => Promise<ArrayBuffer>;
}
export interface TAR {
  append(filepath: string, input: string | Uint8Array, opts?: Options | undefined): void;
  save: () => Blob;
  clear: () => void;
}
export type TARBUILDER = {
  [key: string]: any;
  addFile(filename: string, buffer: ArrayBuffer): void;
  build: () => Promise<ArrayBuffer>;
};
