'use strict';
var _ = require('lodash');
var Inflector = require('inflected');

module.exports = function (collectionName, payload, opts) {
  this.apiEndpoint = function () {
    return opts.apiEndpointValue || opts.apiEndpoint + '/' + collectionName;
  };

  this.id = function () {
    return opts.id || 'id';
  };

  this.isAttrAllowed = function (attr) {
    return opts.attributes.indexOf(attr) > -1;
  };

  this.arrayAttr = function (data, record, attribute) {
    if (opts[attribute] && opts[attribute].ref) {
      // Embedded array with relationships.
      data.relationships[attribute] = {
        data: record[attribute].map(function (item) {
          var id = String(item[opts[attribute].ref]);
          var type = Inflector.singularize(attribute);

          payload.included.push({
            type: type,
            id: id,
            attributes: _.pick(item, opts[attribute].attributes)
          });

          return { type: type, id: id };
        })
      };
    } else {
      // Embedded array without relationships.
      data.attributes[attribute] = record[attribute];
    }
  };

  this.objectAttr = function (data, record, attribute) {
    // Embedded array with relationships.
    if (opts[attribute] && opts[attribute].ref) {
      var id = String(record[attribute][opts[attribute].ref]);
      var type = Inflector.singularize(attribute);

      payload.included.push({
        id: id,
        type: type,
        attributes: _.pick(record[attribute], opts[attribute].attributes)
      });

      data.relationships[attribute] = {
        data: { id: id, type: type }
      };
    } else {
      // Embedded array without relationships.
      data.attributes[attribute] = record[attribute];
    }
  };

  this.perform = function (record) {
    var that = this;
    var data = {
      type: Inflector.singularize(collectionName),
      id: String(record[this.id()]),
      attributes: {},
      relationships: {}
    };

    Object.keys(record).forEach(function (attribute) {
      if (!that.isAttrAllowed(attribute)) { return; }

      if (_.isArray(record[attribute])) {
        that.arrayAttr(data, record, attribute);
      } else if (_.isPlainObject(record[attribute])) {
        that.objectAttr(data, record, attribute);
      } else {
        data.attributes[attribute] = record[attribute];
      }
    });

    return data;
  };
};
