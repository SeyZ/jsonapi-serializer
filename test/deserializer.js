'use strict';
/* global describe, it */

var expect = require('chai').expect;

var JSONAPIDeserializer = require('../lib/deserializer');

describe('JSON API Deserializer', function () {
  describe('simple JSONAPI array document', function () {
    it('should returns attributes', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: { 'first-name': 'Lawrence', 'last-name': 'Bennett' }
        }]
      };

      new JSONAPIDeserializer()
        .deserialize(dataSet, function (err, json) {
          expect(json).to.be.an('array').with.length(2);
          expect(json[0]).to.be.eql({
            id: '54735750e16638ba1eee59cb',
            'first-name': 'Sandro',
            'last-name': 'Munda'
          });
          expect(json[1]).to.be.eql({
            id: '5490143e69e49d0c8f9fc6bc',
            'first-name': 'Lawrence',
            'last-name': 'Bennett'
          });

          done(null, json);
        });
    });
  });

  describe('simple JSONAPI single document', function () {
    it('should returns attributes', function (done) {
      var dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }
      };

      new JSONAPIDeserializer()
        .deserialize(dataSet, function (err, json) {
          expect(json).to.be.eql({
            id: '54735750e16638ba1eee59cb',
            'first-name': 'Sandro',
            'last-name': 'Munda'
          });

          done(null, json);
        });
    });

    it('should return camelCase attributes', function (done) {
      var dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }
      };

      new JSONAPIDeserializer({
        keyForAttribute: 'camelCase'
      }).deserialize(dataSet, function (err, json) {
        expect(json).to.be.eql({
          id: '54735750e16638ba1eee59cb',
          firstName: 'Sandro',
          lastName: 'Munda'
        });

        done(null, json);
      });
    });
  });

  describe('Nested documents', function () {
    it('should returns attributes', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda',
            books: [{
              'book-title': 'Tesla, SpaceX.',
              isbn: '978-0062301239'
            }, {
              'book-title': 'Steve Jobs',
              isbn: '978-1451648546'
            }]
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            'first-name': 'Lawrence',
            'last-name': 'Bennett',
            books: [{
              'book-title': 'Zero to One',
              isbn: '978-0804139298'
            }, {
              'book-title': 'Einstein: His Life and Universe',
              isbn: '978-0743264747'
            }]
          }
        }]
      };

      new JSONAPIDeserializer({ keyForAttribute: 'camelCase' })
        .deserialize(dataSet, function (err, json) {
          expect(json).to.be.an('array').with.length(2);

          expect(json[0]).to.have.key('id', 'firstName', 'lastName', 'books');
          expect(json[0].books).to.be.an('array');
          expect(json[0].books[0]).to.be.eql({
            bookTitle: 'Tesla, SpaceX.',
            isbn: '978-0062301239'
          });
          expect(json[0].books[1]).to.be.eql({
            bookTitle: 'Steve Jobs',
            isbn: '978-1451648546'
          });

          expect(json[1]).to.have.key('id', 'firstName', 'lastName',
            'books');
          done(null, json);
        });
    });
  });

  describe('Compound document', function () {
    it('should merge included relationships to attributes', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            'first-name': 'Lawrence',
            'last-name': 'Bennett'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
            }
          }
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            'address-line1': '406 Madison Court',
            'zip-code': '49426',
            country: 'USA'
          }
        }, {
          type: 'addresses',
          id: '54735697e16624ba1eee36bf',
          attributes: {
            'address-line1': '361 Shady Lane',
            'zip-code': '23185',
            country: 'USA'
          }
        }]
      };

      new JSONAPIDeserializer()
      .deserialize(dataSet, function (err, json) {
        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'first-name', 'last-name',
          'address');

        expect(json[0].address).to.be.eql({
          id: '54735722e16620ba1eee36af',
          'address-line1': '406 Madison Court',
          'zip-code': '49426',
          country: 'USA'
        });

        expect(json[1]).to.have.key('id', 'first-name', 'last-name',
          'address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          'address-line1': '361 Shady Lane',
          'zip-code': '23185',
          country: 'USA'
        });

        done(null, json);
      });
    });

    it('should convert relationship attributes to camelCase', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda'
          },
          relationships: {
            'my-address': {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            'first-name': 'Lawrence',
            'last-name': 'Bennett'
          },
          relationships: {
            'my-address': {
              data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
            }
          }
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            'address-line1': '406 Madison Court',
            'zip-code': '49426',
            country: 'USA'
          }
        }, {
          type: 'addresses',
          id: '54735697e16624ba1eee36bf',
          attributes: {
            'address-line1': '361 Shady Lane',
            'zip-code': '23185',
            country: 'USA'
          }
        }]
      };

      new JSONAPIDeserializer({keyForAttribute: 'camelCase'})
      .deserialize(dataSet, function (err, json) {
        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'firstName', 'lastName',
          'myAddress');

        expect(json[0].myAddress).to.be.eql({
          id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        });

        expect(json[1]).to.have.key('id', 'firstName', 'lastName',
          'myAddress');

        expect(json[1].myAddress).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        });

        done(null, json);
      });

    });

    describe('With multiple levels', function () {
      it('should merge all include relationships to attributes', function (done) {
        var dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              'first-name': 'Lawrence',
              'last-name': 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA'
            },
            relationships: {
              lock: { data: { type: 'lock', id: '1' } }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36bf',
            attributes: {
              'address-line1': '361 Shady Lane',
              'zip-code': '23185',
              country: 'USA'
            },
            relationships: {
              lock: {
                data: { type: 'lock', id: '2' }
              }
            }
          }, {
            type: 'lock',
            id: '1',
            attributes: {
              'secret-key': 'S*7v0oMf7YxCtFyA$ffy'
            },
            relationships: {
              key: {
                data: { type: 'key', id: '1' }
              }
            }
          }, {
            type: 'key',
            id: '1',
            attributes: {
              'public-key': '1*waZCXVE*XXpn*Izc%t'
            }
          }]
        };

        new JSONAPIDeserializer()
          .deserialize(dataSet, function (err, json) {
            expect(json).to.be.an('array').with.length(2);

            expect(json[0]).to.have.key('id', 'first-name', 'last-name',
              'address');

            expect(json[0].address).to.be.eql({
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA',
              id: '54735722e16620ba1eee36af',
              lock: {
                id: '1',
                'secret-key': 'S*7v0oMf7YxCtFyA$ffy',
                key: {
                  id: '1',
                  'public-key': '1*waZCXVE*XXpn*Izc%t'
                }
              }
            });

            expect(json[1]).to.have.key('id', 'first-name', 'last-name',
              'address');

            expect(json[1].address).to.be.eql({
              id: '54735697e16624ba1eee36bf',
              'address-line1': '361 Shady Lane',
              'zip-code': '23185',
              country: 'USA'
            });

            done();
          });
      });
    });

    describe('With relationships data array', function () {
      it('should merge included relationships to attributes', function (done) {
        var dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              'first-name': 'Lawrence',
              'last-name': 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA'
            },
            relationships: {
              locks: {
                data: [{ type: 'lock', id: '1' }, { type: 'lock', id: '2' }]
              }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36bf',
            attributes: {
              'address-line1': '361 Shady Lane',
              'zip-code': '23185',
              country: 'USA'
            }
          }, {
            type: 'lock',
            id: '1',
            attributes: {
              'secret-key': 'S*7v0oMf7YxCtFyA$ffy'
            }
          }, {
            type: 'lock',
            id: '2',
            attributes: {
              'secret-key': 'En8zd6ZT6#q&Fz^EwGMy'
            }
          }]
        };

        new JSONAPIDeserializer()
          .deserialize(dataSet, function (err, json) {
            expect(json).to.be.an('array').with.length(2);

            expect(json[0]).to.have.key('id', 'first-name', 'last-name',
              'address');

            expect(json[0].address).to.be.eql({
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA',
              id: '54735722e16620ba1eee36af',
              locks: [
                { 'secret-key': 'S*7v0oMf7YxCtFyA$ffy', id: '1' },
                { 'secret-key': 'En8zd6ZT6#q&Fz^EwGMy', id: '2' }
              ]
            });

            expect(json[1]).to.have.key('id', 'first-name', 'last-name',
              'address');

            expect(json[1].address).to.be.eql({
              id: '54735697e16624ba1eee36bf',
              'address-line1': '361 Shady Lane',
              'zip-code': '23185',
              country: 'USA'
            });

            done(null, json);
          });
      });
    });

    describe('Without included', function () {
      it('should use the value of valueForRelationship opt', function (done) {
        var dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              'first-name': 'Lawrence',
              'last-name': 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }]
        };

        new JSONAPIDeserializer({
          addresses: {
            valueForRelationship: function (relationship) {
              return {
                id: relationship.id,
                'address-line1': '406 Madison Court',
                'zip-code': '49426',
                country: 'USA'
              };
            }
          }
        })
        .deserialize(dataSet, function (err, json) {
          expect(json).to.be.an('array').with.length(2);

          expect(json[0]).to.have.key('id', 'first-name', 'last-name',
            'address');

          expect(json[0].address).to.be.eql({
            id: '54735722e16620ba1eee36af',
            'address-line1': '406 Madison Court',
            'zip-code': '49426',
            country: 'USA'
          });

          expect(json[1]).to.have.key('id', 'first-name', 'last-name',
            'address');

          expect(json[1].address).to.be.eql({
            id: '54735697e16624ba1eee36bf',
            'address-line1': '406 Madison Court',
            'zip-code': '49426',
            country: 'USA'
          });

          done(null, json);
        });
      });
    });

    describe('With empty relationship', function () {
      it('should include the relationship as null (one-to)', function (done) {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: { data: null }
            }
          }
        };

        new JSONAPIDeserializer()
          .deserialize(dataSet, function (err, json) {
            expect(json).eql({
              id: '54735750e16638ba1eee59cb',
              'first-name': 'Sandro',
              'last-name': 'Munda',
              'address': null
            });
            done(null, json);
          });
      });

      it('should include the relationship as empty array (to-many)', function (done) {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              addresses: { data: [] }
            }
          }
        };

        new JSONAPIDeserializer()
          .deserialize(dataSet, function (err, json) {
            expect(json).eql({
              id: '54735750e16638ba1eee59cb',
              'first-name': 'Sandro',
              'last-name': 'Munda',
              'addresses': []
            });
            done(null, json);
          });
      });
    });

    describe('With null included nested relationship', function () {
      it('should ignore the nested relationship', function (done) {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: {
                  id: '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
                  type: 'address'
                }
              }
            }
          },
          included:
            [
              {
                id: '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
                type: 'address',
                attributes: {
                  'state': 'Alabama',
                  'zip-code': '35801'
                },
                relationships: {
                  telephone: {
                    data: null
                  }
                }
              }
            ]
        };

        new JSONAPIDeserializer()
          .deserialize(dataSet, function (err, json) {
            expect(json).eql({
              id: '54735750e16638ba1eee59cb',
              'first-name': 'Sandro',
              'last-name': 'Munda',
              'address': {
                'id': '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
                'state': 'Alabama',
                'zip-code': '35801',
                'telephone': null
              }
            });
            done(null, json);
          });
      });
    });

    describe('Without data.attributes, resource identifier', function() {
      it('should deserialize an object without data.attributes', function(done) {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb'
          }
        };

        new JSONAPIDeserializer()
          .deserialize(dataSet, function (err, json) {
            expect(json).eql({
              id: '54735750e16638ba1eee59cb'
            });
            done(null, json);
          });
      });
    });

    describe('without ID', function () {
      it('ID should not be returned', function (done) {
        var dataSet = {
          data: {
            type: 'users',
            attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
          }
        };

        new JSONAPIDeserializer()
        .deserialize(dataSet, function (err, json) {
          expect(json).to.be.eql({
            'first-name': 'Sandro',
            'last-name': 'Munda'
          });

          done(null, json);
        });
      });
    });
  });

  describe('without callback', function () {
    it('should return promise', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: { 'first-name': 'Lawrence', 'last-name': 'Bennett' }
        }]
      };

      new JSONAPIDeserializer()
          .deserialize(dataSet).then(function (json) {
            expect(json).to.be.an('array').with.length(2);
            expect(json[0]).to.be.eql({
              id: '54735750e16638ba1eee59cb',
              'first-name': 'Sandro',
              'last-name': 'Munda'
            });
            expect(json[1]).to.be.eql({
              id: '5490143e69e49d0c8f9fc6bc',
              'first-name': 'Lawrence',
              'last-name': 'Bennett'
            });

            done(null, json);
          });
    });
  });
});
