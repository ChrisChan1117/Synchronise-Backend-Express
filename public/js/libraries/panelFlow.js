Array.prototype.clear = function() {
  while (this.length > 0) {
    this.pop();
  }
};

function PanelFlow(idPanelFlow, classPanels) {
	this.idPanelFlow = idPanelFlow;
	this.classPanels = classPanels;
	this.DOMnode = $('#'+idPanelFlow);
	this.currentPanelNumberValue = 0;
	this.panels = Array();
	this.arrowKeysActivated = true;
    this.firstLoaded = false;
}

PanelFlow.prototype.init = function(){
    var object = this;

	// Disable scorlling of the page
	var body = $("html, body");
		body.animate({scrollTop:0}, '0', 'swing', function() {
		});

	// Clear the list of Panels in case of reset
	this.panels.clear();

	// Fetch all the blocks
	$('.'+this.classPanels).each(function(){
		object.panels.push(new Panel($(this)));
	});

    object.initBlockSize();

	this.initArrows();
	this.initDots();
	this.updateNavigationInterface();

    function debouncer( func , timeout ) {
        var timeoutID , timeout = timeout || 200;
        return function () {
            var scope = this , args = arguments;
            clearTimeout( timeoutID );
            timeoutID = setTimeout( function () {
                func.apply( scope , Array.prototype.slice.call( args ) );
            } , timeout );
        }
    }

    $(window).resize( debouncer( function ( e ) {
        object.initBlockSize();
        object.refreshScrollPosition(object.currentPanelNumber());
    }));

    return this;
};

PanelFlow.prototype.initBlockSize = function(){
    var object = this;

    // Set the Heights of all the panels to the same Heights of the PanelFlow
    for(var i = 0; i < object.panels.length; i++){
        var currentPanel = object.panels[i];
        currentPanel.minHeight(object.minHeight());
        currentPanel.maxHeight(object.maxHeight());
    }
};

PanelFlow.prototype.initArrows = function(){
	if($("#arrowsNavigation").length){
		var object = this;

	    $(document).on('click', '#arrowUp', function(){
	    	if(object.currentPanelNumber() > 0){
	            object.scrollToBlock(object.currentPanelNumber()-1);
	        }

	    });

	    $(document).on('click', '#arrowDown', function(){
	        if(object.currentPanelNumber()+1 < object.panels.length){
	            object.scrollToBlock(object.currentPanelNumber()+1);
	        }
	    });
	}
};

PanelFlow.prototype.initDots = function(){
	if($('#dotNavigation').length){
		var object = this;

	    for(var i = 0; i < this.panels.length; i++){
            if(!$("#dotNavigation .dots").length){
                $("#dotNavigation").append("<span class='subtitles'></span><br/><span class='dots'></span>");
            }
	        $('#dotNavigation .dots').append('<span class="dotNavigation"><i class="fa"></i></span>');
            $('#dotNavigation .subtitles').append('<span class="dotSubtitle"></span>');
	    }

	    $(document).on('click', '#dotNavigation .dotNavigation i', function(){
	        object.scrollToBlock($('#dotNavigation .dotNavigation i').index(this));
	    });
	}
};

PanelFlow.prototype.setDotSubtitle = function(id, subtitle){
    $("#dotNavigation .dotSubtitle:nth-child(" + id + ")").html(subtitle);
};

PanelFlow.prototype.minHeight = function (minHeight) {
    if(typeof(minHeight) == "undefined"){
        return this.DOMnode.css('minHeight');
    }else{
        this.DOMnode.css('minHeight', minHeight);
    }
};

PanelFlow.prototype.maxHeight = function (maxHeight) {
	if(typeof(maxHeight) == "undefined"){
        return this.DOMnode.css('maxHeight');
    }else{
        this.DOMnode.css('maxHeight', maxHeight);
    }
};

PanelFlow.prototype.opacity = function (opacity) {
	if(typeof(opacity) == "undefined"){
        return this.DOMnode.css('opacity');
    }else{
        this.DOMnode.css('opacity', opacity);
    }
};

PanelFlow.prototype.currentPanel = function(){
	return this.panels[this.currentPanelNumber()];
}

PanelFlow.prototype.currentPanelNumber = function(numberBlock){
	if(typeof(numberBlock) == "undefined"){
        return this.currentPanelNumberValue;
    }else{
        this.currentPanelNumberValue = numberBlock;
    }
}

PanelFlow.prototype.scrollToBlock = function(numberBlock){
	var object = this;

	if(typeof(numberBlock) != "number"){
		for(var i = 0; i < object.panels.length; i++){
			if(object.panels[i].idBlock == numberBlock){
				numberBlock = i;
				break;
			}
		}
	}

	if(object.currentPanelNumber() != numberBlock || !object.firstLoaded){
        object.firstLoaded = true;
        object.refreshScrollPosition(numberBlock);

		for(var i = 0; i < object.panels.length; i++){
			if(i!=numberBlock){
				object.panels[i].fadeOut3D();
			}
		}

		window.setTimeout(function(){
			if(typeof(object.currentPanel()) != "undefined" && object.firstLoaded){
				object.DOMnode.trigger('panelDidDisappear', [object.currentPanel()]);
			}

			object.currentPanelNumber(numberBlock);
			object.updateNavigationInterface();

			object.DOMnode.trigger('panelWillAppear', [object.currentPanel()]);

			object.panels[numberBlock].fadeIn3D();
			for(var i = 0; i < object.panels.length; i++){
				if(i!=numberBlock){
					object.panels[i].fadeOut3DCancel().fadeIn3DCancel();
				}
			}

			window.setTimeout(function(){
				object.DOMnode.trigger('panelDidAppear', [object.currentPanel()]);
			}, 500);
		}, 200);
		object.currentPanelNumber(i);
	}
}

PanelFlow.prototype.refreshScrollPosition = function(numberBlock){
    var object = this;

    var positionTop = 0;
    for(var i = 0; i < numberBlock; i++){
        positionTop+= object.panels[i].height();
    }

    if(typeof(this.currentPanel()) != "undefined"){
        this.DOMnode.trigger('panelWillDisappear', [this.currentPanel()]);
    }

    this.DOMnode.animate({scrollTop:positionTop, queue: false}, '200', 'swing', function() { });
}
PanelFlow.prototype.updateNavigationInterface = function(){
	if($("#arrowsNavigation").length){
		this.updateArrows();
	}

	if($('#dotNavigation').length){
    	this.updateDots();
    }
};

PanelFlow.prototype.updateArrows = function(){
	$('#arrowUp').removeAttr('disabled');
    $('#arrowDown').removeAttr('disabled');

    if(this.currentPanelNumber() == 0){
        $('#arrowUp').attr('disabled', 'disabled');
    }

    if(this.currentPanelNumber()+1 == this.panels.length){
        $('#arrowDown').attr('disabled', 'disabled');
    }
};

PanelFlow.prototype.updateDots = function(){
	$('#dotNavigation .dotNavigation i').removeClass('fa-circle');
    $('#dotNavigation .dotNavigation i').addClass('fa-circle-o');
    $('#dotNavigation .dotNavigation i:eq(' + this.currentPanelNumber() + ')').addClass('fa-circle');
};

PanelFlow.prototype.arrowKeysActivation = function(newValue){
	if(typeof(newValue) != "undefined"){
		this.arrowKeysActivated = newValue;
	}else{
		return this.arrowKeysActivated;
	}
}
