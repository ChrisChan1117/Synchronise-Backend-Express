# mailgun-send [![Code Climate](https://codeclimate.com/github/markhuge/node-mailgun-send.png)](https://codeclimate.com/github/markhuge/node-mailgun-send) ![Dependency Status](https://gemnasium.com/markhuge/node-mailgun-send.svg)

Send mail via mailgun

# install

With [npm](https://npmjs.org) do:

```
npm install mailgun-send
```
# usage

``` Javascript
var mail = require('mailgun-send');

mail.config({
  key: '<mailgun api key>',
  sender: 'noreply@myapp.com'
});

mail.send({
  subject: 'hello from myapp!',
  recipient: 'user@email.com',
  body: 'This is an email from myapp'
});
```


## mail.config()

properties:

- key - Mailgun API key (required)
- sender - optional default sender
- recipient - optional default recipient
- subject - optional default subject
- body - optional default body
- batchRecipients - Send 1 email to all recipients instead of individual to each recipient (default `true`)

Defaults (except the API key) can be overriden on every send.


## mail.send()

Send the msg.


# practical example

Implement a password reset scheme...

``` Javascript

// Password reset feature
app.post('/forgotPassword', function (req,res) {
  key = getTempPasswordResetKey();

  var msg = {
    subject: 'Password reset confirmation',
    recipient: req.body.email
    body: 'Click <a href="http://myapp.com/resetpassword?key=' + key + '">here</a> to reset your password'
  };

  mail.send(msg);

});

```

# license

MIT
