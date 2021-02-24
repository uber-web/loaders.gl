import {getMeshBoundingBox} from '@loaders.gl/loader-utils';
import decode, {DECODING_STEPS} from './decode-quantized-mesh';

// eslint-disable-next-line max-statements
function getMeshAttributes(vertexData, header, bounds, edgeIndices, skirtHeight) {
  const {westIndices, northIndices, eastIndices, southIndices} = edgeIndices;
  const {minHeight, maxHeight} = header;
  const [minX, minY, maxX, maxY] = bounds || [0, 0, 1, 1];
  const xScale = maxX - minX;
  const yScale = maxY - minY;
  const zScale = maxHeight - minHeight;

  // Additional positions necessary for skirt
  const nSkirtCoords = skirtHeight
    ? westIndices.length + northIndices.length + eastIndices.length + southIndices.length - 4
    : 0;

  const nCoords = vertexData.length / 3;
  // vec3. x, y defined by bounds, z in meters
  const positions = new Float32Array((nCoords + nSkirtCoords) * 3);

  // vec2. 1 to 1 relationship with position. represents the uv on the texture image. 0,0 to 1,1.
  const texCoords = new Float32Array((nCoords + nSkirtCoords) * 2);

  // Data is not interleaved; all u, then all v, then all heights
  for (let i = 0; i < nCoords; i++) {
    const x = vertexData[i] / 32767;
    const y = vertexData[i + nCoords] / 32767;
    const z = vertexData[i + nCoords * 2] / 32767;

    positions[3 * i + 0] = x * xScale + minX;
    positions[3 * i + 1] = y * yScale + minY;
    positions[3 * i + 2] = z * zScale + minHeight;

    texCoords[2 * i + 0] = x;
    texCoords[2 * i + 1] = y;
  }

  if (skirtHeight) {
    // Sort skirt indices to create adjacent triangles
    westIndices.sort((a, b) => positions[3 * a + 1] - positions[3 * b + 1]);
    // Reverse (b - a) to match triangle winding
    eastIndices.sort((a, b) => positions[3 * b + 1] - positions[3 * a + 1]);
    southIndices.sort((a, b) => positions[3 * b] - positions[3 * a]);
    // Reverse (b - a) to match triangle winding
    northIndices.sort((a, b) => positions[3 * a] - positions[3 * b]);

    // Add positions
    let skirtIndex = nCoords;
    for (const edge of [westIndices, northIndices, eastIndices, southIndices]) {
      for (let i = 0; i < edge.length - 1; i++) {
        const index = edge[i];
        const x = vertexData[index] / 32767;
        const y = vertexData[index + nCoords] / 32767;
        const z = vertexData[index + nCoords * 2] / 32767;

        positions[3 * skirtIndex] = x * xScale + minX;
        positions[3 * skirtIndex + 1] = y * yScale + minY;
        positions[3 * skirtIndex + 2] = z * zScale + minHeight - skirtHeight;

        texCoords[2 * skirtIndex] = x;
        texCoords[2 * skirtIndex + 1] = y;

        skirtIndex++;
      }
    }
  }

  return {
    positions,
    texCoords,
    nCoords
  };
}

function addSkirtTriangles(triangleIndices, edgeIndices, nCoords) {
  const {westIndices, northIndices, eastIndices, southIndices} = edgeIndices;

  let skirtIndex = nCoords;
  let triangleIndex = triangleIndices.length;

  const nSkirtTriangles =
    (westIndices.length + northIndices.length + eastIndices.length + southIndices.length - 4) * 2;
  const newTriangleIndices = new Uint32Array(triangleIndices.length + nSkirtTriangles);
  newTriangleIndices.set(triangleIndices);

  for (const edge of [westIndices, northIndices, eastIndices, southIndices]) {
    for (let i = 0; i < edge.length - 1; i++) {
      const currIndex = edge[i];
      const nextIndex = edge[i + 1];
      const currentSkirt = skirtIndex;
      const nextSkirt = skirtIndex + 1;

      // add first triangle
      newTriangleIndices[triangleIndex] = currIndex;
      newTriangleIndices[triangleIndex + 1] = currentSkirt;
      newTriangleIndices[triangleIndex + 2] = nextIndex;
      triangleIndex += 3;

      // add second triangle
      newTriangleIndices[triangleIndex] = currentSkirt;
      newTriangleIndices[triangleIndex + 1] = nextSkirt;
      newTriangleIndices[triangleIndex + 2] = nextIndex;
      triangleIndex += 3;

      skirtIndex++;
    }
  }

  return newTriangleIndices;
}

function getTileMesh(arrayBuffer, options) {
  if (!arrayBuffer) {
    return null;
  }
  const {bounds, skirtHeight} = options;
  const maxDecodingStep = skirtHeight ? DECODING_STEPS.edgeIndices : DECODING_STEPS.triangleIndices;
  const decoded = decode(arrayBuffer, maxDecodingStep);
  const {header, vertexData, westIndices, northIndices, eastIndices, southIndices} = decoded;
  let {triangleIndices} = decoded;

  const edgeIndices = {
    westIndices,
    northIndices,
    eastIndices,
    southIndices
  };
  const {positions, texCoords, nCoords} = getMeshAttributes(
    vertexData,
    header,
    bounds,
    edgeIndices,
    skirtHeight
  );

  if (skirtHeight) {
    triangleIndices = addSkirtTriangles(triangleIndices, edgeIndices, nCoords);
  }

  const attributes = {
    POSITION: {value: positions, size: 3},
    TEXCOORD_0: {value: texCoords, size: 2}
    // TODO: Parse normals if they exist in the file
    // NORMAL: {}, - optional, but creates the high poly look with lighting
  };

  return {
    // Data return by this loader implementation
    loaderData: {
      header: {}
    },
    header: {
      // @ts-ignore
      vertexCount: triangleIndices.length,
      // TODO: Find bounding box from header, instead of doing extra pass over
      // vertices.
      boundingBox: getMeshBoundingBox(attributes)
    },
    mode: 4, // TRIANGLES
    indices: {value: triangleIndices, size: 1},
    attributes
  };
}

export default function loadQuantizedMesh(arrayBuffer, options) {
  return getTileMesh(arrayBuffer, options['quantized-mesh']);
}
