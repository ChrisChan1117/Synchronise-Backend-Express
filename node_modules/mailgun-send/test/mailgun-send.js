var mail   = require('../index.js'),
    expect = require('chai').expect,
    sinon  = require('sinon');

// Mocks
sinon.stub(mail,'_connect');
sinon.stub(mail,'send');


describe("mailgun-send", function () {

  it('Throw exception for missing API key', function () {
    expect(mail.config.bind({})).to.throw('Missing Mailgun API key');
  });
  
  
  it('Configure', function () {
    mail.config({ key: '1234', sender: 'noreply@test.com' });
    expect(mail._connect).to.have.been.calledOnce;  
  });
  
  it('Send', function () {

    var callback = sinon.spy();
    mail.config({key: "1234"});
    mail.send({
      sender: "test@email.com",
      body: "this is the body",
      subject: "this is a subject",
      recipient: "test@example.com"
    }, callback);
    
  });

});