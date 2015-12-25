'use strict';
/* global describe, it */

var expect = require('chai').expect;
var _ = require('lodash');

var JsonApiSerializer = require('../lib/serializer');

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

      var json = new JsonApiSerializer('users', dataSet, {
        id: '_id',
        attributes: ['firstName', 'lastName']
      });

      expect(json.data[0].id).equal('54735750e16638ba1eee59cb');
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

      var json = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName', 'lastName'],
        pluralizeType: false
      });

      expect(json.data.type).equal('user');

      // Confirm it response the same with a truthy setting
      json = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName', 'lastName'],
        pluralizeType: true
      });

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

      var json = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName', 'lastName'],
        typeForAttribute: function (attribute) {
          return attribute + '_foo';
        }
      });

      expect(json.data.type).equal('user_foo');
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

      var json = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: function(user, address) {
            return address.id;
          }
        },
        typeForAttribute: function (attribute, record) {
          if (record) {
            if (record.type) {
              return record.type;
            }
          }
          return attribute;
        }
      });

      expect(json.data.type).equal('user');
      expect(json.included[0]).to.have.property('type').equal('home');
      expect(json.included[1]).to.have.property('type').equal('work');

      expect(json.data.relationships).to.have.property('address').that.is.an('object');
      expect(json.data.relationships.address.data[0]).to.have.property('type').that.is.eql('home');
      expect(json.data.relationships.address.data[1]).to.have.property('type').that.is.eql('work');

      done(null, json);
    });
  });

  describe('meta', function () {
    it('should set the meta key', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      var json = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName', 'lastName'],
        meta: { count: 1 }
      });

      expect(json.meta.count).equal(1);
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

      var json = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          attributes: ['addressLine1', 'zipCode', 'country']
        }
      });

      expect(json.data[0]).to.have.property('relationships');
      expect(json.data[1]).to.have.property('relationships');
      expect(json).to.not.have.property('included');
      done(null, json);
    });
  });

  describe('keyForAttribute', function () {
    it('should serialize attribute in underscore', function (done) {
      var inflection = require('inflection');
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{ createdAt: '2015-08-04T06:09:24.864Z' }],
        address: { zipCode: 42912 }
      };

      var json = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName', 'lastName', 'books', 'address'],
        books: { attributes: ['createdAt'] },
        address: { attributes: ['zipCode'] },
        pluralizeType: false,
        keyForAttribute: function (attribute) {
          return inflection.underscore(attribute);
        }
      });

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

      var json = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName', 'lastName', 'phoneNumber', 'address'],
        address: { attributes: ['zipCode'] },
        pluralizeType: false,
        keyForAttribute: function (attribute) {
          return _.camelCase(attribute);
        }
      });

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
      var jsonNoCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
      });

      var jsonInvalidCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'invalid case name'
      });

      expect(jsonNoCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonInvalidCase.data.attributes['first-name']).equal('Sandro');

      done(null, jsonNoCase);
    });

    it('should update the key case to dash-case', function (done) {
      var jsonDashCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'dash-case'
      });

      var jsonLispCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'lisp-case'
      });

      var jsonSpinalCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'spinal-case'
      });
      var jsonKababCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'kebab-case'
      });

      expect(jsonDashCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonLispCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonSpinalCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonKababCase.data.attributes['first-name']).equal('Sandro');

      done(null, jsonDashCase);
    });

    it('should update the key case to underscore_case', function (done) {
      var jsonUnderscoreCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'underscore_case'
      });

      var jsonSnakeCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'snake_case'
      });

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

      var jsonCamelCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'CamelCase'
      });

      expect(jsonCamelCase.data.attributes.FirstName).equal('Sandro');

      done(null, jsonCamelCase);
    });

    it('should update the key case to camelCase', function (done) {
      var dataSet = {
        id: '1',
        firstName: 'Sandro',
      };

      var jsonCamelCase = new JsonApiSerializer('user', dataSet, {
        attributes: ['firstName'],
        keyForAttribute: 'camelCase'
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        id: 'id',
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: function (collection, field) {
            return collection.id + field.country + field.zipCode;
          },
          attributes: ['addressLine1', 'country', 'zipCode']
        }
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName'],
      });

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

      var json = new JsonApiSerializer('users', resource, {
        attributes: ['firstName', 'lastName'],
      });

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

      var json = new JsonApiSerializer('users', resource, {
        attributes: ['firstName', 'lastName'],
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          attributes: ['addressLine1', 'zipCode', 'country']
        }
      });

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

      var json = new JsonApiSerializer('tags', dataSet, {
        ref: true,
        included: false,
        topLevelLinks: {
          self: '/articles/1/relationships/tags',
          related: '/articles/1/tags'
        }
      });

      expect(json.data[0]).to.not.have.key('attributes');
      expect(json.data[1]).to.not.have.key('attributes');

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          attributes: ['title', 'isbn']
        }
      });

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

  describe('Nested of nested document', function () {
    it('should be serialized', function (done) {
      var inflection = require('inflection');
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

      var json = new JsonApiSerializer('users', dataSet, {
        id: '_id',
        attributes: ['_id', 'firstName', 'lastName', 'foo'],
        keyForAttribute: function (key) {
          return inflection.underscore(key);
        },
        foo: {
          attributes: ['bar'],
          bar: {
            attributes: ['firstName', 'lastName', 'barbar'],
            barbar: {
              attributes: ['firstName']
            }
          }
        }
      });

      expect(json.data).to.have.property('attributes').that.is
        .an('object')
        .eql({
          id: '54735750e16638ba1eee59cb',
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
          id: '54735697e16624ba1eee36bf',
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          attributes: ['addressLine1', 'addressLine2', 'zipCode', 'country']
        }
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          ref: 'id',
          attributes: ['title', 'isbn']
        }
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          ref: 'id',
          attributes: ['title', 'isbn', 'author'],
          author: {
            ref: 'id',
            attributes: ['firstName', 'lastName']
          }
        }
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          ref: 'id',
          attributes: ['title', 'isbn', 'authors'],
          authors: {
            ref: 'id',
            attributes: ['firstName', 'lastName']
          }
        }
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          attributes: ['addressLine1', 'zipCode', 'country', 'neighbours'],
          neighbours: {
            ref: 'id',
            attributes: ['firstName', 'lastName'],
          }
        }
      });

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

  describe('Top level links with an array of resources', function () {
    it('should be set', function (done) {
      var dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }];

      var json = new JsonApiSerializer('users', dataSet, {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        attributes: ['firstName', 'lastName'],
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        topLevelLinks: {
          self: function(data){
            return 'http://localhost:3000/api/users/' + data.id;
          }
        },
        attributes: ['firstName', 'lastName']
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        topLevelLinks: {
          self: function (users) {
            return 'http://localhost:3000/api/users/' + users[0].firstName;
          }
        },
        attributes: ['firstName', 'lastName'],
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        dataLinks: {
          self: 'http://localhost:3000/api/datalinks'
        },
        attributes: ['firstName', 'lastName'],
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        topLevelLinks: {
          self: 'http://localhost:3000/api/users'
        },
        dataLinks: {
          self: function (dataSet, user) {
            return 'http://localhost:3000/api/datalinks/' + user.id;
          }
        },
        attributes: ['firstName', 'lastName'],
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
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
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
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
            related: function (record, current) {
              return 'http://localhost:4000/addresses/' + current[0].zipCode;
            }
          }
        }
      });

      expect(json.included[0]).to.have.property('links');
      expect(json.included[0].links).eql({
        self: 'http://localhost:4000/addresses/49426'
      });
      expect(json.data[0].relationships.addresses.links).eql({
        related: 'http://localhost:4000/addresses/49426'
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

      var json = new JsonApiSerializer('users', dataSet, {
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
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
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
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
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
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
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
            count: function (record, current) {
              return record.addresses.length;
            }
          }
        }
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          attributes: ['addressLine1', 'zipCode', 'country']
        }
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          ignoreRelationshipData: true,
          relationshipLinks: {
            related: '/foo/bar'
          }
        }
      });

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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          relationshipLinks: {
            related: '/foo/bar'
          }
        }
      });

      expect(json.data[0].relationships.address.data).to.be.an('object');
      expect(json.data[1].relationships.address.data).to.equal(null);
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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          relationshipLinks: {
            related: '/foo/bar'
          }
        }
      });

      expect(json.data[0].relationships.address.data).to.not.be.empty;
      expect(json.data[1].relationships.address.data).to.be.empty;
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

      var json = new JsonApiSerializer('users', dataSet, {
        attributes: ['id', 'firstName', 'updated_at', 'address'],
        address: {
          attributes: ['street']
        }
      });

      expect(json.data.attributes.address).eql([
        { street: 'Dogwood Way' },
        { street: 'Dogwood Way 2' }
      ]);

      done(null, json);
    });
  });
});
