db      = require './common/database.coffee'
chai    = require 'chai'
async   = require 'async'
orm     = require 'orm'
crc     = require 'crc'
should  = chai.should()
expect  = chai.expect


describe 'Redis adapter deletes', ->

  beforeEach (done) ->
    db.reset ->
      db.open (err, models, close) ->
        async.series [
          (next) ->
            order =
              shipping_address: "100 Main St."
              total: 45.95
              order_date: new Date Date.parse "2014-01-10T04:30:00Z"
              sent_to_fullment: true
              warehouse_code: 1

            models.Order.create order, (err) ->
              next err

          (next) ->
            order =
              shipping_address: "100 Main Street"
              total: 35.95
              order_date: new Date Date.parse "2014-01-12T04:30:00Z"
              sent_to_fullment: true
              warehouse_code: 1

            models.Order.create order, (err) ->
              next err

          (next) ->
            order =
              shipping_address: "100 Main St."
              total: 135.95
              order_date: new Date Date.parse "2014-01-15T04:30:00Z"
              sent_to_fullment: false
              warehouse_code: 2

            models.Order.create order, (err) ->
              next err

        ], (err) ->
          close()
          done()


  it 'should delete one order', (done) ->
    db.open (err, models, close) ->
      models.Order.one (err, order) ->
        order.remove (err) ->
          expect(err).to.not.exist

          models.Order.count (err, count) ->
            expect(err).to.not.exist
            count.should.equal 2

            close()
            done()


  it 'should not be able to find deleted records', (done) ->
    db.open (err, models, close) ->
      models.Order.one shipping_address: "100 Main Street", (err, order) ->
        expect(err).to.not.exist
        expect(order).to.exist

        order.remove (err) ->
          expect(err).to.not.exist

          models.Order.one shipping_address: "100 Main Street", (err, order) ->
            expect(err).to.not.exist
            expect(order).to.not.exist

            close()
            done()


  it 'should not be able to find deleted records, even with special indexing rules', (done) ->
    db.open (err, models, close) ->
      models.Order.one shipping_address: "100 Main Street", (err, order) ->
        expect(err).to.not.exist
        expect(order).to.exist

        order.remove (err) ->
          expect(err).to.not.exist

          models.Order.find warehouse_code: 1, (err, orders) ->
            expect(err).to.not.exist
            orders.length.should.equal 1

            close()
            done()
