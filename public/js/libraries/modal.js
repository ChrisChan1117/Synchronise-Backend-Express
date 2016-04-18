var ModalIsHidding = false; // Determines whether the modal is currently hiding

function Modal(selectorModal){
    var target = this;

    if(typeof(selectorModal) == 'undefined'){
        this.modalNode = 'globalModal';
    }else{
        this.modalNode = selectorModal;
    }

    this.title = function(titleSent){
        if(typeof(titleSent) == 'undefined'){
            return this.titleValue;
        }else{
            this.titleValue = titleSent;
            $('#'+this.modalNode+' .modal-title').html(this.titleValue);
            return this;
        }
    };

    this.titleValue = '';

    this.content = function(contentSent){
        if(typeof(contentSent) == 'undefined'){
            return this.contentValue;
        }else{
            this.contentValue = contentSent;
            $('#'+this.modalNode+' .modal-body').html(this.contentValue);
            return this;
        }
    };

    this.contentValue = '';

    this.footer = function(footerSent, withCloseButton){
        if(typeof(footerSent) == 'undefined'){
            return this.footerValue;
        }else{
            this.footerValue = footerSent;
            $('#'+this.modalNode+' .modal-footer').html(this.footerValue);
            if(withCloseButton){
                $('#'+this.modalNode+' .modal-footer').append('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
            }
            return this;
        }
    };

    this.footerValue = '';

    this.show = function(){
        var interval = window.setInterval(function(){
            if(!ModalIsHidding){
                window.clearInterval(interval);

                $('#'+target.modalNode).modal('show');
                $('#'+target.modalNode).focus();

                if(typeof(KeyEventController) != "undefined"){
                    KeyEventController.subscribeComponent("modal", function(key){
                        if(key == 27){
                            target.hide();
                        }
                    });
                }
            }
        }, 1);

        return this;
    };

    this.hide = function(){
        $('#'+this.modalNode).modal('hide');
        KeyEventController.unsubscribeComponent("modal");
        return this;
    };

    $('#'+this.modalNode).on('hide.bs.modal', function (e) {
        ModalIsHidding = true;
        KeyEventController.unsubscribeComponent("modal");
        for(var i = 0; i < callbacksWillDisappear.length; i++){
            callbacksWillDisappear[i]();
        }
    });

    $('#'+this.modalNode).on('hidden.bs.modal', function (e) {
        ModalIsHidding = false;
        KeyEventController.unsubscribeComponent("modal");
        for(var i = 0; i < callbacksDidDisappear.length; i++){
            callbacksDidDisappear[i]();
        }
    });

    $('#'+this.modalNode).on('show.bs.modal', function (e) {
        KeyEventController.unsubscribeComponent("modal");
        for(var i = 0; i < callbacksWillAppear.length; i++){
            callbacksWillAppear[i]();
        }
    });

    $('#'+this.modalNode).on('shown.bs.modal', function (e) {
        KeyEventController.unsubscribeComponent("modal");
        for(var i = 0; i < callbacksDidAppear.length; i++){
            callbacksDidAppear[i]();
        }
    });

    this.toggle = function(){
        $('#'+this.modalNode).modal('toggle');
        return this;
    };

    this.shake = function(){
        $('#'+this.modalNode+' .modal-dialog').effect("shake");
        return this;
    };

    var callbacksWillDisappear = [];
    this.willDisappear = function(callback){
        callbacksWillDisappear.push(callback);
    };

    var callbacksDidDisappear = [];
    this.didDisappear = function(callback){
        callbacksDidDisappear.push(callback);
    };

    var callbacksWillAppear = [];
    this.willAppear = function(callback){
        callbacksWillAppear.push(callback);
    };

    var callbacksDidAppear = [];
    this.didAppear = function(callback){
        callbacksDidAppear.push(callback);
    };
}

function ModalErrorParse(error, callback){
    var modal = new Modal();
    var timeStamp = new Date().getTime();
    var message = "";

    if(typeof(error) == "string"){
        message = error;
    }else{
        message = error.message;
    }

    modal.footer('<button type="button" class="btn btn-default pull-left" id="modalCancel' +  timeStamp + '">Close</button>', false);
    modal.content(message);
    modal.show();

    $(document).on('click', '#modalCancel'+timeStamp, function(){
        modal.hide();
        if(typeof(callback) != "undefined"){
            callback(false);
        }
    });

    return modal;
}

function ModalConfirm(message, callback){
    var modal = new Modal();
    var timeStamp = new Date().getTime();

    modal.content(message);
    modal.footer('<button type="button" class="btn btn-default pull-left" id="modalCancel' +  timeStamp + '">Cancel</button><button type="button" class="btn btn-primary pull-right" id="modalConfirm' +  timeStamp + '">Confirm</button>', false);
    modal.show();

    $(document).on('click', '#modalCancel'+timeStamp, function(){
        modal.hide();
        if(typeof(callback) != "undefined"){
            callback(false);
        }
    });

    $(document).on('click', '#modalConfirm'+timeStamp, function(){
        modal.hide();
        if(typeof(callback) != "undefined"){
            callback(true);
        }
    });

    return modal;
}

// Ask the user for some inputs
// - (string)message: Explains why we ask for an input
// - (function)callback : The callback to trigger when the user confirm or close the modal
function ModalAskInput(message, callback, placeholder, selectorModal){
    var modal = new Modal(selectorModal||'globalModal');
    var timeStamp = new Date().getTime();
    var placeholderValue = (placeholder || "");

    modal.content(message + "<br/>" + "<input type='text' class='form-control col-lg-12 col-md-12 col-sm-12 col-xs-12' placeholder='" + placeholderValue + "'><br/>");
    modal.footer('<button type="button" class="btn btn-default pull-left" id="modalCancel' +  timeStamp + '">Cancel</button><button type="button" class="btn btn-primary pull-right" id="modalConfirm' +  timeStamp + '">Confirm</button>', false);
    modal.show();

    modal.didAppear(function(){
        $('#' + modal.modalNode + ' input').focus();
    });

    modal.didDisappear(function(){
        if(typeof(callback) != "undefined"){
            callback(false);
        }
    });

    $('#' + modal.modalNode + ' input').keypress(function(e) {
        if(e.which == 13) {
            modal.hide();
            if(typeof(callback) != "undefined"){
                callback($('#' + modal.modalNode + ' input').val());
            }
        }
    });

    $(document).on('click', '#modalCancel'+timeStamp, function(){
        modal.hide();
        if(typeof(callback) != "undefined"){
            callback(false);
        }
    });

    $(document).on('click', '#modalConfirm'+timeStamp, function(){
        modal.hide();
        if(typeof(callback) != "undefined"){
            callback($('#' + modal.modalNode + ' input').val());
        }
    });

    return modal;
}
