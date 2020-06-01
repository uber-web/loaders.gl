import test from 'tape-promise/tape';

import {isBrowser} from '@loaders.gl/core';
// import {load, isBrowser} from '@loaders.gl/core';
// import {ImageLoader} from '@loaders.gl/images';
import {GIFBuilder} from '@loaders.gl/video';

const IMAGE_URLS = [
  'http://i.imgur.com/2OO33vX.jpg',
  'http://i.imgur.com/qOwVaSN.png',
  'http://i.imgur.com/Vo5mFZJ.gif'
];

// const IMAGES = Promise.all(IMAGE_URLS.map(url => load(url, ImageLoader, {images: {type: 'image'}})));

test('GIFBuilder#imports', t => {
  t.ok(GIFBuilder, 'GIFBuilder defined');
  t.end();
});

test('GIFBuilder#load(URL)', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const gifBuilder = new GIFBuilder({source: 'images', width: 400, height: 400});

  for (const image of IMAGE_URLS) {
    await gifBuilder.add(image);
  }

  const gifDataUrl = await gifBuilder.build();
  t.ok(gifDataUrl.startsWith('data:image/gif;'), 'build() returns GIF image encoded as data URL');

  t.end();
});
