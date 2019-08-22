'use strict';
/* global describe, it */

var expect = require('chai').expect;
var _ = require('lodash');

var JSONAPISerializer = require('../lib/serializer');

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

    it('should be a string', function (done) {
      var dataSet = {
        id: 123,
        firstName: 'Sandro',
        lastName: 'Munda'
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json.data.id).to.equal('123');
      done(null, json);
    });

    it('should be serialized when it\'s 0', function (done) {
      var dataSet = {
        id: 0,
        firstName: 'Sandro',
        lastName: 'Munda'
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json.data.id).equal('0');
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

    it('should set the meta according to the func return', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda'
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett'
      }];

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName'],
        dataMeta: function (record) { return { copyright: record.firstName + ' ' + record.lastName }; }
      }).serialize(dataSet);

      expect(json.data[0].meta.copyright).equal("Sandro Munda");
      expect(json.data[1].meta.copyright).equal("Lawrence Bennett");
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

describe('JSON API Serializer', function () {
  describe('Flat data collection', function () {
    it('should be set into the `data.attributes`', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }, {
        id: '5490212e69e49d0c4f9fc6b4',
        firstName: 'Lawrence',
        lastName: 'Bennett'
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json).to.have.property('data').with.length(2);

      expect(json.data[0]).to.have.property('id')
        .equal('54735750e16638ba1eee59cb');

      expect(json.data[0]).to.have.property('type').equal('users');

      expect(json.data[0]).to.have.property('attributes').that.is
        .an('object')
        .eql({
          'first-name': 'Sandro',
          'last-name': 'Munda',
        });

      done(null, json);
    });
  });

  describe('Flat data resource', function () {
    it('should be set into the `data.attributes`', function (done) {
      var resource = {
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName'],
      }).serialize(resource);

      expect(json).to.have.property('data').and.to.be.instanceof(Object);

      expect(json.data).to.have.property('id')
        .equal('54735750e16638ba1eee59cb');

      expect(json.data).to.have.property('type').equal('users');

      expect(json.data).to.have.property('attributes').that.is
        .an('object')
        .eql({
          'first-name': 'Sandro',
          'last-name': 'Munda',
        });

      done(null, json);
    });
  });


  describe('Null data resource', function () {
    it('should be returned as NULL', function (done) {
      var resource = null;

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName'],
      }).serialize(resource);

      expect(json).to.have.property('data').and.to.equal(null);

      done(null, json);
    });
  });

  describe('Nested document', function () {
    it('should be set into the `data.attributes`', function (done) {
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
        id: '5490212e69e49d0c4f9fc6b4',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: {
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          attributes: ['addressLine1', 'zipCode', 'country']
        }
      }).serialize(dataSet);

      expect(json.data[0].attributes).to.have.property('address')
        .that.is.an('object')
        .eql({
          'address-line1': '406 Madison Court',
          'zip-code': '49426',
          country: 'USA'
        });

      done(null, json);
    });

    it('should not contains attributes key', function (done) {
      var dataSet = [{ id: 2 }, { id: 3 }];

      var json = new JSONAPISerializer('tags', {
        ref: true,
        included: false,
        topLevelLinks: {
          self: '/articles/1/relationships/tags',
          related: '/articles/1/tags'
        }
      }).serialize(dataSet);

      expect(json.data[0]).to.not.have.key('attributes');
      expect(json.data[1]).to.not.have.key('attributes');

      done(null, json);
    });

    it('should contains all attributes', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          id: '2',
          type: 'home',
          street: 'Dogwood Way',
          zip: '12345'
        }
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName', 'address'],
      }).serialize(dataSet);

      expect(json).eql({
        data: {
          type: 'users',
          id: '1',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda',
            address: {
              id: '2',
              type: 'home',
              street: 'Dogwood Way',
              zip: '12345'
            }
          }
        }
      });

      done(null, json);
    });
  });

  describe('Nested documents', function () {
    it('should be set into the `data.attributes`', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          isbn: '978-0062301239'
        }, {
          title: 'Steve Jobs',
          isbn: '978-1451648546'
        }]
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        books: [{
          title: 'Zero to One: Notes on Startups, or How to Build the Future',
          isbn: '978-0804139298'
        }, {
          title: 'Einstein: His Life and Universe',
          isbn: '978-0743264747'
        }]
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          attributes: ['title', 'isbn']
        }
      }).serialize(dataSet);

      expect(json.data[0].attributes).to.have.property('books')
        .that.is.an('array')
        .eql([{
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          isbn: '978-0062301239'
        }, {
          title: 'Steve Jobs',
          isbn: '978-1451648546'
        }]);
      done(null, json);
    });
  });

  describe('Null relationship', function () {
    it('should serialize the relationship as { data: null }', function (done) {
      var dataSet = {
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: null,
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false
        }
      }).serialize(dataSet);

      expect(json.data.relationships.address).eql({ data: null });
      done(null, json);
    });
  });

  describe('Nested of nested document', function () {
    it('should be serialized', function (done) {
      var dataSet = {
        _id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        foo: {
          bar: {
            firstName: 'Lawrence',
            lastName: 'Bennett',
            barbar: {
              firstName: 'Peter',
              lastName: 'Forney'
            }
          }
        }
      };

      var json = new JSONAPISerializer('users', {
        id: '_id',
        attributes: ['_id', 'firstName', 'lastName', 'foo'],
        keyForAttribute: 'underscore_case',
        foo: {
          attributes: ['bar'],
          bar: {
            attributes: ['firstName', 'lastName', 'barbar'],
            barbar: {
              attributes: ['firstName']
            }
          }
        }
      }).serialize(dataSet);

      expect(json.data).to.have.property('attributes').that.is
        .an('object')
        .eql({
          _id: '54735750e16638ba1eee59cb',
          'first_name': 'Sandro',
          'last_name': 'Munda',
          foo: {
            bar: {
              'first_name': 'Lawrence',
              'last_name': 'Bennett',
              barbar: {
                'first_name': 'Peter'
              }
            }
          }
        });

      done(null, json);
    });
  });

  describe('Compound document', function () {
    it('should be set into the `data.relationships` and `included`', function (done) {
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
          id: 123,
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          attributes: ['addressLine1', 'addressLine2', 'zipCode', 'country']
        }
      }).serialize(dataSet);

      expect(json.included).to.have.length(2);

      expect(json.included[0]).to.have.property('id')
        .equal('54735722e16620ba1eee36af');

      expect(json.included[0]).to.have.property('type').equal('addresses');

      expect(json.included[0]).to.have.property('attributes').to.be
        .an('object').eql({
          'address-line1': '406 Madison Court',
          'zip-code': '49426',
          'country': 'USA'
        });

      expect(json.data[0].relationships).to.have.property('address').that.is
        .an('object');

      expect(json.data[0].relationships.address.data).eql({
        id: '54735722e16620ba1eee36af',
        type: 'addresses'
      });

      expect(json.included[1]).to.have.property('id')
        .equal('123');

      done(null, json);
    });
  });

  describe('Compound documents', function () {
    it('should be set into the `data.relationships` and `included`', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{
          id: '52735730e16632ba1eee62dd',
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          isbn: '978-0062301239'
        }, {
          id: '52735780e16610ba1eee15cd',
          title: 'Steve Jobs',
          isbn: '978-1451648546'
        }]
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        books: [{
          id: '52735718e16610ba1eee15cd',
          title: 'Zero to One: Notes on Startups, or How to Build the Future',
          isbn: '978-0804139298'
        }, {
          id: '52735671e16610ba1eee15ff',
          title: 'Einstein: His Life and Universe',
          isbn: '978-0743264747'
        }]
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          ref: 'id',
          attributes: ['title', 'isbn']
        }
      }).serialize(dataSet);

      expect(json.included[0]).to.have.property('id')
        .equal('52735730e16632ba1eee62dd');

      expect(json.included[0]).to.have.property('type').equal('books');

      expect(json.included[0].attributes).to.be.eql({
        title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
        isbn: '978-0062301239'
      });

      expect(json.included[1]).to.have.property('id')
        .equal('52735780e16610ba1eee15cd');

      expect(json.included[1]).to.have.property('type').equal('books');

      expect(json.included[1].attributes).to.be.eql({
        title: 'Steve Jobs',
        isbn: '978-1451648546'
      });

      expect(json.data[0].relationships).to.have.property('books').that.is
        .an('object');

      expect(json.data[0].relationships.books.data).to.be.an('array')
        .eql([{
          type: 'books', 'id': '52735730e16632ba1eee62dd'
        }, {
          type: 'books', 'id': '52735780e16610ba1eee15cd'
        }]);

      done(null, json);
    });
  });

  describe('Multiple compound documents (array -> object)', function () {
    it('should be set into the `data.relationships` and `included`', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{
          id: '52735730e16632ba1eee62dd',
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          isbn: '978-0062301239',
          author: {
            id: '2934f384bb824a7cb7b238b8dc194a22',
            firstName: 'Ashlee',
            lastName: 'Vance'
          }
        }, {
          id: '52735780e16610ba1eee15cd',
          title: 'Steve Jobs',
          isbn: '978-1451648546',
          author: {
            id: '5ed95269a8334d8a970a2bd9fa599288',
            firstName: 'Walter',
            lastName: 'Isaacson'
          }
        }]
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          ref: 'id',
          attributes: ['title', 'isbn', 'author'],
          author: {
            ref: 'id',
            attributes: ['firstName', 'lastName']
          }
        }
      }).serialize(dataSet);

      expect(json.included).to.include({
        type: 'books',
        id: '52735730e16632ba1eee62dd',
        attributes: {
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          isbn: '978-0062301239'
        },
        relationships: {
          author: {
            data: { id: '2934f384bb824a7cb7b238b8dc194a22', type: 'authors' }
          }
        }
      });

      expect(json.included).to.include({
        type: 'books',
        id: '52735780e16610ba1eee15cd',
        attributes: {
          title: 'Steve Jobs',
          isbn: '978-1451648546'
        },
        relationships: {
          author: {
            data: {
              id: '5ed95269a8334d8a970a2bd9fa599288',
              type: 'authors'
            }
          }
        }
      });

      expect(json.included).to.include({
        id: '2934f384bb824a7cb7b238b8dc194a22',
        type: 'authors',
        attributes: {
          'first-name': 'Ashlee',
          'last-name': 'Vance'
        }
      });

      expect(json.included).to.include({
        id: '5ed95269a8334d8a970a2bd9fa599288',
        type: 'authors',
        attributes: {
          'first-name': 'Walter',
          'last-name': 'Isaacson'
        }
      });

      done(null, json);
    });
  });

  describe('Multiple compound documents (array -> array)', function () {
    it('should be set into the `data.relationships` and `included`', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{
          id: '52735730e16632ba1eee62dd',
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          isbn: '978-0062301239',
          authors: [{
            id: '2934f384bb824a7cb7b238b8dc194a22',
            firstName: 'Ashlee',
            lastName: 'Vance'
          }, {
            id: '5ed95269a8334d8a970a2bd9fa599288',
            firstName: 'Walter',
            lastName: 'Isaacson'
          }]
        }]
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          ref: 'id',
          attributes: ['title', 'isbn', 'authors'],
          authors: {
            ref: 'id',
            attributes: ['firstName', 'lastName']
          }
        }
      }).serialize(dataSet);

      expect(json.included).to.include({
        type: 'books',
        id: '52735730e16632ba1eee62dd',
        attributes: {
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          isbn: '978-0062301239'
        },
        relationships: {
          authors: {
            data: [
              { id: '2934f384bb824a7cb7b238b8dc194a22', type: 'authors' },
              { id: '5ed95269a8334d8a970a2bd9fa599288', type: 'authors' },
            ]
          }
        }
      });

      expect(json.included).to.include({
        id: '2934f384bb824a7cb7b238b8dc194a22',
        type: 'authors',
        attributes: {
          'first-name': 'Ashlee',
          'last-name': 'Vance'
        }
      });

      expect(json.included).to.include({
        id: '5ed95269a8334d8a970a2bd9fa599288',
        type: 'authors',
        attributes: {
          'first-name': 'Walter',
          'last-name': 'Isaacson'
        }
      });

      done(null, json);
    });
  });


  describe('Multiple compound documents (object -> array)', function () {
    it('should be set into the `data.relationships` and `included`', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          id: '5cd95269a8334d8a970a2bd9fa599278',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA',
          neighbours: [{
            id: '5490143e69e49d0c8f9fc6bc',
            firstName: 'Lawrence',
            lastName: 'Bennett'
          }]
        }
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          attributes: ['addressLine1', 'zipCode', 'country', 'neighbours'],
          neighbours: {
            ref: 'id',
            attributes: ['firstName', 'lastName'],
          }
        }
      }).serialize(dataSet);

      expect(json.included).to.include({
        id: '5cd95269a8334d8a970a2bd9fa599278',
        type: 'addresses',
        attributes: {
          'address-line1': '406 Madison Court',
          'zip-code': '49426',
          country: 'USA'
        },
        relationships: {
          neighbours: {
            data: [{ type: 'neighbours', id: '5490143e69e49d0c8f9fc6bc' }]
          }
        }
      });

      expect(json.included).to.include({
        type: 'neighbours',
        id: '5490143e69e49d0c8f9fc6bc',
        attributes: { 'first-name': 'Lawrence', 'last-name': 'Bennett' }
      });

      done(null, json);
    });
  });

  describe('Cycling references', function () {
    it('should set the relationships in both includes', function (done) {
      var dataSet = {
        id: '1',
        user: {
          id: '2',
          name: 'Sandro Munda',
          address: {
            id: '3',
            zipCode: '49426',
            primaryUser: { id: '2', name: 'Sandro Munda' },
          }
        }
      };

      var json = new JSONAPISerializer('cycling', {
        attributes: ['user'],
        user: {
          ref: 'id',
          attributes: ['name', 'address'],
          address: {
            ref: 'id',
            attributes: ['zipCode', 'primaryUser'],
            primaryUser: {
              ref: 'id',
              attributes: ['name']
            }
          }
        },
        keyForAttribute: 'camelCase',
        typeForAttribute: function (type) {
          if (type === 'primaryUser') { return 'users'; }
          return undefined;
        }
      }).serialize(dataSet);

      expect(json.included).contains({
        type: 'users',
        id: '2',
        attributes: { name: 'Sandro Munda' },
        relationships: { address: { data: { type: 'addresses', id: '3' } } }
      });

      expect(json.included).contains({
        type: 'addresses',
        id: '3',
        attributes: { zipCode: '49426' },
        relationships: { primaryUser: { data: { type: 'users', id: '2' } } }
      });

      done(null, json);
    });

    it('should merge the attributes together', function (done) {
      var dataSet = {
        id: '1',
        user: {
          id: '2',
          name: 'Sandro Munda',
          gender: null,
          age: 28,
          address: {
            id: '3',
            zipCode: '49426',
            primaryUser: {
              id: '2',
              name: 'Sandro Munda',
              gender: 'male'
            }
          }
        }
      };

      var json = new JSONAPISerializer('cycling', {
        attributes: ['user'],
        user: {
          ref: 'id',
          attributes: ['name', 'address', 'gender', 'age'],
          address: {
            ref: 'id',
            attributes: ['zipCode', 'primaryUser'],
            primaryUser: {
              ref: 'id',
              attributes: ['name', 'gender']
            }
          }
        },
        keyForAttribute: 'camelCase',
        typeForAttribute: function (type) {
          if (type === 'primaryUser') { return 'users'; }
          return undefined;
        }
      }).serialize(dataSet);

      expect(json.included).contains({
        type: 'users',
        id: '2',
        attributes: { name: 'Sandro Munda', gender: 'male', age: 28 },
        relationships: { address: { data: { type: 'addresses', id: '3' } } }
      });

      expect(json.included).contains({
        type: 'addresses',
        id: '3',
        attributes: { zipCode: '49426' },
        relationships: { primaryUser: { data: { type: 'users', id: '2' } } }
      });

      done(null, json);
    });

    it('should merge the attributes together (opposite)', function (done) {
      var dataSet = {
        id: '1',
        user: {
          id: '2',
          name: 'Sandro Munda',
          gender: null,
          address: {
            id: '3',
            zipCode: '49426',
            primaryUser: {
              id: '2',
              name: 'Sandro Munda',
              gender: 'male',
              age: 28
            }
          }
        }
      };

      var json = new JSONAPISerializer('cycling', {
        attributes: ['user'],
        user: {
          ref: 'id',
          attributes: ['name', 'address', 'gender'],
          address: {
            ref: 'id',
            attributes: ['zipCode', 'primaryUser'],
            primaryUser: {
              ref: 'id',
              attributes: ['name', 'gender', 'age']
            }
          }
        },
        keyForAttribute: 'camelCase',
        typeForAttribute: function (type) {
          if (type === 'primaryUser') { return 'users'; }
          return undefined;
        }
      }).serialize(dataSet);

      expect(json.included).contains({
        type: 'users',
        id: '2',
        attributes: { name: 'Sandro Munda', gender: 'male', age: 28 },
        relationships: { address: { data: { type: 'addresses', id: '3' } } }
      });

      expect(json.included).contains({
        type: 'addresses',
        id: '3',
        attributes: { zipCode: '49426' },
        relationships: { primaryUser: { data: { type: 'users', id: '2' } } }
      });

      done(null, json);
    });

    it('should ignore the attribute override with a falsy value', function (done) {
      var dataSet = {
        id: '1',
        user: {
          id: '2',
          name: 'Sandro Munda',
          gender: 'male',
          address: {
            id: '3',
            zipCode: '49426',
            primaryUser: {
              id: '2',
              name: 'Sandro Munda',
              gender: null
            }
          }
        }
      };

      var json = new JSONAPISerializer('cycling', {
        attributes: ['user'],
        user: {
          ref: 'id',
          attributes: ['name', 'address', 'gender'],
          address: {
            ref: 'id',
            attributes: ['zipCode', 'primaryUser'],
            primaryUser: {
              ref: 'id',
              attributes: ['name', 'gender']
            }
          }
        },
        keyForAttribute: 'camelCase',
        typeForAttribute: function (type) {
          if (type === 'primaryUser') { return 'users'; }
          return undefined;
        }
      }).serialize(dataSet);

      expect(json.included).contains({
        type: 'users',
        id: '2',
        attributes: { name: 'Sandro Munda', gender: 'male' },
        relationships: { address: { data: { type: 'addresses', id: '3' } } }
      });

      expect(json.included).contains({
        type: 'addresses',
        id: '3',
        attributes: { zipCode: '49426' },
        relationships: { primaryUser: { data: { type: 'users', id: '2' } } }
      });

      done(null, json);
    });

    it('should ignore the attribute override with a falsy value (opposite)', function (done) {
      var dataSet = {
        id: '1',
        user: {
          id: '2',
          name: 'Sandro Munda',
          gender: null,
          address: {
            id: '3',
            zipCode: '49426',
            primaryUser: {
              id: '2',
              name: 'Sandro Munda',
              gender: 'male'
            }
          }
        }
      };

      var json = new JSONAPISerializer('cycling', {
        attributes: ['user'],
        user: {
          ref: 'id',
          attributes: ['name', 'address', 'gender'],
          address: {
            ref: 'id',
            attributes: ['zipCode', 'primaryUser'],
            primaryUser: {
              ref: 'id',
              attributes: ['name', 'gender']
            }
          }
        },
        keyForAttribute: 'camelCase',
        typeForAttribute: function (type) {
          if (type === 'primaryUser') { return 'users'; }
          return undefined;
        }
      }).serialize(dataSet);

      expect(json.included).contains({
        type: 'users',
        id: '2',
        attributes: { name: 'Sandro Munda', gender: 'male' },
        relationships: { address: { data: { type: 'addresses', id: '3' } } }
      });

      expect(json.included).contains({
        type: 'addresses',
        id: '3',
        attributes: { zipCode: '49426' },
        relationships: { primaryUser: { data: { type: 'users', id: '2' } } }
      });

      done(null, json);
    });
  });

  describe('Top level links with an array of resources', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }];

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json).to.have.property('links').eql({
        self: 'http://localhost:3000/api/users'
      });

      done(null, json);
    });
  });

  describe('Top level links with a single resource', function () {
    it('should be set', function (done) {
      var dataSet = {
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: function(data){
            return 'http://localhost:3000/api/users/' + data.id;
          }
        },
        attributes: ['firstName', 'lastName']
      }).serialize(dataSet);

      expect(json).to.have.property('links').eql({
        self: 'http://localhost:3000/api/users/' + dataSet.id
      });

      done(null, json);
    });
  });

  describe('Top level links (Function)', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }];

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: function (users) {
            return 'http://localhost:3000/api/users/' + users[0].firstName;
          }
        },
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json).to.have.property('links').eql({
        self: 'http://localhost:3000/api/users/Sandro'
      });

      done(null, json);
    });
  });

  describe('Links inside data', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }, {
        id: '5490212e69e49d0c4f9fc6b4',
        firstName: 'Lawrence',
        lastName: 'Bennett'
      }];

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        dataLinks: {
          self: 'http://localhost:3000/api/datalinks'
        },
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json.data).to.include({
        type: 'users',
        id: '54735750e16638ba1eee59cb',
        attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' },
        links: { self: 'http://localhost:3000/api/datalinks' }
      });

      expect(json.data).to.include({
        type: 'users',
        id: '5490212e69e49d0c4f9fc6b4',
        attributes: { 'first-name': 'Lawrence', 'last-name': 'Bennett' },
        links: { self: 'http://localhost:3000/api/datalinks' }
      });

      done(null, json);
    });
  });

  describe('Links (Function) inside data', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }, {
        id: '5490212e69e49d0c4f9fc6b4',
        firstName: 'Lawrence',
        lastName: 'Bennett'
      }];

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        dataLinks: {
          self: function (dataSet, user) {
            return 'http://localhost:3000/api/datalinks/' + user.id;
          }
        },
        attributes: ['firstName', 'lastName'],
      }).serialize(dataSet);

      expect(json.data).to.include({
        type: 'users',
        id: '54735750e16638ba1eee59cb',
        attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' },
        links: {
          self: 'http://localhost:3000/api/datalinks/54735750e16638ba1eee59cb'
        }
      });

      expect(json.data).to.include({
        type: 'users',
        id: '5490212e69e49d0c4f9fc6b4',
        attributes: { 'first-name': 'Lawrence', 'last-name': 'Bennett' },
        links: {
          self: 'http://localhost:3000/api/datalinks/5490212e69e49d0c4f9fc6b4'
        }
      });

      done(null, json);
    });
  });

  describe('Links inside an array compound document', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        addresses: [{
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }],
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        addresses: [{
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }]
      }];

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName', 'addresses'],
        addresses: {
          ref: 'zipCode',
          attributes: ['addressLine1', 'country'],
          includedLinks: {
            self: 'http://localhost:4000/users/1/includedlinks'
          },
          relationshipLinks: {
            related: 'http://localhost:4000/users/1/addresses'
          }
        }
      }).serialize(dataSet);

      expect(json.included[0]).to.have.property('links');
      expect(json.included[0].links).eql({
        self: 'http://localhost:4000/users/1/includedlinks'
      });
      expect(json.data[0].relationships.addresses.links).eql({
        related: 'http://localhost:4000/users/1/addresses'
      });

      done(null, json);
    });
  });

  describe('Links (Function) inside an array compound document', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        addresses: [{
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }],
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        addresses: [{
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }]
      }];

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName', 'addresses'],
        addresses: {
          ref: 'zipCode',
          attributes: ['addressLine1', 'country'],
          includedLinks: {
            self: function (record, current) {
              return 'http://localhost:4000/addresses/' + current.zipCode;
            }
          },
          relationshipLinks: {
            related: function (record, current, parent) {
              return 'http://localhost:4000/users/' + parent.id +
                '/addresses/' + current[0].zipCode;
            }
          }
        }
      }).serialize(dataSet);

      expect(json.included[0]).to.have.property('links');
      expect(json.included[0].links).eql({
        self: 'http://localhost:4000/addresses/49426'
      });
      expect(json.data[0].relationships.addresses.links).eql({
        related: 'http://localhost:4000/users/54735750e16638ba1eee59cb/addresses/49426'
      });

      done(null, json);
    });
  });

  describe('Links inside an object compound document', function () {
    it('should be set', function (done) {
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
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'zipCode',
          attributes: ['addressLine1', 'country'],
          includedLinks: {
            self: 'http://localhost:4000/users/1/relationships/addresses',
            related: 'http://localhost:4000/users/1/addresses'
          }
        }
      }).serialize(dataSet);

      expect(json.included[0]).to.have.property('links');
      expect(json.included[0].links).eql({
        self: 'http://localhost:4000/users/1/relationships/addresses',
        related: 'http://localhost:4000/users/1/addresses'
      });

      done(null, json);
    });
  });

  describe('Links (Function) inside an object compound document', function () {
    it('should be set', function (done) {
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
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'zipCode',
          attributes: ['addressLine1', 'country'],
          includedLinks: {
            self: function (record, current) {
              return 'http://localhost:4000/addresses/' + current.zipCode;
            }
          }
        }
      }).serialize(dataSet);

      expect(json.included[0]).to.have.property('links');
      expect(json.included[0].links).eql({
        self: 'http://localhost:4000/addresses/49426'
      });

      done(null, json);
    });
  });

  describe('Related Meta inside an array compound document', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        addresses: [{
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }],
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        addresses: [{
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }]
      }];

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName', 'addresses'],
        addresses: {
          ref: 'zipCode',
          attributes: ['addressLine1', 'country'],
          includedLinks: {
            self: 'http://localhost:4000/users/1/includedlinks'
          },
          relationshipMeta: {
            count: 1
          }
        }
      }).serialize(dataSet);

      expect(json.data[0].relationships.addresses.meta).eql({
        count: 1
      });

      done(null, json);
    });
  });

  describe('Related Meta (Function) inside an array compound document', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        addresses: [{
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }],
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        addresses: [{
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }]
      }];

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName', 'addresses'],
        addresses: {
          ref: 'zipCode',
          attributes: ['addressLine1', 'country'],
          includedLinks: {
            self: function (record, current) {
              return 'http://localhost:4000/addresses/' + current.zipCode;
            }
          },
          relationshipMeta: {
            count: function (record) {
              return record.addresses.length;
            }
          }
        }
      }).serialize(dataSet);

      expect(json.data[0].relationships.addresses.meta).eql({
        count: 1
      });

      done(null, json);
    });
  });

  describe('Duplicate compound document', function () {
    it('should not have duplicated entries into included', function (done) {
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
          id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          attributes: ['addressLine1', 'zipCode', 'country']
        }
      }).serialize(dataSet);

      expect(json.included).to.have.length(1);
      done(null, json);
    });
  });

  describe('ignoreRelationshipData on a relationship', function () {
    it('should not contains the data key', function (done) {
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

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          ignoreRelationshipData: true,
          relationshipLinks: {
            related: '/foo/bar'
          }
        }
      }).serialize(dataSet);

      expect(json.data[0].relationships.address).to.not.have.key('data');
      expect(json.data[1].relationships.address).to.not.have.key('data');
      done(null, json);
    });
  });

  describe('Empty relationships', function () {
    it('should have a null `data` attribute when relationship is one-to', function (done) {
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
        address: {}
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          relationshipLinks: {
            related: '/foo/bar'
          }
        }
      }).serialize(dataSet);

      expect(json.data[0].relationships.address.data).to.be.an('object');
      expect(json.data[1].relationships.address.data).to.equal(null);
      done(null, json);
    });

    it('should not add a resource to included for null `data` relationship', function (done) {
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
        address: {}
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          attributes: ['addressLine1', 'zipCode', 'country']
        },
      }).serialize(dataSet);

      expect(json.data[0].relationships.address.data).to.be.an('object');
      expect(json.data[1].relationships.address.data).to.equal(null);
      expect(json).to.have.property('included').to.be.an('array').with
        .length(1);
      expect(json.included[0].id).to.equal('54735722e16620ba1eee36af');

      done(null, json);
    });

    it('should have an empty array for the `data` attribute when relationship is many-to', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: [{
          id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }, {
          id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        }]
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: []
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          relationshipLinks: {
            related: '/foo/bar'
          }
        }
      }).serialize(dataSet);

      // jshint expr: true
      expect(json.data[0].relationships.address.data).to.not.be.empty;
      expect(json.data[1].relationships.address.data).to.be.empty;
      done(null, json);
    });

    it('should ignore the attribute when missing in the dataSet', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda'
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          ignoreRelationshipData: true,
          relationshipLinks: {
            related: '/foo/bar'
          }
        }
      }).serialize(dataSet);

      // jshint expr: true
      expect(json.data[0].relationships).to.be.undefined;
      done(null, json);
    });

    it('should set the attr to null with nullIfMissing option', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda'
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          nullIfMissing: true
        }
      }).serialize(dataSet);

      // jshint expr: true
      expect(json.data[0].attributes.address).to.be.null;
      done(null, json);
    });

    it('should add the relationship with nullIfMissing option', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda'
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          nullIfMissing: true,
          relationshipLinks: {
            related: '/foo/bar'
          }
        }
      }).serialize(dataSet);

      // jshint expr: true
      expect(json.data[0].relationships.address.data).to.be.null;
      expect(json.data[0].relationships.address.links).eql({
        related: '/foo/bar'
      });
      done(null, json);
    });

    it('should ignore null relationships', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: null
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          attributes: ['country'],
          country: {
            ref: 'id',
            attributes: ['name']
          }
        }
      }).serialize(dataSet);

      // jshint expr: true
      expect(json.data[0].relationships.address.data).to.be.null;
      done(null, json);
    });

    it('should only serialize address.street attribute', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: [{
          type: 'home',
          street: 'Dogwood Way',
          zip: '12345'
        },{
          type: 'work',
          street: 'Dogwood Way 2',
          zip: '12345'
        }]
      };

      var json = new JSONAPISerializer('users', {
        attributes: ['id', 'firstName', 'updated_at', 'address'],
        address: {
          attributes: ['street']
        }
      }).serialize(dataSet);

      expect(json.data.attributes.address).eql([
        { street: 'Dogwood Way' },
        { street: 'Dogwood Way 2' }
      ]);

      done(null, json);
    });
  });

  describe('Database model objects', function () {
    it('properly pass on requests for attributes', function () {
      var mongoose = require('mongoose');
      var userSchema = new mongoose.Schema({ firstName: String, lastName: String });
      var User = mongoose.model('User', userSchema);
      var user = new User({ firstName: 'Lawrence', lastName: 'Bennett' });

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName']
      }).serialize(user);

      expect(json.data.attributes).to.have.property('first-name');
      expect(json.data.attributes).to.have.property('last-name');
    });
  });

  describe('falsy attribute values', function () {
    it('properly attach falsy attributes', function () {
      var dataSet = {
        id: '1',
        count: 0,
        bool: false,
        dbNull: null,
        emptyString: ''
      };

      var json = new JSONAPISerializer('tester', {
        attributes: ['count', 'bool', 'dbNull', 'emptyString']
      }).serialize(dataSet);

      expect(json.data.attributes).to.have.property('count');
      expect(json.data.attributes.count).to.equal(0);
      expect(json.data.attributes).to.have.property('bool');
      expect(json.data.attributes.bool).to.equal(false);
      expect(json.data.attributes).to.have.property('db-null');
      expect(json.data.attributes['db-null']).to.equal(null);
      expect(json.data.attributes).to.have.property('empty-string');
      expect(json.data.attributes['empty-string']).to.equal('');
    });
  });

  describe('Attribute name mapping', function () {
    it('should use the correct attribute names', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        meta: {
          id: '1',
          foo: 'bar'
        }
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'meta:metum'],
        metum: {
          ref: 'id',
          attributes: ['foo']
        },
        meta: { count: 1 }
      }).serialize(dataSet);

      expect(json).to.be.eql({
        meta: { count: 1 },
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro'
          },
          relationships: {
            meta: {
              data: { type: 'meta', id: '1' }
            }
          }
        }],
        included: [{
          type: 'meta',
          id: '1',
          attributes: { foo: 'bar' }
        }]
      });

      done(null, json);
    });
  });

  describe('ref: true', function () {
     it('should serialize strings as relationships', function (done) {
       var dataSet = [{
         id: '54735750e16638ba1eee59cb',
         firstName: 'Sandro',
         lastName: 'Munda',
         address: ['54735722e16620ba1eee36af', '54735722e16620ba1eee36af']
       }, {
         id: '5490143e69e49d0c8f9fc6bc',
         firstName: 'Lawrence',
         lastName: 'Bennett',
         address: []
       }];

       var json = new JSONAPISerializer('users', {
         attributes: ['firstName', 'lastName', 'address'],
         address: {
           ref: true
         }
       }).serialize(dataSet);

       done(null, json);
     });

    it('should serialize string as relationship', function (done) {
      var dataSet = {
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: '54735722e16620ba1eee36af'
      };

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: true
        }
      }).serialize(dataSet);

      expect(json.data.relationships.address.data.id).to
        .equal('54735722e16620ba1eee36af');

      done(null, json);
    });

    it('should convert IDs to string', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: [5]
      }];

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: true
        }
      }).serialize(dataSet);

      expect(json.data[0].relationships.address.data[0].id).to
        .equal('5');

      done(null, json);
    });

    it('should convert ID to string', function (done) {
      var dataSet = {
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: 10
      };

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: true
        }
      }).serialize(dataSet);

      expect(json.data.relationships.address.data.id).to
        .equal('10');

      done(null, json);
    });
  });

  describe('transform', function () {
    it('should transform record before serialization', function (done) {
      var Inflector = require('inflected');
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{ createdAt: '2015-08-04T06:09:24.864Z' }],
        address: { zipCode: 42912 }
      };

      var json = new JSONAPISerializer('user', {
        attributes: ['fullName', 'books', 'address'],
        books: { attributes: ['createdAt'] },
        address: { attributes: ['zipCode'] },
        pluralizeType: false,
        keyForAttribute: function (attribute) {
          return Inflector.underscore(attribute);
        },
        transform: function (record) {
          record.fullName = record.firstName + ' ' + record.lastName;
          return record;
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user');
      expect(json.data).to.have.property('attributes').that.is
        .an('object')
        .eql({
          'full_name': 'Sandro Munda',
          books: [{ 'created_at': '2015-08-04T06:09:24.864Z' }],
          address: { 'zip_code': 42912 }
        });

      done(null, json);
    });
  });

  describe('relationshipLinks', function () {
    it('should set the relationshipLinks parameter when the nullIfMissing is used', function () {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{
          id: '1',
          createdAt: '2015-08-04T06:09:24.864Z',
          publisher: {
            id: '1',
            name: 'hachette'
          }
        }, {
          id: '2',
          createdAt: '2015-08-04T07:09:24.864Z'
        }]
      };

      var json = new JSONAPISerializer('users', {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          ref: 'id',
          attributes: ['createdAt', 'publisher'],
          relationshipLinks: {
            related: 'foo'
          },
          publisher: {
            ref: 'id',
            attributes: ['name'],
            nullIfMissing: true,
            relationshipLinks: {
              related: 'bar'
            },
          }
        }
      }).serialize(dataSet);

      expect(json.included).eql([{
        type: 'publishers',
        id: '1',
        attributes: { name: 'hachette' }
      }, {
        type: 'books',
        id: '1',
        attributes: { 'created-at': '2015-08-04T06:09:24.864Z' },
        relationships: { publisher: { data: { type: 'publishers', id: '1' }, links: { related: 'bar' } } }
      }, {
        type: 'books',
        id: '2',
        attributes: { 'created-at': '2015-08-04T07:09:24.864Z' },
        relationships: { publisher: { data: null, links: { related: 'bar' } } }
      }]);
    });

    it('should not be set when the relationshipLinks return null', function () {
      var dataSet = {
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: null,
      };

      var json = new JSONAPISerializer('users', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          relationshipLinks: {
            related: function () {
              return null;
            }
          },
        }
      }).serialize(dataSet);

      expect(json.data.relationships.address).eql({ data: null });
    });
  });
});
