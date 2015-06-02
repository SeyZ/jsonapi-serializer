'use strict';
/* global describe, it */

var expect = require('chai').expect;

var JsonApiSerializer = require('../lib/serializer');

describe('Options', function () {
  describe('apiEndpointValue', function () {
    it('should override the apiEndpoint url', function (done) {
      new JsonApiSerializer('users', [], {
        apiEndpoint: 'http://localhost:3000/api',
        apiEndpointValue: 'http://localhost:3000/override'
      }).then(function (json) {
        expect(json).to.have.property('links');
        expect(json.links).to.have.property('self')
          .equal('http://localhost:3000/override');
        done(null, json);
      });
    });
  });
});

describe('JSON API Serializer', function () {
  describe('Flat data', function () {
    it('should be set into the `data.attributes`', function (done) {
      var dataSet = [{
        _id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }, {
        _id: '5490212e69e49d0c4f9fc6b4',
        firstName: 'Lawrence',
        lastName: 'Bennett'
      }];

      new JsonApiSerializer('users', dataSet, {
        apiEndpoint: 'http://localhost:3000/api',
        attributes: ['firstName', 'lastName'],
      }).then(function (json) {
        expect(json).to.have.property('data').with.length(2);

        expect(json.data[0]).to.have.property('id')
          .equal('54735750e16638ba1eee59cb');

        expect(json.data[0]).to.have.property('type').equal('users');

        expect(json.data[0]).to.have.property('attributes').that.is
          .an('object')
          .eql({
            firstName: 'Sandro',
            lastName: 'Munda',
          });

        done(null, json);
      });
    });
  });

  describe('Embedded data without relationships', function () {
    it('should be set into the `data.attributes`', function (done) {
      var dataSet = [{
        _id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        },
      }, {
        _id: '5490212e69e49d0c4f9fc6b4',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: {
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      new JsonApiSerializer('users', dataSet, {
        apiEndpoint: 'http://localhost:3000/api',
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          attributes: ['addressLine1', 'zipCode', 'country']
        }
      }).then(function (json) {
        expect(json.data[0].attributes).to.have.property('address')
          .that.is.an('object')
          .eql({
            addressLine1: '406 Madison Court',
            zipCode: '49426',
            country: 'USA'
          });

        done(null, json);
      });
    });
  });

  describe('Embedded data with relationships', function () {
    it('should be set into the `data.relationships` and `included`', function (done) {
      var dataSet = [{
        _id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          _id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        },
      }, {
        _id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: {
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      new JsonApiSerializer('users', dataSet, {
        apiEndpoint: 'http://localhost:3000/api',
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: '_id',
          attributes: ['addressLine1', 'addressLine2', 'zipCode', 'country']
        }
      }).then(function (json) {
        expect(json.included).to.have.length(2);

        expect(json.included[0]).to.have.property('id')
          .equal('54735722e16620ba1eee36af');

        expect(json.included[0]).to.have.property('type').equal('addresses');

        expect(json.included[0]).to.have.property('attributes').to.be
          .an('object').eql({
            addressLine1: '406 Madison Court',
            zipCode: '49426',
            country: 'USA'
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
  });

  describe('Embedded array of data without relationships', function () {
    it('should be set into the `data.attributes`', function (done) {
      var dataSet = [{
        _id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          ISBN: '978-0062301239'
        }, {
          title: 'Steve Jobs',
          ISBN: '978-1451648546'
        }]
      }, {
        _id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        books: [{
          title: 'Zero to One: Notes on Startups, or How to Build the Future',
          ISBN: '978-0804139298'
        }, {
          title: 'Einstein: His Life and Universe',
          ISBN: '978-0743264747'
        }]
      }];

      new JsonApiSerializer('users', dataSet, {
        apiEndpoint: 'http://localhost:3000/api',
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          attributes: ['title', 'ISBN']
        }
      }).then(function (json) {
        expect(json.data[0].attributes).to.have.property('books')
          .that.is.an('array')
          .eql([{
            title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
            ISBN: '978-0062301239'
          }, {
            title: 'Steve Jobs',
            ISBN: '978-1451648546'
          }]);
        done(null, json);
      });
    });
  });

  describe('Embedded array of data with relationships', function () {
    it('should be set into the `data.relationships` and `included`', function (done) {
      var dataSet = [{
        _id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{
          _id: '52735730e16632ba1eee62dd',
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          ISBN: '978-0062301239'
        }, {
          _id: '52735780e16610ba1eee15cd',
          title: 'Steve Jobs',
          ISBN: '978-1451648546'
        }]
      }, {
        _id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        books: [{
          _id: '52735718e16610ba1eee15cd',
          title: 'Zero to One: Notes on Startups, or How to Build the Future',
          ISBN: '978-0804139298'
        }, {
          _id: '52735671e16610ba1eee15ff',
          title: 'Einstein: His Life and Universe',
          ISBN: '978-0743264747'
        }]
      }];

      new JsonApiSerializer('users', dataSet, {
        apiEndpoint: 'http://localhost:3000/api',
        attributes: ['firstName', 'lastName', 'books'],
        books: {
          ref: '_id',
          attributes: ['title', 'ISBN']
        }
      }).then(function (json) {
        expect(json.included[0]).to.have.property('id')
          .equal('52735730e16632ba1eee62dd');

        expect(json.included[0]).to.have.property('type').equal('books');

        expect(json.included[0].attributes).to.be.eql({
          title: 'Tesla, SpaceX, and the Quest for a Fantastic Future',
          ISBN: '978-0062301239'
        });

        expect(json.included[1]).to.have.property('id')
          .equal('52735780e16610ba1eee15cd');

        expect(json.included[1]).to.have.property('type').equal('books');

        expect(json.included[1].attributes).to.be.eql({
          title: 'Steve Jobs',
          ISBN: '978-1451648546'
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
  });

});
