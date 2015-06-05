'use strict';
var P = require('bluebird');
var SerializerUtils = require('./serializer-utils');

function ResourceSerializer(collectionName, record, opts) {
  var payload = { links: {}, data: {}, included: [] };

  var serializerUtils = new SerializerUtils(collectionName, payload, opts);
  payload.links.self = serializerUtils.apiEndpoint();
  payload.data = serializerUtils.perform(record);

  return new P(function (resolve) {
    resolve(payload);
  });
}

module.exports = ResourceSerializer;
