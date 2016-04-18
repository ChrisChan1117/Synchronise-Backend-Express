db      = require './common/database.coffee'
chai    = require 'chai'
async   = require 'async'
orm     = require 'orm'
crc     = require 'crc'
should  = chai.should()
expect  = chai.expect


describe 'Redis adapter updates', ->

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

            models.Order.create order, (err) ->
              next err

          (next) ->
            order =
              shipping_address: "100 Main Street"
              total: 35.95
              order_date: new Date Date.parse "2014-01-12T04:30:00Z"
              sent_to_fullment: true

            models.Order.create order, (err) ->
              next err

          (next) ->
            order =
              shipping_address: "100 Main St."
              total: 135.95
              order_date: new Date Date.parse "2014-01-15T04:30:00Z"
              sent_to_fullment: false

            models.Order.create order, (err) ->
              next err

        ], (err) ->
          close()
          done()


  it 'should update without error', (done) ->
    db.open (err, models, close) ->
      models.Order.one (err, order) ->
        order.total = 99

        order.save (err) ->
          expect(err).to.not.exist

          close()
          done()

  it 'should update primary object record', (done) ->
    db.open (err, models, close) ->
      models.Order.one (err, order) ->
        order.total = 99

        order.save (err) ->
          models.Order.one id: order.id, (err, order) ->
            order.total.should.equal 99

            close()
            done()

  it 'should update indexes too', (done) ->
    db.open (err, models, close) ->
      async.series [
        (next) ->
          models.Order.one (err, order) ->
            order.total = 99

            order.save next

        (next) ->
          models.Order.find total: 99, (err, orders) ->
            expect(err).to.not.exist
            expect(orders).to.exist
            orders.length.should.equal 1

            next err
      ], ->
        close()
        done()


  it 'should remove old index', (done) ->
    db.open (err, models, close) ->
      async.series [
        (next) ->
          models.Order.one total: 45.95, (err, order) ->
            order.total = 99

            order.save next

        (next) ->
          models.Order.find total: 45.95, (err, orders) ->
            expect(err).to.not.exist
            expect(orders).to.exist
            orders.length.should.equal 0

            next err
      ], ->
        close()
        done()


  it 'should remove old index when property goes to null', (done) ->
    db.open (err, models, close) ->
      async.series [
        (next) ->
          models.Order.one total: 45.95, (err, order) ->
            order.total = null

            order.save next

        (next) ->
          models.Order.find total: 45.95, (err, orders) ->
            expect(err).to.not.exist
            expect(orders).to.exist
            orders.length.should.equal 0

            next err
      ], ->
        close()
        done()

  it 'should update discrete propties', (done) ->
    db.open (err, models, close) ->
      async.series [
        (next) ->
          models.Order.one total: 45.95, (err, order) ->
            order.sent_to_fullment = false

            order.save next

        (next) ->
          models.Order.find sent_to_fullment: false, (err, orders) ->
            expect(err).to.not.exist
            expect(orders).to.exist
            orders.length.should.equal 2

            next err

        (next) ->
          models.Order.find sent_to_fullment: true, (err, orders) ->
            expect(err).to.not.exist
            expect(orders).to.exist
            orders.length.should.equal 1

            next err
      ], ->
        close()
        done()
