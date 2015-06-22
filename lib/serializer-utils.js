'use strict';
var _ = require('lodash');
var inflection = require('inflection');

module.exports = function (collectionName, payload, opts) {

  function dasherize(attribute) {
    return inflection.dasherize(inflection.underscore(attribute));
  }

  function getId() {
    return opts.id || 'id';
  }

  function getRef(record, item, serializationConfig) {
    if (_.isFunction(serializationConfig.ref)) {
      return serializationConfig.ref(record, item);
    } else {
      return String(item[serializationConfig.ref]);
    }
  }

  function getType(str) {
    return inflection.pluralize(str);
  }

  function isAttrAllowed(attributes, attr) {
    return attributes.indexOf(attr) > -1;
  }

  function pick(obj, attributes) {
    return _.mapKeys(_.pick(obj, attributes), function (value, key) {
      return dasherize(key);
    });
  }

  this.apiEndpoint = function () {
    return opts.apiEndpointValue || opts.apiEndpoint + '/' + collectionName;
  };

  this.arrayAttr = function (data, record, attribute, serializationConfig) {
    var that = this;

    if (serializationConfig && serializationConfig.ref) {
      // Embedded array with relationships.
      if (!data.relationships) { data.relationships = {}; }
      data.relationships[dasherize(attribute)] = {
        data: record[attribute].map(function (item) {
          var id = getRef(record, item, serializationConfig);
          var type = getType(attribute);

          var includedAttrs = serializationConfig.attributes
            .filter(function (attr) {
              return !serializationConfig[attr];
            });

          var relationships = serializationConfig.attributes
            .filter(function (attr) {
              return serializationConfig[attr];
            });

          var included = {
            type: type,
            id: id,
            attributes: pick(item, includedAttrs),
            relationships: {}
          };

          relationships.forEach(function (relationship) {
            if (_.isPlainObject(item[relationship])) {
              that.objectAttr(included, item, relationship,
                serializationConfig[relationship]);
            } else if (_.isArray(item[relationship])) {
              that.arrayAttr(included, item, relationship,
                serializationConfig[relationship]);
            }
          });

          payload.included.push(included);

          return { type: type, id: id };
        })
      };
    } else {
      // Embedded array without relationships.
      data.attributes[dasherize(attribute)] = record[attribute];
    }
  };

  this.objectAttr = function (data, record, attribute, serializationConfig) {
    var that = this;

    // Embedded array with relationships.
    if (serializationConfig && serializationConfig.ref) {
      var id = getRef(record, record[attribute], serializationConfig);
      var type = getType(attribute);

      var includedAttrs = serializationConfig.attributes
        .filter(function (attr) {
          return !serializationConfig[attr];
        });

      var relationships = serializationConfig.attributes
        .filter(function (attr) {
          return serializationConfig[attr];
        });

      var included = {
        id: id,
        type: type,
        attributes: pick(record[attribute], includedAttrs)
      };

      relationships.forEach(function (relationship) {
        if (_.isPlainObject(record[attribute][relationship])) {
          that.objectAttr(included, record[attribute], relationship,
            serializationConfig[relationship]);
        } else if (_.isArray(record[attribute][relationship])) {
          that.arrayAttr(included, record[attribute], relationship,
            serializationConfig[relationship]);
        }
      });

      payload.included.push(included);

      if (!data.relationships) { data.relationships = {}; }
      data.relationships[dasherize(attribute)] = {
        data: { id: id, type: type }
      };
    } else {
      // Embedded array without relationships.
      data.attributes[dasherize(attribute)] = record[attribute];
    }
  };

  this.perform = function (record) {
    var that = this;
    var data = {
      type: getType(collectionName),
      id: String(record[getId()]),
      attributes: {},
      relationships: {}
    };

    Object.keys(record).forEach(function (attribute) {
      if (!isAttrAllowed(opts.attributes, attribute)) { return; }

      if (_.isArray(record[attribute])) {
        that.arrayAttr(data, record, attribute, opts[attribute]);
      } else if (_.isPlainObject(record[attribute])) {
        that.objectAttr(data, record, attribute, opts[attribute]);
      } else {
        data.attributes[dasherize(attribute)] = record[attribute];
      }
    });

    return data;
  };
};
