db      = require './common/database.coffee'
chai    = require 'chai'
async   = require 'async'
orm     = require 'orm'
crc     = require 'crc'
uuid    = require 'node-uuid'
should  = chai.should()
expect  = chai.expect


describe 'Relationships', ->

  beforeEach (done) ->
    self = this
    db.reset ->
      db.open (err, models, close) ->
        self.orderId = uuid.v4()
        async.series [
          (next) ->
            order =
              shipping_address: "100 Main St."
              total: 45.95
              order_date: new Date Date.parse "2014-01-10T04:30:00Z"
              sent_to_fullment: true
              id: self.orderId

            models.Order.create order, (err) ->
              next err

          (next) ->
            item =
              order_id: self.orderId
              quantity: 3
              product_description: "Apples"

            models.LineItem.create item, (err) ->
              next err

          (next) ->
            item =
              order_id: self.orderId
              quantity: 2
              product_description: "Oranges"

            models.LineItem.create item, (err) ->
              next err

          (next) ->
            item =
              order_id: "20506780-f031-4273-8439-307567c4c398"
              quantity: 5
              product_description: "Pears"

            models.LineItem.create item, (err) ->
              next err

        ], (err) ->
          close()
          done()

  it 'should be able to find children items', (done) ->
    self = this
    db.open (err, models, close) ->
      models.Order.one id: self.orderId, (err, order) ->
        expect(err).to.not.exist
        expect(order).to.exists

        order.getItems (err, items) ->
          expect(err).to.not.exist
          expect(items).to.exist
          items.length.should.equal 2

          close()
          done()
