'use strict';
var _ = require('lodash');
var inflection = require('inflection');

module.exports = function (collectionName, record, payload, opts) {

  function dasherize(attribute) {
    return inflection.dasherize(inflection.underscore(attribute));
  }

  function keyForAttribute(attribute) {
    if (_.isFunction(opts.keyForAttribute)) {
      return opts.keyForAttribute(attribute);
    } else {
      return dasherize(attribute);
    }
  }

  function getId() {
    return opts.id || 'id';
  }

  function getRef(current, item, opts) {
    if (_.isFunction(opts.ref)) {
      return opts.ref(current, item);
    } else {
      return String(item[opts.ref]);
    }
  }

  function getType(str) {
    var type = str;

    if (_.isFunction(opts.typeForAttribute)) {
      type = opts.typeForAttribute(str);
    } else if (_.isUndefined(opts.pluralizeType) || opts.pluralizeType) {
      type = inflection.pluralize(type);
    }

    return type;
  }

  function getLinks(current, links) {
    return _.mapValues(links, function (value) {
      if (_.isFunction(value)) {
        return value(record, current);
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
      return keyForAttribute(key);
    });
  }

  function isComplexType(obj) {
    return _.isArray(obj) || _.isPlainObject(obj);
  }

  function isCompoundDocumentIncluded(included, item) {
    return _.find(payload.included, { id: item.id, type: item.type });
  }

  function pushToIncluded(dest, include) {
    if (!isCompoundDocumentIncluded(dest, include)) {
      if (!dest.included) { dest.included = []; }
      dest.included.push(include);
    }
  }

  this.serialize = function (dest, current, attribute, opts) {
    var that = this;

    if (isComplexType(current[attribute])) {
      if (opts && opts.ref) {
        // Embedded with relationships.
        if (!dest.relationships) { dest.relationships = {}; }

        var data = null;
        if (_.isArray(current[attribute])) {
          data = current[attribute].map(function (item) {
            return that.serializeRef(item, current, attribute, opts);
          });
        } else if (_.isPlainObject(current[attribute])) {
          data = that.serializeRef(current[attribute], current, attribute, opts);
        }

        dest.relationships[keyForAttribute(attribute)] = { data: data };
        if (opts.relationshipLinks) {
          dest.relationships[keyForAttribute(attribute)].links =
            getLinks(current[attribute], opts.relationshipLinks);
        }
      } else {
        // Embedded without relationships.
        dest.attributes[keyForAttribute(attribute)] = current[attribute];
      }
    } else {
      dest.attributes[keyForAttribute(attribute)] = current[attribute];
    }
  };

  this.serializeRef = function (dest, current, attribute, opts) {
    var that = this;
    var id = getRef(current, dest, opts);
    var type = opts.resourceType ? getType(opts.resourceType) :
    	getType(attribute);

    var relationships = opts.attributes.filter(function (attr) {
      return opts[attr];
    });

    var includedAttrs = opts.attributes.filter(function (attr) {
      return !opts[attr];
    });

    var included = {
      type: type,
      id: id,
      attributes: pick(dest, includedAttrs)
    };

    relationships.forEach(function (relationship) {
      if (isComplexType(dest[relationship])) {
        that.serialize(included, dest, relationship, opts[relationship]);
      }
    });

    if (_.isUndefined(opts.included) || opts.included) {
      if (opts.includedLinks) {
        included.links = getLinks(dest, opts.includedLinks);
      }

      pushToIncluded(payload, included);
    }

    return { type: type, id: id };
  };

  this.perform = function () {
    var that = this;

    // Top-level data.
    var data = {
      type: getType(collectionName),
      id: String(record[getId()]),
      attributes: {}
    };

    // Data links.
    if (opts.dataLinks) {
      data.links = getLinks(record, opts.dataLinks);
    }

    _.each(_.keys(record), function (attribute) {
      if (!isAttrAllowed(opts.attributes, attribute)) { return; }
      that.serialize(data, record, attribute, opts[attribute]);
    });

    return data;
  };
};
