'use strict';
/* global describe, it */

var expect = require('chai').expect;
var _ = require('lodash');

var JSONAPIDeserializer = require('../lib/deserializer');

describe('JSON API Deserializer', function () {
  describe('simple JSONAPI array document', function () {
    it('should returns attributes', function () {
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

      var json = new JSONAPIDeserializer().deserializeSync(dataSet);

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
    });
  });

  describe('simple JSONAPI single document', function () {
    it('should returns attributes', function () {
      var dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }
      };

      var json = new JSONAPIDeserializer().deserializeSync(dataSet);

      expect(json).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        'first-name': 'Sandro',
        'last-name': 'Munda'
      });
    });

    it('should return camelCase attributes', function () {
      var dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }
      };

      var json = new JSONAPIDeserializer({
        keyForAttribute: 'camelCase'
      }).deserializeSync(dataSet);

      expect(json).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda'
      });
    });
  });

  describe('Nested documents', function () {
    it('should returns attributes', function () {
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

      var json = new JSONAPIDeserializer({ keyForAttribute: 'camelCase' })
        .deserializeSync(dataSet);

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
    });
  });

  describe('Compound document', function () {
    it('should merge included relationships to attributes', function () {
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

      var json = new JSONAPIDeserializer().deserializeSync(dataSet);

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
    });

    it('should convert relationship attributes to camelCase', function () {
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

      var json = new JSONAPIDeserializer({keyForAttribute: 'camelCase'})
      .deserializeSync(dataSet);

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

    });

    describe('With multiple levels', function () {
      it('should merge all include relationships to attributes', function () {
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

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

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
      });
    });

    describe('With polymorphic relationships to same records', function () {
      it('should return all data without circular error', function () {
        var imageOne = 'https://avatars2.githubusercontent.com/u/15112077?s=400&u=9860ca2648dd28ec2c726d287980b4f7d615f590&v=4';
        var imageTwo = 'https://www.placewise.com/images/employees/ashley-schauer.jpg';
        var dataSet = {
          data: {
            id: '1',
            type: 'users',
            attributes: {
              'first-name': 'Ashley',
              'last-name': 'Schauer',
              'username': 'AELSchauer'
            },
            relationships: {
              images: {
                data: [
                  { type: 'images', id: '1' },
                  { type: 'images', id: '2' }
                ]
              }
            }
          },
          included: [
            {
              id: '1',
              type: 'tags',
              attributes: { name: 'jpeg' }
            }, {
              id: '2',
              type: 'tags',
              attributes: { name: 'color' }
            }, {
              id: '3',
              type: 'tags',
              attributes: { name: 'profile-pic' }
            }, {
              id: '4',
              type: 'tags',
              attributes: { name: 'black-and-white' }
            }, {
              id: '1',
              type: 'images',
              attributes: {
                url: imageOne
              },
              relationships: {
                tags: {
                  data: [
                    { type: 'tags', id: '1' },
                    { type: 'tags', id: '2' },
                    { type: 'tags', id: '3' }
                  ]
                }
              }
            },
            {
              id: '2',
              type: 'images',
              attributes: {
                url: imageTwo
              },
              relationships: {
                tags: {
                  data: [
                    { type: 'tags', id: '1' },
                    { type: 'tags', id: '3' },
                    { type: 'tags', id: '4' }
                  ]
                }
              }
            }
          ]
        };

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

        expect(json).to.be.an('object');

        expect(json).to.have.key('id', 'first-name', 'last-name',
          'username', 'images');

        expect(json.images).to.be.an('array').with.length(2)

        expect(json.images[0]).to.be.eql({
          url: imageOne,
          id: '1',
          tags: [
            { name: 'jpeg', id: '1' },
            { name: 'color', id: '2' },
            { name: 'profile-pic', id: '3' }
          ]
        });

        expect(json.images[1]).to.be.eql({
          url: imageTwo,
          id: '2',
          tags: [
            { name: 'jpeg', id: '1' },
            { name: 'profile-pic', id: '3' },
            { name: 'black-and-white', id: '4' }
          ]
        });
      });
    });

    describe('With self-referencing relationships', function () {
      it('should return all data without circular error', function () {
        var dataSet = {
          data: {
            id: '1',
            type: 'malls',
            attributes: {
              name: 'Twin Pines Mall'
            },
            relationships: {
              stores: {
                data: [
                  { type: 'stores', id: '1' },
                  { type: 'stores', id: '2' },
                  { type: 'stores', id: '3' }
                ]
              },
              deals: {
                data: [
                  { type: 'deals', id: '1' },
                  { type: 'deals', id: '2' },
                  { type: 'deals', id: '3' }
                ]
              }
            }
          },
          included: [
            {
              id: '1',
              type: 'stores',
              attributes: {
                name: 'Tasty Food'
              },
              relationships: {
                deals: {
                  data: [
                    { type: 'deals', id: '1' },
                    { type: 'deals', id: '2' }
                  ]
                }
              }
            }, {
              id: '2',
              type: 'stores',
              attributes: {
                name: 'Fashionable Clothes' 
              },
              relationships: {
                deals: {
                  data: [
                    { type: 'deals', id: '3' }
                  ]
                }
              }
            }, {
              id: '3',
              type: 'stores',
              attributes: {
                name: 'Readable Books'
              }
            }, {
              id: '1',
              type: 'deals',
              attributes: {
                name: 'Free Drink with Snack Purchase'
              },
              relationships: {
                stores: {
                  data: [
                    { type: 'stores', id: '1' }
                  ]
                }
              }
            }, {
              id: '2',
              type: 'deals',
              attributes: {
                name: "Free Samples of New Delicious Treat"
              },
              relationships: {
                stores: {
                  data: [
                    { type: 'stores', id: '1' }
                  ]
                }
              }
            }, {
              id: '3',
              type: 'deals',
              attributes: {
                name: "Buy One Get One Off Shirts"
              },
              relationships: {
                stores: {
                  data: [
                    { type: 'stores', id: '2' }
                  ]
                }
              }
            }
          ]
        };

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

        expect(json).to.be.an('object');

        expect(json).to.be.be.eql({
          name: 'Twin Pines Mall',
          id: '1',
          stores: [
            {
              name: 'Tasty Food',
              id: '1',
              deals: [
                {
                  name: 'Free Drink with Snack Purchase',
                  id: '1',
                  stores: [
                    { name: 'Tasty Food', id: '1' }
                  ]
                }, {
                  name: 'Free Samples of New Delicious Treat',
                  id: '2',
                  stores: [
                    { name: 'Tasty Food', id: '1' }
                  ]
                }
              ]
            }, {
              name: 'Fashionable Clothes',
              id: '2',
              deals: [
                {
                  name: 'Buy One Get One Off Shirts',
                  id: '3',
                  stores: [
                    { name: 'Fashionable Clothes', id: '2' }
                  ]
                }
              ]
            }, {
              name: 'Readable Books',
              id: '3'
            }
          ],
          deals: [
            {
              name: 'Free Drink with Snack Purchase',
              id: '1',
              stores: [
                {
                  name: 'Tasty Food',
                  id: '1',
                  deals: [
                    { name: 'Free Drink with Snack Purchase', id: '1' },
                    { name: 'Free Samples of New Delicious Treat', id: '2' }
                  ]
                }
              ]
            },
            {
              name: 'Free Samples of New Delicious Treat',
              id: '2',
              stores: [
                {
                  name: 'Tasty Food',
                  id: '1',
                  deals: [
                    { name: 'Free Drink with Snack Purchase', id: '1' },
                    { name: 'Free Samples of New Delicious Treat', id: '2' }
                  ]
                }
              ]
            },
            {
              name: 'Buy One Get One Off Shirts',
              id: '3',
              stores: [
                {
                  name: 'Fashionable Clothes',
                  id: '2',
                  deals: [
                    { name: 'Buy One Get One Off Shirts', id: '3' }
                  ]
                }
              ]
            }
          ]
        });
      });
    });

    describe('With relationships data array', function () {
      it('should merge included relationships to attributes', function () {
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

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

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
      });

      it('should merge included and reused relationships to attributes of shallow resources', function () {
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

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

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
      });

      it('should merge included and reused relationships to attributes of nested resources', function () {
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

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

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

      it('should use the value of valueForRelationship opt', function () {
        var dataSet = _.cloneDeep(baseDataSet);
        var json = new JSONAPIDeserializer({
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
        .deserializeSync(dataSet);

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
      });
      it('should throw an error when passing a promise to valueForRelationship opt', function () {
        var dataSet = _.cloneDeep(baseDataSet);
        var deserializer = new JSONAPIDeserializer({
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
        });

        expect(function () {
          deserializer.deserializeSync(dataSet)
        }).to.throw('Can not pass a promise in valueForRelationship when using deserialzeSync!');
      });
    });

    describe('With empty relationship', function () {
      it('should include the relationship as null (one-to)', function () {
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

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

        expect(json).eql({
          id: '54735750e16638ba1eee59cb',
          'first-name': 'Sandro',
          'last-name': 'Munda',
          'address': null
        });
      });

      it('should include the relationship as empty array (to-many)', function () {
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

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

        expect(json).eql({
          id: '54735750e16638ba1eee59cb',
          'first-name': 'Sandro',
          'last-name': 'Munda',
          'addresses': []
        });
      });
    });

    describe('With null included nested relationship', function () {
      it('should ignore the nested relationship', function () {
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

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

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
      });
    });

    describe('Without data.attributes, resource identifier', function() {
      it('should deserialize an object without data.attributes', function() {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb'
          }
        };

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

        expect(json).eql({
          id: '54735750e16638ba1eee59cb'
        });
      });
    });

    describe('without ID', function () {
      it('ID should not be returned', function () {
        var dataSet = {
          data: {
            type: 'users',
            attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
          }
        };

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

        expect(json).to.be.eql({
          'first-name': 'Sandro',
          'last-name': 'Munda'
        });
      });
    });

    describe('when mixed collection with option to include type as attributes', function () {
      it('should include type as key', function () {
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
              name: 'Shady Location',
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

        var json = new JSONAPIDeserializer({typeAsAttribute: true})
        .deserializeSync(dataSet);

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

      });
    });

    describe('With multiple relations', function () {
      it('should include both relations if they point to same include', function () {
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

        var json = new JSONAPIDeserializer().deserializeSync(dataSet);

        expect(json).to.be.an('object').with.keys('id', 'owner', 'publisher');
        expect(json.owner).to.exist;
        expect(json.publisher).to.exist;
        expect(json.owner).to.be.eql(json.publisher);
      });
    });
  });

  describe('without callback', function () {
    it('should return promise', function () {
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

      var json = new JSONAPIDeserializer().deserializeSync(dataSet);

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
    });
  });

  describe('Circular references', function () {
    it('should not create an infinite loop', function () {
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

      var json = new JSONAPIDeserializer({keyForAttribute: 'snake_case'})
          .deserializeSync(dataSet);

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
    });
  });

  describe('transform', function () {
    it('should transform record before deserialization', function () {
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

      var json = new JSONAPIDeserializer({
          transform: function (record) {
            record['full-name'] = record['first-name'] + ' ' + record['last-name'];
            delete record['first-name'];
            delete record['last-name'];
            return record;
          }
        })
        .deserializeSync(dataSet);

      expect(json).to.be.an('array').with.length(2);
      expect(json[0]).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        'full-name': 'Sandro Munda'
      });
      expect(json[1]).to.be.eql({
        id: '5490143e69e49d0c8f9fc6bc',
        'full-name': 'Lawrence Bennett'
      });
    });
  });

  describe('meta', function () {
    it('should be included', function () {
      var dataSet = {
        data: {
          type: 'users',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' },
          meta: {
            some: 'attribute'
          }
        }
      };

      var json = new JSONAPIDeserializer().deserializeSync(dataSet);

      expect(json).to.be.eql({
        'first-name': 'Sandro',
        'last-name': 'Munda',
        'meta': {
          'some': 'attribute'
        }
      });
    });

     it('should be in camelCase', function () {
       var dataSet = {
         data: {
           type: 'users',
           attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' },
           meta: {
             'some-attr': 'value'
           }
         }
       };

       var json = new JSONAPIDeserializer({
         keyForAttribute: 'camelCase'
       }).deserializeSync(dataSet);

       expect(json).to.be.eql({
         'firstName': 'Sandro',
         'lastName': 'Munda',
         'meta': {
           'someAttr': 'value'
         }
       });
     });
  });

  describe('links', function () {
    it('should be included', function () {
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

      var json = new JSONAPIDeserializer().deserializeSync(dataSet);

      expect(json).to.have.key('first-name', 'last-name', 'links');
      expect(json.links).to.be.eql({
        self: '/articles/1/relationships/tags',
        related: '/articles/1/tags'
      });
    });
  });

  describe('id', function () {
    it('should override the id field', function () {
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

      var json = new JSONAPIDeserializer({
        id: '_id'
      }).deserializeSync(dataSet);

      expect(json[0]).to.not.have.keys('id');
      expect(json[1]).to.not.have.keys('id');
      expect(json[0]._id).equal('54735750e16638ba1eee59cb');
      expect(json[1]._id).equal('5490143e69e49d0c8f9fc6bc');

    });
  });
});
