import parseImage from '../parsers/parse-image';
import {getImageUrls} from './load-image';
import {deepLoad} from './deep-load';

// Returned map will be have keys corresponding to GL cubemap constants
const GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851a;

const CUBE_FACES = [
  {face: GL_TEXTURE_CUBE_MAP_POSITIVE_X, direction: 'right', axis: 'x', sign: 'positive'},
  {face: GL_TEXTURE_CUBE_MAP_NEGATIVE_X, direction: 'left', axis: 'x', sign: 'negative'},
  {face: GL_TEXTURE_CUBE_MAP_POSITIVE_Y, direction: 'top', axis: 'y', sign: 'positive'},
  {face: GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, direction: 'bottom', axis: 'y', sign: 'negative'},
  {face: GL_TEXTURE_CUBE_MAP_POSITIVE_Z, direction: 'front', axis: 'z', sign: 'positive'},
  {face: GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, direction: 'back', axis: 'z', sign: 'negative'}
];

// Returns an object with six key-value pairs containing the urls (or url mip arrays)
// for each cube face
export async function getImageCubeUrls(getUrl, options) {
  // Calculate URLs
  const urls = {};
  const promises = [];

  let index = 0;
  for (const face in CUBE_FACES) {
    const faceValues = CUBE_FACES[index];
    const promise = getImageUrls(getUrl, options, {...faceValues, index: index++}).then(url => {
      urls[face] = url;
    });
    promises.push(promise);
  }

  await Promise.all(promises);

  return urls;
}

// Returns an object with six key-value pairs containing the images (or image mip arrays)
// for each cube face
export async function loadImageCube(getUrl, options = {}) {
  const urls = await getImageCubeUrls(getUrl, options);
  return await deepLoad(urls, parseImage, options);
}

/*
export async function loadImageCube(getUrl, options = {}) {
  const faces = {};
  const promises = [];

  const urlOptions = {...options};

  // Iterate over faces
  for (let i = 0; i < CUBE_FACES.length; ++i) {
    // Populate url options
    urlOptions.index = i;
    Object.assign(urlOptions, CUBE_FACES[i]);

    // Load the image(s) for this face
    // eslint-disable-next-line no-loop-func
    const promise = loadImage(getUrl, urlOptions).then(image => {
      // Use (stringified) value of the GL constant for this face as the key in the returned object
      const {face} = CUBE_FACES[i];
      faces[face] = image;
    });

    promises.push(promise);
  }

  await Promise.all(promises);

  return faces;
}
*/
