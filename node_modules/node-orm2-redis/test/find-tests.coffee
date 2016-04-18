db      = require './common/database.coffee'
chai    = require 'chai'
async   = require 'async'
orm     = require 'orm'
crc     = require 'crc'
should  = chai.should()
expect  = chai.expect


describe 'Redis adapter find', ->

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
              tracking_number: "Z001"

            models.Order.create order, (err) ->
              next err

          (next) ->
            order =
              shipping_address: "100 Main Street"
              total: 35.95
              order_date: new Date Date.parse "2014-01-12T04:30:00Z"
              sent_to_fullment: true
              warehouse_code: 1
              tracking_number: "Z002"

            models.Order.create order, (err) ->
              next err

          (next) ->
            order =
              shipping_address: "100 Main St."
              total: 135.95
              order_date: new Date Date.parse "2014-01-15T04:30:00Z"
              sent_to_fullment: false
              warehouse_code: 2
              tracking_number: "Z003"

            models.Order.create order, (err) ->
              next err

        ], (err) ->
          close()
          done()


  it 'should be able to fetch all records', (done) ->
    db.open (err, models, close) ->
      models.Order.find (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exists
        orders.length.should.equal 3

        close()
        done()

  it 'should be able to fetch one record', (done) ->
    db.open (err, models, close) ->
      models.Order.one (err, order) ->
        expect(err).to.not.exist
        expect(order).to.exist
        expect(order.shipping_address).to.exist

        close()
        done()


  it 'should find total greater than 40', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.gt 40

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        for order in orders
          order.total.should.be.at.least 40

        close()
        done()


  it 'should find total less than 60', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.lt 60

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        for order in orders
          order.total.should.be.below 60

        close()
        done()


  it 'should find total equal to 45.95', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.eq 45.95

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 1
        orders[0].total.should.equal 45.95

        close()
        done()


  it 'should find nothing - one series, one discrete', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.eq 45.95
        sent_to_fullment: false

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 0

        close()
        done()

  it 'should find nothing - both series', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.eq 45.95
        order_date: orm.lte new Date(Date.parse("2013-12-31T00:00:00Z"))

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 0

        close()
        done()


  it 'should find nothing - single series', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.gt 400.00

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 0

        close()
        done()


  it 'should find total equal to 45.95 (without comparator)', (done) ->
    db.open (err, models, close) ->
      filter =
        total: 45.95

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 1
        orders[0].total.should.equal 45.95

        close()
        done()


  it 'should find total less than 45.95', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.lt 45.95

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 1
        orders[0].total.should.equal 35.95

        close()
        done()


  it 'should find total greater than 45.95', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.gt 45.95

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 1
        orders[0].total.should.equal 135.95

        close()
        done()


  it 'should find total less than or equal to 45.95', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.lte 45.95

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        for order in orders
          order.total.should.be.at.most 45.95

        close()
        done()


  it 'should find total greater than or equal to 45.95', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.gte 45.95

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        for order in orders
          order.total.should.be.at.least 45.95

        close()
        done()


  it 'should find by address', (done) ->
    db.open (err, models, close) ->
      filter =
        shipping_address: "100 Main Street"

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 1
        orders[0].shipping_address.should.equal "100 Main Street"

        close()
        done()


  it 'should return an error when attempting to use not-equals (ne)', (done) ->
    db.open (err, models, close) ->
      filter =
        shipping_address: orm.ne "100 Main Street"

      models.Order.find filter, (err, orders) ->
        expect(err).to.exist

        close()
        done()


  it 'should find total greater than or equal to 45.95 before the 15th', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.gte 45.95
        order_date: orm.lt new Date Date.parse "2014-01-15T00:00:00Z"

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 1

        for order in orders
          order.total.should.be.at.least 45.95

        close()
        done()


  it 'should find total greater than or equal to 45.95 after the 15th', (done) ->
    db.open (err, models, close) ->
      filter =
        total: orm.gte 45.95
        order_date: orm.gt new Date Date.parse "2014-01-15T00:00:00Z"

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 1

        for order in orders
          order.total.should.be.at.least 45.95

        close()
        done()


  it 'should be able to find by boolean (false)', (done) ->
    db.open (err, models, close) ->
      filter =
        sent_to_fullment: false

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 1

        orders[0].sent_to_fullment.should.equal false

        close()
        done()


  it 'should be able to find by boolean (true)', (done) ->
    db.open (err, models, close) ->
      filter =
        sent_to_fullment: true

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        for order in orders
          order.sent_to_fullment.should.equal true

        close()
        done()

  it 'should not get confused by two strings with the same crc32', (done) ->
    crc.crc32("slagging").should.equal crc.crc32("Bridget")  #double check this before we get too far
    db.open (err, models, close) ->
      async.series [
        (next) ->
          order =
            shipping_address: "slagging"

          models.Order.create order, (err) ->
            next err

        (next) ->
          order =
            shipping_address: "Bridget"

          models.Order.create order, (err) ->
            next err

        (next) ->
          models.Order.find shipping_address: "Bridget", (err, orders) ->
            expect(err).to.not.exist
            expect(orders).to.exist
            orders.length.should.equal 1
            orders[0].shipping_address.should.equal "Bridget"
            next err

      ], (err) ->
        close()
        done()

  it 'should find orders between date range', (done) ->
    db.open (err, models, close) ->
      filter =
        order_date: orm.between new Date(Date.parse "2014-01-09T04:30:00Z"), new Date(Date.parse "2014-01-13T04:30:00Z")

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        close()
        done()

  it 'should be able to find with an in clause', (done) ->
    db.open (err, models, close) ->
      filter =
        total: [45.95, 35.95]

      models.Order.find filter, (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        close()
        done()

  it 'should be able to limit the results', (done) ->
    db.open (err, models, close) ->

      models.Order.find().limit(2).run (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        close()
        done()

  it 'should be able to limit the results of filtered queries', (done) ->
    db.open (err, models, close) ->

      filter =
        total: orm.gt 0

      models.Order.find(filter).limit(2).run (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        close()
        done()

  it 'should be able to limit the results, even with in-clauses', (done) ->
    db.open (err, models, close) ->

      filter =
        total: [45.95, 35.95, 135.95]

      models.Order.find(filter).limit(2).run (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        close()
        done()

  it 'should be able to use offset & limit the results', (done) ->
    db.open (err, models, close) ->

      models.Order.find().limit(2).run (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        models.Order.find().limit(2).offset(2).run (err, moreOrders) ->
          expect(err).to.not.exist
          expect(moreOrders).to.exist
          moreOrders.length.should.equal 1

          close()
          done()

  it 'should be able to use offset & limit the results of filtered queries', (done) ->
    db.open (err, models, close) ->

      filter =
        total: orm.gt 0

      models.Order.find(filter).limit(2).run (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        models.Order.find(filter).limit(2).offset(2).run (err, moreOrders) ->
          expect(err).to.not.exist
          expect(moreOrders).to.exist
          moreOrders.length.should.equal 1

          close()
          done()

  it 'should be able to use offset & limit the results, even with in-clauses', (done) ->
    db.open (err, models, close) ->

      filter =
        total: [45.95, 35.95, 135.95]

      models.Order.find(filter).limit(2).run (err, orders) ->
        expect(err).to.not.exist
        expect(orders).to.exist
        orders.length.should.equal 2

        models.Order.find(filter).limit(2).offset(2).run (err, moreOrders) ->
          expect(err).to.not.exist
          expect(moreOrders).to.exist
          moreOrders.length.should.equal 1

          close()
          done()


  it 'should no be stupid with large queries', (done) ->
    @timeout 60000

    db.open (err, models, close) ->
      async.times 11000, (n, next) ->
        order =
          shipping_address: "100 Main St."
          total: 45.95
          order_date: new Date Date.parse "2014-01-10T04:30:00Z"
          sent_to_fullment: true
        models.Order.create order, (err) ->
          next err
      , (err) ->
        expect(err).to.not.exist

        models.Order.find total: 45.95, (err, orders) ->
          expect(err).to.exist
          expect(orders).to.not.exist

          close()
          done()


  it 'discrete indexed properties are exempt from the hard limit', (done) ->
    @timeout 60000

    db.open (err, models, close) ->
      async.times 11000, (n, next) ->
        order =
          shipping_address: "100 Main St."
          total: 45.95
          order_date: new Date Date.parse "2014-01-10T04:30:00Z"
          sent_to_fullment: true
          warehouse_code: 1

        models.Order.create order, (err) ->
          next err
      , (err) ->
        expect(err).to.not.exist

        order =
          shipping_address: "100 Main St."
          total: 99.95
          order_date: new Date Date.parse "2014-01-10T04:30:00Z"
          sent_to_fullment: true
          warehouse_code: 1
        models.Order.create order, (err) ->
          expect(err).to.not.exist

          filter =
            total: orm.gt 98
            warehouse_code: 1

          models.Order.find filter, (err, orders) ->
            expect(err).to.not.exist
            orders.length.should.equal 1

            close()
            done()

  it 'should not be able to find models by index ignored properties', (done) ->
    db.open (err, models, close) ->
      expect(err).to.not.exist
      models.Order.one tracking_number: "Z001", (err, order) ->
        expect(err).to.not.exist
        expect(order).to.not.exist

        close()
        done()
