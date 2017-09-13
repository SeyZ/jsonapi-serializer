'use strict';
/* global describe, it */

var expect = require('chai').expect;
var _ = require('lodash');

var JSONAPISerializer = require('../../lib/serializer');

describe('Options', function () {
  describe('id', function () {
    it('should override the id field', function (done) {
      var dataSet = [{
        _id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }, {
        _id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett'
      }];

      var json = new JSONAPISerializer('users', {
        id: '_id',
        attributes: ['firstName', 'lastName']
      }).serialize(dataSet);

      expect(json.data[0].id).equal('54735750e16638ba1eee59cb');
      done(null, json);
    });

    it('should not be serialized when it\'s null', function (done) {
      var dataSet = {
        id: null,
        firstName: 'Sandro',
        lastName: 'Munda'
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json.data).to.not.have.keys('id');
      done(null, json);
    });

    it('should not be serialized when it\'s undefined', function (done) {
      var dataSet = {
        firstName: 'Sandro',
        lastName: 'Munda'
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json.data).to.not.have.keys('id');
      done(null, json);
    });
  });

  describe('pluralizeType', function () {
    it('should allow type to not be pluralized', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        pluralizeType: false
      }).serialize(dataSet);

      expect(json.data.type).equal('user');

      // Confirm it response the same with a truthy setting
      json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        pluralizeType: true
      }).serialize(dataSet);

      expect(json.data.type).equal('users');
      done(null, json);
    });
  });

  describe('typeForAttribute', function () {
    it('should set the type according to the func return', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        typeForAttribute: function (attribute) {
          return attribute + '_foo';
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user_foo');
      done(null, json);
    });

    it('should pass the object as a second variable to the func', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        customType: 'user_foo'
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        typeForAttribute: function (attribute, user) {
          return user.customType;
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user_foo');
      done(null, json);
    });
    it('should use the default behaviour when typeForAttribute returns undefined', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        bestFriend: {
          id: '2',
          customType: 'people'
        },
        job: {
          id: '1'
        }
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName', 'bestFriend', 'job'],
        typeForAttribute: function (attribute, data) {
          // sometimes this returns undefined
          return data.customType;
        },
        job: {
          ref: 'id',
          included: false
        },
        bestFriend: {
          ref: 'id',
          included: false
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('users');
      expect(json.data.relationships.job.data.type).equal('jobs');
      expect(json.data.relationships['best-friend'].data.type).equal('people');
      done(null, json);
    });

  });

  describe('typeForAttributeRecord', function () {
    it('should set a related type according to the func return based on the attribute value', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: [{
          id: '2',
          type: 'home',
          street: 'Dogwood Way',
          zip: '12345'
        },{
          id: '3',
          type: 'work',
          street: 'Dogwood Way',
          zip: '12345'
        }]
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: function (user, address) {
            return address.id;
          },
          attributes: ['street', 'zip']
        },
        typeForAttribute: function (attribute, record) {
          return (record && record.type) ? record.type : attribute;
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user');
      expect(json.included[0]).to.have.property('type').equal('home');
      expect(json.included[1]).to.have.property('type').equal('work');

      expect(json.data.relationships).to.have.property('address').that.is.an('object');
      expect(json.data.relationships.address.data[0]).to.have.property('type').that.is.eql('home');
      expect(json.data.relationships.address.data[1]).to.have.property('type').that.is.eql('work');


      done(null, json);
    });
  });

  describe('Top level meta option', function () {
    it('should set the meta key (plain value)', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        meta: {
          count: 1
        }
      }).serialize(dataSet);

      expect(json.meta.count).equal(1);
      done(null, json);
    });

    it('should set the meta key (function)', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        meta: {
          count: function (record) {
            expect(record).to.be.eql({
              id: '1',
              firstName: 'Sandro',
              lastName: 'Munda',
            });

            return 1;
          }
        }
      }).serialize(dataSet);

      expect(json.meta.count).equal(1);
      done(null, json);
    });
  });

  describe('dataMeta option', function () {
    it('should set the meta key to each data records (plain value)', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [
          { createdAt: '2015-08-04T06:09:24.864Z' },
          { createdAt: '2015-08-04T07:09:24.864Z' }
        ]
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        books: [
          { createdAt: '2015-09-04T06:10:24.864Z' }
        ]
      }];

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        dataMeta: {
          copyright: 'publisher'
        }
      }).serialize(dataSet);

      expect(json.data[0].meta.copyright).equal('publisher');
      expect(json.data[1].meta.copyright).equal('publisher');
      done(null, json);
    });

    it('should set the meta key to each data records (function)', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [
          { createdAt: '2015-08-04T06:09:24.864Z' },
          { createdAt: '2015-08-04T07:09:24.864Z' }
        ]
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        books: [
          { createdAt: '2015-09-04T06:10:24.864Z' }
        ]
      }];

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        dataMeta: {
          count: function (record, current) {
            return current.books.length;
          }
        }
      }).serialize(dataSet);

      expect(json.data[0].meta.count).equal(2);
      expect(json.data[1].meta.count).equal(1);
      done(null, json);
    });
  });

  describe('included', function () {
    it('should include or not the compound documents', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        },
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: {
          id: '54735697e16624ba1eee36bf',
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          attributes: ['addressLine1', 'zipCode', 'country']
        }
      }).serialize(dataSet);

      expect(json.data[0]).to.have.property('relationships');
      expect(json.data[1]).to.have.property('relationships');
      expect(json).to.not.have.property('included');
      done(null, json);
    });
  });

  describe('keyForAttribute', function () {
    it('should serialize attribute in underscore', function (done) {
      var Inflector = require('inflected');
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{ createdAt: '2015-08-04T06:09:24.864Z' }],
        address: { zipCode: 42912 }
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName', 'books', 'address'],
        books: { attributes: ['createdAt'] },
        address: { attributes: ['zipCode'] },
        pluralizeType: false,
        keyForAttribute: function (attribute) {
          return Inflector.underscore(attribute);
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user');
      expect(json.data).to.have.property('attributes').that.is
        .an('object')
        .eql({
          'first_name': 'Sandro',
          'last_name': 'Munda',
          books: [{ 'created_at': '2015-08-04T06:09:24.864Z' }],
          address: { 'zip_code': 42912 }
        });

      done(null, json);
    });

    it('should ignore primitive array items', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        phoneNumber: ['555-555-5555'],
        address: { zipCode: 42912 }
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName', 'phoneNumber', 'address'],
        address: { attributes: ['zipCode'] },
        pluralizeType: false,
        keyForAttribute: function (attribute) {
          return _.camelCase(attribute);
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user');
      expect(json.data.attributes).to.have.property('phoneNumber').that.is
        .eql(['555-555-5555']);

      done(null, json);
    });
  });

  describe('keyForAttribute case strings', function () {
    var dataSet = {
      id: '1',
      firstName: 'Sandro',
    };

    it('should default the key case to dash-case', function (done) {
      var jsonNoCase = new JSONAPISerializer('user', dataSet, {
        attributes: ['firstName'],
      });

      var jsonInvalidCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'invalid case name'
      }).serialize(dataSet);

      expect(jsonNoCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonInvalidCase.data.attributes['first-name']).equal('Sandro');

      done(null, jsonNoCase);
    });

    it('should update the key case to dash-case', function (done) {
      var jsonDashCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'dash-case'
      }).serialize(dataSet);

      var jsonLispCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'lisp-case'
      }).serialize(dataSet);

      var jsonSpinalCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'spinal-case'
      }).serialize(dataSet);

      var jsonKababCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'kebab-case'
      }).serialize(dataSet);

      expect(jsonDashCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonLispCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonSpinalCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonKababCase.data.attributes['first-name']).equal('Sandro');

      done(null, jsonDashCase);
    });

    it('should update the key case to underscore_case', function (done) {
      var jsonUnderscoreCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'underscore_case'
      }).serialize(dataSet);

      var jsonSnakeCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'snake_case'
      }).serialize(dataSet);

      // jshint camelcase: false
      expect(jsonUnderscoreCase.data.attributes.first_name).equal('Sandro');
      expect(jsonSnakeCase.data.attributes.first_name).equal('Sandro');
      // jshint camelcase: true

      done(null, jsonUnderscoreCase);
    });

    it('should update the key case to CamelCase', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
      };

      var jsonCamelCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'CamelCase'
      }).serialize(dataSet);

      expect(jsonCamelCase.data.attributes.FirstName).equal('Sandro');

      done(null, jsonCamelCase);
    });

    it('should update the key case to camelCase', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
      };

      var jsonCamelCase = new JSONAPISerializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'camelCase'
      }).serialize(dataSet);

      expect(jsonCamelCase.data.attributes.firstName).equal('Sandro');

      done(null, jsonCamelCase);
    });
  });

  describe('ref', function () {
    it('should returns the result of the passed function', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        },
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: {
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      var json = new JSONAPISerializer('users', {
        id: 'id',
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: function (collection, field) {
            return collection.id + field.country + field.zipCode;
          },
          attributes: ['addressLine1', 'country', 'zipCode']
        }
      }).serialize(dataSet);

      expect(json).to.have.property('data').with.length(2);

      expect(json.data[0]).to.have.property('relationships');

      expect(json.data[0].relationships).to.be.an('object').eql({
        address: {
          data: {
            id: '54735750e16638ba1eee59cbUSA49426',
            type: 'addresses'
          }
        }
      });

      expect(json).to.have.property('included').to.be.an('array').with
        .length(2);

      expect(json.included[0]).to.be.an('object').eql({
        id: '54735750e16638ba1eee59cbUSA49426',
        type: 'addresses',
        attributes: {
          'address-line1': '406 Madison Court',
          country: 'USA',
          'zip-code': '49426'
        }
      });

      done(null, json);
    });
  });
});
