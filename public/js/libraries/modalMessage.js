var modalMessage = {};
(function(){
	dependenciesLoader(["$"], function(){
		$('body').append('<div id="modalMessageBackgroundMask" style="position: fixed; width: 100%; height: 100%; background-color: rgba(0,0,0, 0.8); z-index: 999; top: 0; left:0; display: none"></div>');
		$('#modalMessageBackgroundMask').append('<div id="modalMessageMessage" style="width: 100%; height: 100; color: white; font-size: 40px; text-align: center; margin-top: 25%; display: none;"></div>');
		modalMessage.callback = null;

		modalMessage.show = function(text){
			KeyEventController.subscribeComponent("modalMessage", function(key){
				if(key == 27){
					modalMessage.hide();
				}
			});

			$('#modalMessageBackgroundMask').addClass('fadeInBackground');
		    $('#modalMessageMessage').html(text);
		    $('#modalMessageMessage').css('marginTop', $('#modalMessageBackgroundMask').height()/2 - $('#modalMessageMessage').height()/2 - $('.navbar').height());
		    window.setTimeout(function(){
			    $('#modalMessageMessage').addClass('scaleIn');
		    }, 300);
		};

		modalMessage.showMask = function(){
			KeyEventController.subscribeComponent("modalMessage", function(key){
				if(key == 27){
					modalMessage.hide();
				}
			});

			$('#modalMessageBackgroundMask').addClass('fadeInBackground');
		    $('#modalMessageMessage').attr('class', '');
		};

		modalMessage.hide = function(){
			$('#modalMessageBackgroundMask').addClass('fadeOutBackground');
		    window.setTimeout(function(){
		    	$('#modalMessageBackgroundMask').attr('class', '');
		    }, 500);

			KeyEventController.unsubscribeComponent("modalMessage");
		};
	});
}());
