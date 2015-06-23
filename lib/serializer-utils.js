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

  function getRef(record, item, opts) {
    if (_.isFunction(opts.ref)) {
      return opts.ref(record, item);
    } else {
      return String(item[opts.ref]);
    }
  }

  function getType(str) {
    return inflection.pluralize(str);
  }

  function getLinks(record, links) {
    return _.mapValues(links, function (value) {
      if (_.isFunction(value)) {
        return value(record);
      } else {
        return value;
      }
    });
  }

  function isAttrAllowed(attributes, attr) {
    return attributes.indexOf(attr) > -1;
  }

  function pick(obj, attributes) {
    return _.mapKeys(_.pick(obj, attributes), function (value, key) {
      return dasherize(key);
    });
  }

  function isComplexType(obj) {
    return _.isArray(obj) || _.isPlainObject(obj);
  }

  this.serialize = function (dest, record, attribute, opts) {
    var that = this;

    if (isComplexType(record[attribute])) {
      if (opts && opts.ref) {
        // Embedded with relationships.
        if (!dest.relationships) { dest.relationships = {}; }

        var data = null;
        if (_.isArray(record[attribute])) {
          data = record[attribute].map(function (item) {
            return that.serializeRef(item, record, attribute, opts);
          });
        } else if (_.isPlainObject(record[attribute])) {
          data = that.serializeRef(record[attribute], record, attribute, opts);
        }

        dest.relationships[dasherize(attribute)] = { data: data };
      } else {
        // Embedded without relationships.
        dest.attributes[dasherize(attribute)] = record[attribute];
      }
    } else {
      dest.attributes[dasherize(attribute)] = record[attribute];
    }
  };

  this.serializeRef = function (dest, record, attribute, opts) {
    var that = this;
    var id = getRef(record, dest, opts);
    var type = getType(attribute);

    var includedAttrs = opts.attributes.filter(function (attr) {
      return !opts[attr];
    });

    var relationships = opts.attributes.filter(function (attr) {
      return opts[attr];
    });

    var included = {
      type: type,
      id: id,
      attributes: pick(dest, includedAttrs)
    };

    if (opts.links) { included.links = getLinks(dest, opts.links); }

    relationships.forEach(function (relationship) {
      if (isComplexType(dest[relationship])) {
        that.serialize(included, dest, relationship, opts[relationship]);
      }
    });

    payload.included.push(included);

    return { type: type, id: id };
  };

  this.perform = function (record) {
    var that = this;

    // Top-level data.
    var data = {
      type: getType(collectionName),
      id: String(record[getId()]),
      attributes: {}
    };

    // Top-level links.
    if (opts.links) { data.links = getLinks(record, opts.links); }

    _.each(_.keys(record), function (attribute) {
      if (!isAttrAllowed(opts.attributes, attribute)) { return; }
      that.serialize(data, record, attribute, opts[attribute]);
    });

    return data;
  };
};
