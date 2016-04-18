var _ = require('underscore');

function gettify(objects){
    var copyObject = objects;

    if(Array.isArray(objects)){
        _.each(copyObject, function(object){
            if(typeof(object) != "undefined"){
                object.get = function(key){
                    return this[key];
                }
            }
        });
    }else{
        if(typeof(copyObject) != "undefined"){
            copyObject.get = function(key){
                return this[key];
            }
        }
    }

    return copyObject;
};

function settify(objects){
    var copyObject = objects;

    if(Array.isArray(objects)){
        _.each(copyObject, function(object){
            if(typeof(object) != "undefined"){
                object.set = function(key){
                    return this[key];
                }
            }
        });
    }else{
        if(typeof(copyObject) != "undefined"){
            copyObject.set = function(key){
                return this[key];
            }
        }
    }

    return copyObject;
};

// Set objectId as the default identifier instead of id
function idiffy(objects){
    var copyObject = objects;

    if(Array.isArray(objects)){
        _.each(copyObject, function(object){
            if(typeof(object) != "undefined"){
                object.id = object.id;
            }
        });
    }else{
        if(typeof(copyObject) != "undefined"){
            copyObject.id = copyObject.id;
        }
    }

    return copyObject;
}

exports.format = function(objects){
    var copyObject = objects;
    
    copyObject = idiffy(
        settify(
            gettify(copyObject)
        )
    );

    return copyObject;
}

exports.isRealValue = function(obj){
    return obj && obj !== "null" && obj!== "undefined";
}
