'use strict';
/* global describe, it */

var expect = require('chai').expect;
var _ = require('lodash');

var JSONAPISerializer = require('../../lib/serializer');
describe('JSON API Serializer ref: true', function() {
  it('should serialize strings as relationships', function(done) {
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

  it('should serialize string as relationship', function(done) {
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

  it('should convert IDs to string', function(done) {
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

  it('should convert ID to string', function(done) {
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
