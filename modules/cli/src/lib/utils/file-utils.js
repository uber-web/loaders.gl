import {promises as fs} from 'fs';
import {join} from 'path';
import {compressFileWithGzip} from './compress-util';

export async function writeFile(path, data, slpk = false, fileName = 'index.json') {
  await fs.mkdir(path, {recursive: true});
  const pathFile = join(path, fileName);
  try {
    await fs.writeFile(pathFile, data);
  } catch (err) {
    throw err;
  }
  console.log(`${pathFile} saved.`); // eslint-disable-line
  if (slpk) {
    const pathGzFile = await compressFileWithGzip(pathFile);
    // After compression, we don't need an uncompressed file
    await removeFile(pathFile);
    return pathGzFile;
  }
  return pathFile;
}

export function removeDir(path) {
  return fs.rmdir(path, {recursive: true});
}

export function removeFile(path) {
  return fs.unlink(path);
}
