'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Inflector = require('inflected');

function Serializer(collectionName, records, opts) {
  var payload = {
    links: {
      self: opts.apiEndpoint + '/' + collectionName
    },
    data: [],
    included: [],
  };

  records.forEach(function (record) {
    var data = {
      type: collectionName,
      id: record._id,
      attributes: {},
      relationships: {},
      links: {}
    };

    _.keys(record).forEach(function (attribute) {
      if (opts.attributes.indexOf(attribute) === -1) { return; }

      if (_.isArray(record[attribute])) {
        if (opts[attribute] && opts[attribute].ref) {
          data.relationships[attribute] = {
            links: { },
            data: record[attribute].map(function (attr) {
              payload.included.push({
                type: Inflector.pluralize(attribute),
                id: attr[opts[attribute].ref],
                attributes: _.pick(attr, opts[attribute].attributes),
                links: {}
              });

              return {
                type: Inflector.pluralize(attribute),
                id: attr[opts[attribute].ref]
              };
            })
          };
        } else {
          data.attributes[attribute] = record[attribute];
        }
      } else if (_.isPlainObject(record[attribute])) {
        if (opts[attribute] && opts[attribute].ref) {
          data.relationships[attribute] = {
            links: { },
            data: {
              type: Inflector.pluralize(attribute),
              id: record[attribute][opts[attribute].ref]
            }
          };

          payload.included.push({
            type: Inflector.pluralize(attribute),
            id: record[attribute]._id,
            attributes: _.pick(record[attribute], opts[attribute].attributes),
            links: {}
          });
        } else {
          data.attributes[attribute] = record[attribute];
        }
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
