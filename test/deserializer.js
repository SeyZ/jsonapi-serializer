'use strict';
/* global describe, it */

var expect = require('chai').expect;
var _ = require('lodash');

var JsonApiDeSerializer = require('../lib/deserializer');

function Order(attrs) {
  this.orderType = attrs.orderType;
  this.productionState = attrs.productionState;
  this.paymentState = attrs.paymentState;
  this.shipmentState = attrs.shipmentState;
  this.createdAt = attrs.createdAt;
  this.shipDate = attrs.shipDate;
  this.createdAt = attrs.createdAt;
  this.shipDate = attrs.shipDate;
  this.products = attrs.products;
  this.season = attrs.season;
}

describe('JSON API DeSerializer', function () {
  it('should return Object', function () {
    var dataSet = {
      data: {
        attributes: {
          'order-type': 'subscription',
          'production-state': 0,
          'payment-state': 0,
          'shipment-state': 0,
          season: 'FA15'
        },
        relationships: {},
        type: 'orders'
      }
    };
    var order = new JsonApiDeSerializer(Order, dataSet);
    expect(order).to.not.have.property('id');
    expect(order).to.have.property('orderType', 'subscription');
    expect(order).to.have.property('productionState', 0);
    expect(order).to.have.property('paymentState', 0);
    expect(order).to.have.property('shipmentState', 0);
    expect(order).to.have.property('season', 'FA15');
  });

  it('should return Object with many relationships', function () {
    var dataSet = {
      data: {
        id: 'uuid-id',
        attributes: {
          'order-type': 'subscription',
          'production-state': 0,
          'payment-state': 0,
          'shipment-state': 0,
          'created-at': null,
          'ship-date': null,
          season: 'FA15'
        },
        relationships: {
          plan: {
            data: {
              type: 'plans',
              id: 'uuid-string'
            }
          }
        },
        type: 'orders'
      }
    };
    var order = new JsonApiDeSerializer(Order, dataSet);
    expect(order).to.have.property('id', 'uuid-id');
    expect(order).to.have.property('orderType', 'subscription');
    expect(order).to.have.property('productionState', 0);
    expect(order).to.have.property('paymentState', 0);
    expect(order).to.have.property('shipmentState', 0);
    expect(order).to.have.property('season', 'FA15');
    expect(order).to.have.property('plan');
    expect(order.plan).to.deep.equal({
      id: 'uuid-string'
    });
  });

  it('should return Object with relationships as an Array', function () {
    var dataSet = {
      data: {
        id: 'uuid-id',
        attributes: {
          'order-type': 'subscription',
          'production-state': 0,
          'payment-state': 0,
          'shipment-state': 0,
          'created-at': null,
          'ship-date': null,
          season: 'FA15'
        },
        relationships: {
          plan: {
            data: {
              type: 'plans',
              id: 'uuid-string'
            }
          },
          products: {
            data: [{
              type: 'products',
              id: 'uuid-string1'
            }, {
              type: 'products',
              id: 'uuid-string2'
            }, {
              type: 'products',
              id: 'uuid-string3'
            }]
          }
        },
        type: 'orders'
      }
    };
    var order = new JsonApiDeSerializer(Order, dataSet);
    expect(order).to.have.property('id', 'uuid-id');
    expect(order).to.have.property('orderType', 'subscription');
    expect(order).to.have.property('productionState', 0);
    expect(order).to.have.property('paymentState', 0);
    expect(order).to.have.property('shipmentState', 0);
    expect(order).to.have.property('season', 'FA15');
    expect(order).to.have.property('plan');
    expect(order.plan).to.deep.equal({
      id: 'uuid-string'
    });
    expect(order).to.have.property('products');
    expect(order.products.length).to.equal(3);
    expect(order.products[0]).to.deep.equal({
      id: 'uuid-string1'
    });
    expect(order.products[1]).to.deep.equal({
      id: 'uuid-string2'
    });
    expect(order.products[2]).to.deep.equal({
      id: 'uuid-string3'
    });
  });

  describe('Plain JS Object {} as collection name', function () {
    it('should return Object with relationships as an Array', function () {
      var dataSet = {
        data: {
          id: 'uuid-id',
          attributes: {
            'order-type': 'subscription',
            'production-state': 0,
            'payment-state': 0,
            'shipment-state': 0,
            'created-at': null,
            'ship-date': null,
            season: 'FA15'
          },
          relationships: {
            plan: {
              data: {
                type: 'plans',
                id: 'uuid-string'
              }
            },
            products: {
              data: [{
                type: 'products',
                id: 'uuid-string1'
              }, {
                type: 'products',
                id: 'uuid-string2'
              }, {
                type: 'products',
                id: 'uuid-string3'
              }]
            }
          },
          type: 'orders'
        }
      };

      var order = new JsonApiDeSerializer({}, dataSet);
      expect(order).to.have.property('id', 'uuid-id');
      expect(order).to.have.property('orderType', 'subscription');
      expect(order).to.have.property('productionState', 0);
      expect(order).to.have.property('paymentState', 0);
      expect(order).to.have.property('shipmentState', 0);
      expect(order).to.have.property('season', 'FA15');
      expect(order).to.have.property('plan');
      expect(order.plan).to.deep.equal({
        id: 'uuid-string'
      });
      expect(order).to.have.property('products');
      expect(order.products.length).to.equal(3);
      expect(order.products[0]).to.deep.equal({
        id: 'uuid-string1'
      });
      expect(order.products[1]).to.deep.equal({
        id: 'uuid-string2'
      });
      expect(order.products[2]).to.deep.equal({
        id: 'uuid-string3'
      });
    });
  });
});
