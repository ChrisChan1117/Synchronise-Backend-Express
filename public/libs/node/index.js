var _       = require('underscore');
var request = require('request');

/**
 * Initialises the library
 *
 * @param  {String}api_key
 */
var API_URL = "https://api.synchronise.io";

var Synchronise = function(api_key){
    var target = this;

    this.public_key = api_key;

    return {
        /**
         * Set the API KEY for the current environment. All the future calls to Synchronise will be made using the given key
         *
         * @param  {String}api_key
         * @return {undefined}
         */
        init: function(api_key){
            if(!api_key.length){
                throw new Error('You must provide a PUBLIC KEY. You can find your PUBLIC KEY by going to synchronise.io/public-key');
            }else{
                target.public_key = api_key;
            }
        },
        /**
         * Utility functions to communicate with the "Component" API of Synchronise
         *
         * @return {Object}
         */
        Component: {
            /**
             * Run a component on Synchronise and returns the answers
             *
             * @param  {String}idComponent
             * @param  {Object}params
             * @param  {Object}response
             * @return {Object}
             */
            run: function(idComponent, params, response){
                request({
                    "rejectUnauthorized": false,
                    url: API_URL+"/component/run",
                    method: "post",
                    body: _.extend({
                        id: idComponent
                    }, params),
                    headers: {
                        "x-synchronise-public-key": target.public_key
                    },
                    json: true
                }, function(err, res, body){
                    if(res.statusCode == 200){
                        if(typeof(res) != "undefined"){
                            if(typeof(response.success) != "undefined"){
                                response.success(body);
                            }
                        }
                    }else if(res.statusCode == 500){
                        if(typeof(res) != "undefined"){
                            if(typeof(response.error) != "undefined"){
                                if(typeof(body) == "string"){
                                    response.error(JSON.parse(body));
                                }else{
                                    response.error(body);
                                }
                            }
                        }
                    }

                    if(typeof(response) != "undefined"){
                        if(typeof(response.always) != "undefined"){
                            response.always();
                        }
                    }
                });
            }
        },
        /**
         * Utility functions to communicate with the "Workflow" API of Synchronise
         *
         * @return {Object}
         */
        Workflow: {
            /**
             * Run a workflow on Synchronise and returns the answers
             *
             * @param  {String}idWorkflow
             * @param  {Object}params
             * @param  {Object}response
             * @return {Object}
             */
            run: function(idWorkflow, params, response){
                request({
                    "rejectUnauthorized": false,
                    url: API_URL+"/workflow/run",
                    method: "post",
                    body: _.extend({
                        id: idWorkflow
                    }, params),
                    headers: {
                        "x-synchronise-public-key": target.public_key
                    },
                    json: true
                }, function(err, res, body){
                    if(res.statusCode == 200){
                        if(typeof(res) != "undefined"){
                            if(typeof(response.success) != "undefined"){
                                response.success(body);
                            }
                        }
                    }else if(res.statusCode == 500){
                        if(typeof(res) != "undefined"){
                            if(typeof(response.error) != "undefined"){
                                if(typeof(body) == "string"){
                                    response.error(JSON.parse(body));
                                }else{
                                    response.error(body);
                                }
                            }
                        }
                    }

                    if(typeof(response) != "undefined"){
                        if(typeof(response.always) != "undefined"){
                            response.always();
                        }
                    }
                });
            }
        }
    };
};
module.exports = Synchronise;
