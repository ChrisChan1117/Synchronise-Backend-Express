db      = require './common/database.coffee'
chai    = require 'chai'
should  = chai.should()
expect  = chai.expect


describe 'Redis adapter basics', ->

  beforeEach (done) ->
    db.reset ->
      done()

  it 'should open a connection without errors', (done) ->
    db.open (err, models, close) ->
      expect(err).to.not.exist

      close()
      done()


  it 'should save model', (done) ->
    db.open (err, models, close) ->
      order =
        shipping_address: "100 Main St."
        total: 45.95
        order_date: new Date()
        sent_to_fullment: false

      models.Order.create order, (err, order) ->
        expect(err).to.not.exist
        expect(order.id).to.exist

        close()
        done()

  it 'should save a model with missing data', (done) ->
    db.open (err, models, close) ->
      order =
        shipping_address: "100 Main St."

      models.Order.create order, (err, order) ->
        expect(err).to.not.exist
        expect(order.id).to.exist

        close()
        done()


  it 'should save model with a special index request', (done) ->
    db.open (err, models, close) ->
      order =
        shipping_address: "100 Main St."
        total: 45.95
        order_date: new Date()
        sent_to_fullment: false
        warehouse_code: 4

      models.Order.create order, (err, order) ->
        expect(err).to.not.exist
        expect(order.id).to.exist

        close()
        done()

  it 'should save a model with missing data, and come back ok', (done) ->
    db.open (err, models, close) ->
      order =
        shipping_address: "100 Main St."

      models.Order.create order, (err, order) ->
        expect(err).to.not.exist
        expect(order.id).to.exist

        models.Order.one id: order.id, (err, order) ->
          expect(err).to.not.exist
          expect(order).to.exist
          expect(order.total).to.not.exist
          expect(order.order_date).to.not.exist

          close()
          done()


  it 'should handle custom data types', (done) ->
    db.open (err, models, close) ->
      order =
        status_code: "LB"

      models.Order.create order, (err, order) ->
        expect(err).to.not.exist
        expect(order.id).to.exist

        models.Order.one id: order.id, (err, order) ->
          expect(err).to.not.exist
          expect(order).to.exist
          order.status_code.should.equal "lb"

          close()
          done()
