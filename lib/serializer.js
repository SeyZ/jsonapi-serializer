'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Inflector = require('inflected');

function Serializer(collectionName, records, opts) {

  var payload = { links: {}, data: [], included: [] };

  function apiEndpoint() {
    return opts.apiEndpointValue || opts.apiEndpoint + '/' + collectionName;
  }

  function isAttrAllowed(attr) {
    return opts.attributes.indexOf(attr) > -1;
  }

  function pluralize(attr) {
    return Inflector.pluralize(attr);
  }

  function arrayAttr(data, record, attribute) {
    if (opts[attribute] && opts[attribute].ref) {
      // Embedded array with relationships.
      data.relationships[attribute] = {
        links: {},
        data: record[attribute].map(function (item) {
          var id = item[opts[attribute].ref];
          var type = pluralize(attribute);

          payload.included.push({
            type: type,
            id: id,
            attributes: _.pick(item, opts[attribute].attributes),
            links: {}
          });

          return { type: type, id: id };
        })
      };
    } else {
      // Embedded array without relationships.
      data.attributes[attribute] = record[attribute];
    }
  }

  function objectAttr(data, record, attribute) {
    // Embedded array with relationships.
    if (opts[attribute] && opts[attribute].ref) {
      var id = record[attribute][opts[attribute].ref];
      var type = pluralize(attribute);

      payload.included.push({
        id: id,
        type: type,
        attributes: _.pick(record[attribute], opts[attribute].attributes),
        links: {}
      });

      data.relationships[attribute] = {
        links: {},
        data: { id: id, type: type }
      };
    } else {
      // Embedded array without relationships.
      data.attributes[attribute] = record[attribute];
    }
  }

  payload.links.self = apiEndpoint();

  records.forEach(function (record) {
    var data = {
      type: collectionName,
      id: record._id,
      attributes: {},
      relationships: {},
      links: {}
    };

    Object.keys(record).forEach(function (attribute) {
      if (!isAttrAllowed(attribute)) { return; }

      if (_.isArray(record[attribute])) {
        arrayAttr(data, record, attribute);
      } else if (_.isPlainObject(record[attribute])) {
        objectAttr(data, record, attribute);
      } else {
        data.attributes[attribute] = record[attribute];
      }
    });

    payload.data.push(data);
  });

  return new P(function (resolve) {
    resolve(payload);
  });
}

module.exports = Serializer;
