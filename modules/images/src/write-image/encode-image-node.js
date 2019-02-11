// Use stackgl modules for DOM-less reading and writing of images
// NOTE: These are not dependencies of luma.gl.
// They need to be imported by the app.
import savePixels from 'save-pixels';
import ndarray from 'ndarray';

/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {Image} image to save
 * @param {String} type='png' - png, jpg or image/png, image/jpg are valid
 * @param {String} opt.dataURI= - Whether to include a data URI header
 * @return {*} bytes
 */
export function encodeImageToStreamNode(image, options) {
  // Support MIME type strings
  const type = options.type ? options.type.replace('image/', '') : 'jpeg';

  const pixels = ndarray(image.data, [image.width, image.height, 4], [4, image.width * 4, 1], 0);

  // Note: savePixels returns a stream
  return savePixels(pixels, type, options);
}
