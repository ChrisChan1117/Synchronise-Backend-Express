dependenciesLoader(["$"], function(){
    var tempPassword = false;

    var getTempPassword = function(reason, callback, force){
        modalMessage.callback = callback;

        if(tempPassword && typeof(force) == "undefined"){
            modalMessage.callback(tempPassword);
        }else{
            askedForPassword = true;

            modalMessage.show('<div class="col-lg-3 col-sm-1 col-xs-1"></div><div class="row-fluid col-lg-6 col-sm-10 col-xs-10" align="center">Please enter your password<br/><small>(' + reason + ')</small><br/><input type="password" class="form-control" id="getTempPassword"></div><div class="col-lg-3 col-sm-1 col-xs-1"></div>');

            window.setTimeout(function(){
                $('#getTempPassword').focus();
            }, 500);

            $('#getTempPassword').focusout(function(){
                $('#getTempPassword').focus();
            });
        }

        KeyEventController.subscribeComponent("modalMessage", function(event){
            if(event == 13) {
                var value = $('#getTempPassword').val();
                if(value.length){
                    $('#getTempPassword').blur();
                    modalMessage.hide();
                    tempPassword = value;
                    askedForPassword = false;
                    modalMessage.callback(tempPassword);
                    KeyEventController.unsubscribeComponent("modalMessage");
                }
            }else if(event == 27){
                // If the password for decryption has started
                if(askedForPassword){
                    modalMessage.hide();
                    askedForPassword = false;
                    modalMessage.callback(false);
                    KeyEventController.unsubscribeComponent("modalMessage");
                }
            }
        });
    }

    var getPublicKey = function(reason, callback){
        getTempPassword(reason, function(password){
            if(password){
                var decryptedPublicKey = CryptoJS.AES.decrypt(JSON.parse($('#public_key').text()), password.toString("base64"), { format: JsonFormatter });
                var decryptedPublicKey_str = CryptoJS.enc.Utf8.stringify(decryptedPublicKey);
                callback(decryptedPublicKey_str);
            }else{
                callback(false);
            }
        });
    }

    modalMessage.getTempPassword = getTempPassword;
    modalMessage.getPublicKey = getPublicKey;
});
