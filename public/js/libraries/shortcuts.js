(function(){
	dependenciesLoader(["$", "Mousetrap"], function(){
		function load(){
			$(document).ready(function(){
			    // MENU
			    // Dashboard
			    Mousetrap.bind('alt+d', function(e) {
			        e.preventDefault();
			        document.location.href="/dashboard";
			    });

	            // Help
	            Mousetrap.bind('alt+e', function(e) {
	                e.preventDefault();
	                document.location.href="/help";
	            });

				// Project
	            Mousetrap.bind('alt+p', function(e) {
	                e.preventDefault();
	                document.location.href="/project";
	            });

				// Components
	            Mousetrap.bind('alt+o', function(e) {
	                e.preventDefault();
	                document.location.href="/component";
	            });

				// Displays all the tooltip on the website (Example : the sortcut tooltip on the navbar menu)
			    $('[data-toggle="tooltip"]').tooltip();
			});
		}

		// This object controls the way the keyboard events are triggered. It will manage and trigger events only on the current components
		KeyEventController = {
			components : Array(),
			callbacks : Array(),
			// Subscribe a component to the KeyEventController
			// If the component is already in the list, it will move it foreground
			subscribeComponent : function(component, callback){
				if(!typeof(component) == "string"){
					console.log("The component you give to subscribe must be a string and not the actual component");
				}else{
					if(this.components.indexOf(component) == -1){ // Not already in the list
						this.components.push(component);
						this.callbacks.push(callback);
					}else{
						this.components.splice(this.components.indexOf(component), 1);
						this.callbacks.splice(this.components.indexOf(component), 1);

						this.components.push(component);
						this.callbacks.push(callback);
					}
				}
			},
			unsubscribeComponent : function(component_or_index){ // Unsubscribe a component to the KeyEventController
				if(!isNaN(component_or_index)){
					if((this.components.length-1)>=component_or_index){
						this.components.splice(component_or_index, 1);
						this.callbacks.splice(component_or_index, 1);
					}
				}else if(typeof(component_or_index) == "string"){
					var index = this.components.indexOf(component_or_index);
					if(index != -1){
						this.components.splice(this.components.indexOf(component_or_index), 1);
						this.callbacks.splice(this.components.indexOf(component_or_index), 1);
					}
				}else{
					console.log("The component you give to unsubscribe must be a string and not the actual component");
				}
			},
			isForeground : function(component){ // If the element currently has the focus true, otherwise false
				if(typeof(component) == "string"){
					return (this.components.indexOf(component) == this.components.length-1);
				}else{
					console.log("The component you provide must be a string and not the actual component");
				}
			}
		};

		$("html, body, document").keyup(function(event) {
			event.stopPropagation();
			var code = event.keyCode || event.which;

			if(KeyEventController.components.length){
				KeyEventController.callbacks[KeyEventController.components.length-1](code);
			}
		});
	});
}());
