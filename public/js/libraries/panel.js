function Panel(objectDOM) {
	this.DOMnode = objectDOM;
	this.idBlock = this.DOMnode.attr('data-idBlock');
	this.topPosition = this.DOMnode.offset().top;
}

$.fn.redraw = function() { $(this).each(function() { var redraw = this.offsetHeight; }); return $(this); };

Panel.prototype.blockId = function(id) {
    if(typeof(id) == "undefined"){
        return this.idBlock;
    }else{
        this.idBlock = id;
    }
};

Panel.prototype.minHeight = function (minHeight) {
    if(typeof(minHeight) == "undefined"){
        return this.DOMnode.css('minHeight');
    }else{
        this.DOMnode.css('minHeight', minHeight);
		this.DOMnode.redraw();
    }
};

Panel.prototype.maxHeight = function (maxHeight) {
    if(typeof(maxHeight) == "undefined"){
        return this.DOMnode.css('maxHeight');
    }else{
        this.DOMnode.css('maxHeight', maxHeight);
		this.DOMnode.redraw();
    }
};

Panel.prototype.opacity = function (opacity) {
    if(typeof(opacity) == "undefined"){
        return this.DOMnode.css('opacity');
    }else{
        this.DOMnode.css('opacity', opacity);
    }
};

Panel.prototype.height = function (height) {
    if(typeof(height) == "undefined"){
        return this.DOMnode.height();
    }else{
        this.DOMnode.css('height', height);
		this.DOMnode.redraw();
    }
};

Panel.prototype.fadeIn = function () {
	this.DOMnode.hide().fadeIn();
	return this;
};

Panel.prototype.fadeIn3D = function () {
	this.DOMnode.addClass('fadeInBigBackground');
	return this;
};

Panel.prototype.fadeOut3D = function () {
	this.DOMnode.addClass('fadeOutBigBackground');
	return this;
};

Panel.prototype.fadeIn3DCancel = function () {
	this.DOMnode.removeClass('fadeInBigBackground');
	return this;
};

Panel.prototype.fadeOut3DCancel = function () {
	this.DOMnode.removeClass('fadeOutBigBackground');
	return this;
};
