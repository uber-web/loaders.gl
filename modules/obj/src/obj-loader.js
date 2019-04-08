import parseOBJ from './parse-obj';

function testOBJFile(text) {
  // There could be comment line first
  return text[0] === 'v';
}

export default {
  name: 'OBJ',
  extensions: ['obj'],
  testText: testOBJFile,
  parseTextSync: parseOBJ
};
