
function binaryToGeoJson(data, type, format) {
  if (format === 'geometry') {
    return parseGeometry(data);
  }

  var dataArray = normalizeInput(data, type);

  switch (deduceReturnType(dataArray)) {
    case 'Geometry':
      return parseGeometry(dataArray[0]);
    case 'FeatureCollection':
      return parseFeatureCollection(dataArray);
    default:
      break;
  }

  return null;
}

// Normalize features
// Return an array of data objects, each of which have a type key
function normalizeInput(data, type) {
  const isHeterogeneousType = Boolean(data.points || data.lines || data.polygons);

  if (!isHeterogeneousType) {
    data.type = type || parseType(data);
    return [data];
  }

  const features = [];
  if (data.points) {
    data.points.type = 'Point';
    features.push(data.points);
  }
  if (data.lines) {
    data.lines.type = 'LineString';
    features.push(data.lines);
  }
  if (data.polygons) {
    data.polygons.type = 'Polygon';
    features.push(data.polygons);
  }
  return features;
}

// Determine whether a geometry, feature, or feature collection should be returned
function deduceReturnType(dataArray) {
  // If more than one item in dataArray, multiple geometry types, must be a featurecollection
  if (dataArray.length > 1) {
    return 'FeatureCollection';
  }

  const data = dataArray[0];
  if (!(data.featureIds || data.globalFeatureIds || data.numericProps || data.properties)) {
    return 'Geometry';
  }

  return 'FeatureCollection';
}

function parseFeatureCollection(dataArray) {
  const features = [];
  for (const data of dataArray) {
    let lastIndex = 0;
    let lastValue = data.featureIds.value[0];

    // Need to deduce start, end indices of each feature
    for (let i = 0; i < data.featureIds.value.length; i++) {
      const currValue = data.featureIds.value[i];
      if (currValue === lastValue) {
        continue;
      }

      features.push(parseFeature(data, lastIndex, i));
      lastIndex = i;
      lastValue = currValue;
    }

    // Last feature
    features.push(parseFeature(data, lastIndex, data.featureIds.value.length));
  }
  return features;
}

function parseFeature(data, startIndex, endIndex) {
  const geometry = parseGeometry(data, startIndex, endIndex);
  const properties = parseProperties(data, startIndex, endIndex);
  return {type: 'Feature', geometry, properties};
}

function parseProperties(data, startIndex, endIndex) {
  const properties = Object.assign(data.properties[data.featureIds.value[startIndex]]);
  for (const key in data.numericProps) {
    properties[key] = data.numericProps[key].value[startIndex];
  }
  return properties;
}

function parseGeometry(data, startIdx, endIdx) {
  switch (data.type) {
    case 'Point':
      return pointToGeoJson(data);
    case 'LineString':
      return lineStringToGeoJson(data);
    case 'Polygon':
      return polygonToGeoJson(data);
    default:
      throw new Error('Invalid type');
  }
}

function parseType(data) {
  if (data.pathIndices) {
    return 'LineString';
  }

  if (data.polygonIndices) {
    return 'Polygon';
  }

  return 'Point';
}

function polygonToGeoJson(data) {
  const {
    positions,
    polygonIndices: {value: polygonIndices},
    primitivePolygonIndices: {value: primitivePolygonIndices}
  } = data;
  const multi = polygonIndices.length > 2;

  const coordinates = [];
  if (!multi) {
    for (let i = 0; i < primitivePolygonIndices.length - 1; i++) {
      const ringCoordinates = ringToGeoJson(
        positions,
        primitivePolygonIndices[i],
        primitivePolygonIndices[i + 1]
      );
      coordinates.push(ringCoordinates);
    }

    return {type: 'Polygon', coordinates};
  }

  // TODO handle MultiPolygon
  return {type: 'MultiPolygon', coordinates};
}

function lineStringToGeoJson(data) {
  const {
    positions,
    pathIndices: {value: pathIndices}
  } = data;
  const multi = pathIndices.length > 2;

  if (!multi) {
    const coordinates = ringToGeoJson(positions);
    return {type: 'LineString', coordinates};
  }

  const coordinates = [];
  for (let i = 0; i < pathIndices.length - 1; i++) {
    const ringCoordinates = ringToGeoJson(positions, pathIndices[i], pathIndices[i + 1]);
    coordinates.push(ringCoordinates);
  }

  return {type: 'MultiLineString', coordinates};
}

function pointToGeoJson(data) {
  const {positions} = data;
  const multi = positions.value.length / positions.size > 1;
  const coordinates = ringToGeoJson(positions);

  if (multi) {
    return {type: 'MultiPoint', coordinates};
  }

  return {type: 'Point', coordinates: coordinates[0]};
}

function ringToGeoJson(positions, startIndex, endIndex) {
  startIndex = startIndex || 0;
  endIndex = endIndex || positions.value.length / positions.size;

  const ringCoordinates = [];
  for (let j = startIndex; j < endIndex; j++) {
    ringCoordinates.push(
      Array.from(positions.value.subarray(j * positions.size, (j + 1) * positions.size))
    );
  }
  return ringCoordinates;
}
