var urlH = new function() {
	this.insertParam = function(paramName, paramValue){
		var url = window.location.href;
	    var hash = location.hash;
	    url = url.replace(hash, '');
	    if (url.indexOf(paramName + "=") >= 0)
	    {
	        var prefix = url.substring(0, url.indexOf(paramName));
	        var suffix = url.substring(url.indexOf(paramName));
	        suffix = suffix.substring(suffix.indexOf("=") + 1);
	        suffix = (suffix.indexOf("&") >= 0) ? suffix.substring(suffix.indexOf("&")) : "";
	        url = prefix + paramName + "=" + paramValue + suffix;
	    }
	    else
	    {
	    if (url.indexOf("?") < 0)
	        url += "?" + paramName + "=" + paramValue;
	    else
	        url += "&" + paramName + "=" + paramValue;
	    }

	    window.history.replaceState(paramName, paramValue, url);
	};

    this.getParam = function(sParam){
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
		var hasReturned = false;

        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
				hasReturned = true;
                return sParameterName[1];
            }
        }
		if(!hasReturned){
			return false;
		}
    };

	this.currentUrl = function(){
		return window.location.href.toString().split(window.location.host)[1];
	};
};
