'use strict';
/* global describe, it */

var expect = require('chai').expect;
var _ = require('lodash');

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

      it('should merge included and reused relationships to attributes of shallow resources', function (done) {
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
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f99bd62',
            attributes: {
              'first-name': 'Mary',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
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
            expect(json).to.be.an('array').with.length(3);

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

            expect(json[2]).to.have.key('id', 'first-name', 'last-name',
              'address');

            expect(json[2].address).to.be.eql({
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA',
              id: '54735722e16620ba1eee36af',
              locks: [
                { 'secret-key': 'S*7v0oMf7YxCtFyA$ffy', id: '1' },
                { 'secret-key': 'En8zd6ZT6#q&Fz^EwGMy', id: '2' }
              ]
            });

            done(null, json);
          });
      });

      it('should merge included and reused relationships to attributes of nested resources', function (done) {
        var dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              addresses: {
                data: [
                  { type: 'addresses', id: '54735722e16620ba1eee36af' },
                  { type: 'addresses', id: '54735697e16624ba1eee36bf' },
                  { type: 'addresses', id: '54735697e16624ba1eee36cf' }
                ]
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
              lock: {
                data: { type: 'lock', id: '1' }
              }
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
            type: 'addresses',
            id: '54735697e16624ba1eee36cf',
            attributes: {
              'address-line1': '123 Sth Street',
              'zip-code': '12332',
              country: 'USA'
            },
            relationships: {
              lock: {
                data: { type: 'lock', id: '1' }
              }
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
            expect(json).to.be.an('array').with.length(1);

            expect(json[0]).to.have.key('id', 'first-name', 'last-name',
              'addresses');

            expect(json[0].addresses[0]).to.be.eql({
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA',
              id: '54735722e16620ba1eee36af',
              lock: { 'secret-key': 'S*7v0oMf7YxCtFyA$ffy', id: '1' }
            });

            expect(json[0].addresses[1]).to.be.eql({
              'address-line1': '361 Shady Lane',
              'zip-code': '23185',
              country: 'USA',
              id: '54735697e16624ba1eee36bf',
              lock: { 'secret-key': 'En8zd6ZT6#q&Fz^EwGMy', id: '2' }
            });

            expect(json[0].addresses[2].lock).to.be.eql({
              'secret-key': 'S*7v0oMf7YxCtFyA$ffy', id: '1'
            });

            done(null, json);
          });
      });
    });

    describe('Without included', function () {
      var baseDataSet = {
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

      it('should use the value of valueForRelationship opt', function (done) {
        var dataSet = _.cloneDeep(baseDataSet);
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
      it('should use the value of a return promise from valueForRelationship opt', function (done) {
        var dataSet = _.cloneDeep(baseDataSet);
        new JSONAPIDeserializer({
          addresses: {
            valueForRelationship: function (relationship) {
              return new Promise(function(resolve) {
                setTimeout(function() {
                  resolve({
                    id: relationship.id,
                  });
                }, 10);
              })
            }
          }
        })
        .deserialize(dataSet, function (err, json) {
          expect(json).to.be.an('array').with.length(2);

          expect(json[0]).to.have.key('id', 'first-name', 'last-name',
            'address');

          expect(json[0].address).to.be.eql({
            id: '54735722e16620ba1eee36af',
          });

          expect(json[1]).to.have.key('id', 'first-name', 'last-name',
            'address');

          expect(json[1].address).to.be.eql({
            id: '54735697e16624ba1eee36bf',
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

    describe('when mixed collection with option to include type as attributes', function () {
      it('should include type as key', function (done) {
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
            type: 'locations',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              'name': 'Shady Location',
              'address-line1': '361 Shady Lane',
              'zip-code': '23185',
              country: 'USA'
            },
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA'
            }
          }]
        };

        new JSONAPIDeserializer({typeAsAttribute: true})
        .deserialize(dataSet, function (err, json) {
          expect(json).to.be.an('array').with.length(2);

          expect(json[0]).to.have.key('id', 'first-name', 'last-name',
            'address', 'type');

          expect(json[0].address).to.be.eql({
            id: '54735722e16620ba1eee36af',
            'address-line1': '406 Madison Court',
            'zip-code': '49426',
            country: 'USA',
            type: 'addresses'
          });

          expect(json[1]).to.have.key('id', 'name',
            'address-line1', 'zip-code', 'country', 'type');
          expect(json[1]).to.be.eql({
            name: 'Shady Location',
            'address-line1': '361 Shady Lane',
            'zip-code': '23185',
            country: 'USA',
            id: '5490143e69e49d0c8f9fc6bc',
            type: 'locations'
          });

          done(null, json);
        });

      });
    });

    describe('With multiple relations', function () {
      it('should include both relations if they point to same include', function (done) {
        var dataSet = {
          data: {
            type: 'posts',
            id: 1,
            relationships: {
              owner: {
                data: {
                  type: 'users',
                  id: 1,
                },
              },
              publisher: {
                data: {
                  type: 'users',
                  id: 1,
                },
              },
            },
          },
          included: [
            {
              type: 'users',
              id: 1,
              attributes: {
                'first-name': 'Sandro',
                'last-name': 'Munda',
              },
            },
          ],
        };

        new JSONAPIDeserializer().deserialize(dataSet).then(function(json) {
          expect(json).to.be.an('object').with.keys('id', 'owner', 'publisher');
          expect(json.owner).to.exist;
          expect(json.publisher).to.exist;
          expect(json.owner).to.be.eql(json.publisher);

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

  describe('Circular references', function () {
    it('should not create an infinite loop', function (done) {
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
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            'address-line1': '406 Madison Court',
            'zip-code': '49426'
          },
          relationships: {
            country: {
              data: { type: 'countries', id: '54735722e16609ba1eee36af' }
            }
          }
        }, {
          type: 'countries',
          id: '54735722e16609ba1eee36af',
          attributes: {
            country: 'USA'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }]
      };

      new JSONAPIDeserializer({keyForAttribute: 'snake_case'})
          .deserialize(dataSet).then(function (json) {
            expect(json).to.be.an('array').with.length(1);
            expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address');
            expect(json[0].address).to.be.eql({
              address_line1: '406 Madison Court',
              zip_code: '49426',
              id: '54735722e16620ba1eee36af',
              country: {
                country: 'USA',
                id: '54735722e16609ba1eee36af',
                address: {
                  address_line1: '406 Madison Court',
                  zip_code: '49426',
                  id: '54735722e16620ba1eee36af',
                }
              }
            });
            done(null, json);
          });
    });
  });

  describe('transform', function () {
    it('should transform record before deserialization', function (done) {
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

      new JSONAPIDeserializer({
          transform: function (record) {
            record['full-name'] = record['first-name'] + ' ' + record['last-name'];
            delete record['first-name'];
            delete record['last-name'];
            return record;
          }
        })
        .deserialize(dataSet, function (err, json) {
          expect(json).to.be.an('array').with.length(2);
          expect(json[0]).to.be.eql({
            id: '54735750e16638ba1eee59cb',
            'full-name': 'Sandro Munda'
          });
          expect(json[1]).to.be.eql({
            id: '5490143e69e49d0c8f9fc6bc',
            'full-name': 'Lawrence Bennett'
          });

          done(null, json);
        });
    });
  });

  describe('meta', function () {
    it('should be included', function (done) {
      var dataSet = {
        data: {
          type: 'users',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' },
          meta: {
            some: 'attribute'
          }
        }
      };

      new JSONAPIDeserializer()
      .deserialize(dataSet, function (err, json) {
        expect(json).to.be.eql({
          'first-name': 'Sandro',
          'last-name': 'Munda',
          'meta': {
            'some': 'attribute'
          }
        });

        done(null, json);
      });
    });

     it('should be in camelCase', function (done) {
       var dataSet = {
         data: {
           type: 'users',
           attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' },
           meta: {
             'some-attr': 'value'
           }
         }
       };

       new JSONAPIDeserializer({
         keyForAttribute: 'camelCase'
       })
       .deserialize(dataSet, function (err, json) {
         expect(json).to.be.eql({
           'firstName': 'Sandro',
           'lastName': 'Munda',
           'meta': {
             'someAttr': 'value'
           }
         });

         done(null, json);
       });
     });
  });

  describe('links', function () {
    it('should be included', function (done) {
      var dataSet = {
        data: {
          type: 'users',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' },
        },
        links: {
          self: '/articles/1/relationships/tags',
          related: '/articles/1/tags'
        }
      };

      new JSONAPIDeserializer()
      .deserialize(dataSet, function (err, json) {
        expect(json).to.have.key('first-name', 'last-name', 'links');
        expect(json.links).to.be.eql({
          self: '/articles/1/relationships/tags',
          related: '/articles/1/tags'
        });

        done(null, json);
      });
    });
  });

  describe('id', function () {
    it('should override the id field', function (done) {
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

      new JSONAPIDeserializer({
        id: '_id'
      }).deserialize(dataSet, function (err, json) {
        expect(json[0]).to.not.have.keys('id');
        expect(json[1]).to.not.have.keys('id');
        expect(json[0]._id).equal('54735750e16638ba1eee59cb');
        expect(json[1]._id).equal('5490143e69e49d0c8f9fc6bc');
        done(null, json);
      });

    });
  });
});
