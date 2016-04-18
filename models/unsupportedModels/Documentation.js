var path            = require('path');
var redis           = require('node-orm2-redis');
var marked          = require('markit');
    marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: true,
        tables: true,
        breaks: true,
        pedantic: true,
        sanitize: true,
        smartLists: true,
        smartypants: true,
        highlight: function(code, lang, callback){
            require('pygmentize-bundled')({ lang: lang, format: 'html' }, code, function (err, result) {
                if (err) throw err;
                callback(err, result.toString());
            });
        }
    });

var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('documentation', {
        name            : { type: "text"    , defaultValue: ""},
        content         : { type: "text"    , defaultValue: ""},
        subsections     : { type: "text"    , defaultValue: '{"data":[]}'},
        order           : { type: "integer" , defaultValue: 0}, // The position of the section relative to its current level and parent
        parent          : { type: "text"    , defaultValue: ""}, // The parent of the section. If Top level this is equal to an empty string
        level           : { type: "integer" , defaultValue: 0}, // The level of the section 0 -> Top level, 1 level one...
        backgroundColor : { type: "text"    , defaultValue: "#3E4EB8"},
        color           : { type: "text"    , defaultValue: "#FEFEFF"},
        activeColor     : { type: "text"    , defaultValue: "#FFD900"},
        published       : { type: "boolean" , defaultValue: false},
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            name : redis.index.discrete
        }
    });

    global.Documentation = db.models.documentation;

    // Creates a new Documentation section
    Documentation.createSection = function(name, level, parent, order){
        return new Promise(function(resolve, reject) {
            Documentation.create({name: name, level: level, parent: parent, order: order}, function(err, section){
                if(err){ reject(err); }else{
                    if(parent !== ""){
                        Documentation.sectionById(parent).then(function(parentSection){
                            parentSection.subsections.push({
                                id: section.id,
                                name: section.name,
                                level: section.level,
                                order: section.order
                            });

                            Documentation.setSubsectionsForSection(parentSection.id, parentSection.subsections).then(function(){
                                resolve(section);
                            });
                        });
                    }else{
                        resolve(section);
                    }
                }
            });
        });
    };

    // Removes a section using its parent id and id
    Documentation.removeSection = function(parent, id_section){
        return new Promise(function(resolve, reject) {
            var promises = [];

            promises.push(new Promise(function(resolve1, reject1) {
                Documentation.sectionById(parent).then(function(parentSection){
                    if(parentSection){
                        var subsections = _.filter(parentSection.subsections, function(row){
                            return row.id != id_section;
                        });

                        Documentation.updateSection({subections: subsections}, parentSection.id).then(function(){
                            resolve1();
                        }, function(){
                            reject1();
                        });
                    }else{
                        resolve1();
                    }
                }, function(){
                    resolve1();
                });
            }));

            promises.push(new Promise(function(resolve1, reject1) {
                Documentation.one({parent:parent, id: id_section}, function(err, section){
                    section.remove(function(err){
                        resolve1();
                    });
                });
            }));

            Promise.all(promises).then(function(){
                resolve();
            }, function(){
                reject();
            });
        });
    };

    Documentation.removeSectionById = function(id_section){
        return new Promise(function(resolve, reject) {
            Documentation.one({id: id_section}, function(err, object){
                if(err){
                    reject(err);
                }else{
                    if(object){
                        object.remove(function(){
                            resolve();
                        });
                    }else{
                        reject("Trying to remove a section that does not exists");
                    }
                }
            });
        });
    };

    // Update the properties of a section
    Documentation.updateSection = function(params, id_section){
        return new Promise(function(resolve, reject) {
            Documentation.sectionById(id_section).then(function(section){
                _.each(Object.keys(params), function(key){
                    section[key] = params[key];
                });

                section.subsections = JSON.stringify({data: section.subsections});

                section.save(function(err, newSection){
                    if(err){ reject(err); }else{ resolve(newSection); }
                });
            }, reject);
        });
    };

    // Returns all of the sections with level and parent ordered
    // If recursive is true, the function will call itself until all subsections have been found
    Documentation.sectionsWithLevelWithParent = function(level, parent, returnContent, onlyPublished, markup){
        return new Promise(function(resolveGlobal, rejectGlobal) {
            // Fetch each sections of the documentation
            Documentation.find({level: level, parent: parent}, function(err, results){
                if(err){ reject(err); }else{
                    var promises = [];
                    var sectionsFound = [];

                    for (var i = 0; i < results.length; i++) {
                        promises.push(fetchSection(results[i], level, parent, returnContent, onlyPublished, markup).then(function(section){
                            sectionsFound.push(section);
                        }));
                    }

                    Promise.all(promises).then(function(){
                        _.sortBy(sectionsFound, function(row){ // Order the results by section
                            return row.order;
                        });

                        resolveGlobal(sectionsFound);
                    }, function(err){
                        rejectGlobal(err);
                    });
                }
            });

            // Clean up the mess as well
            Documentation.find({}, function(err, objects){
                for (var i = 0; i < objects.length; i++) {
                    var row = objects[i];
                    if(row.parent){
                        Documentation.sectionById(row.parent, false).then(function(parent){
                        }, function(){
                            // Parent no longer exists, we need to remove the section
                            Documentation.removeSectionById(row.id);
                        });
                    }
                }
            });

            function fetchSection(curSection, level, parent, returnContent, onlyPublished, markup){
                var shouldPush;
                var toPush = {
                    parent          : parent,
                    level           : level,
                    name            : curSection.name,
                    order           : curSection.order,
                    id              : curSection.id,
                    backgroundColor : curSection.backgroundColor,
                    color           : curSection.color,
                    activeColor     : curSection.activeColor
                };

                return new Promise(function(resolve2, reject2) {
                    if(onlyPublished){
                        if(curSection.published){
                            shouldPush = true;
                        }
                    }else{
                        shouldPush = true;
                    }

                    if(returnContent){
                        toPush.content = curSection.content.replace('<p>', '').replace('</p>', '');
                        if(markup){
                            marked(toPush.content.trim(), function(err, result){
                                toPush.content = result;
                                resolve2();
                            });
                        }else{
                            resolve2();
                        }
                    }else{
                        resolve2();
                    }
                }).then(function(){
                    return new Promise(function(resolve3, reject3) {
                        if(shouldPush){
                            Documentation.sectionsWithLevelWithParent(level+1, curSection.id, returnContent, onlyPublished, markup).then(function(sections){
                                var sectionsStillExisting = [];
                                var promisesLocal = [];

                                _.each(sections, function(row){
                                    promisesLocal.push(new Promise(function(resolveLocal, rejectLocal) {
                                        // Verify that the section still exists
                                        var passed = false;
                                        Documentation.sectionById(row.id, false).then(function(){
                                            sectionsStillExisting.push(row);
                                            passed = true;
                                        }, function(){
                                            resolveLocal();
                                        }).then(function(){
                                            if(!passed){
                                                var clearedSubsections = _.filter(curSection.subsections, function(currentSubsectionFilter){
                                                    return (currentSubsectionFilter.id != row.id);
                                                });

                                                Documentation.updateSection({subsections: clearedSubsections}, curSection.id).then(function(){
                                                    resolveLocal(); // Section no longer exists
                                                }, function(){
                                                    resolveLocal();
                                                });
                                            }else{
                                                resolveLocal();
                                            }
                                        });
                                    }));
                                });

                                Promise.all(promisesLocal).then(function(){
                                    toPush.sections = _.sortBy(sectionsStillExisting, function(row){ // Order the results by section
                                        return row.order;
                                    });
                                    resolve3(toPush);
                                });
                            }, function(err){
                                reject(err);
                            });
                        }else{
                            resolve3(toPush);
                        }
                    });
                });
            }
        });
    };

    // Returns a section object with it ID
    Documentation.sectionById = function(section_id, fetchSubsection){
        var shouldFetchSubsection = (fetchSubsection || true);

        return new Promise(function(resolve, reject) {
            Documentation.one({id: section_id}, function(err, data){
                if(err){ reject(err); }else{
                    if(data !== null){
                        if(data.subsections !== null && shouldFetchSubsection){ // If there is subsection
                            if(typeof(data.subsections) != "undefined"){
                                if(data.subsections.length > 0){
                                    var promises = [];
                                    var clearedForSending = [];
                                    data.subsections = JSON.parse(data.subsections).data;

                                    // Get all subsections data
                                    for (var i = 0; i < data.subsections.length; i++) {
                                        var row = data.subsections[i];
                                        promises.push(new Promise(function(resolve1, reject1) {
                                            Documentation.sectionById(row.id).then(function(){
                                                clearedForSending.push(row);
                                                resolve1();
                                            }, function(){
                                                resolve1();
                                            });
                                        }));
                                    }

                                    Promise.all(promises).then(function(){
                                        data.subsections = clearedForSending;
                                        resolve(data);
                                    });
                                }
                            }
                        }else{
                            resolve(data);
                        }
                    }else{
                        reject("Undefined subsection");
                    }
                }
            });
        });
    };

    // Return an array of the subections of a section
    // Example :
    // [{id: "id_of_the_section", name: "Name of the section", level: 1, order: 1}]
    Documentation.getSubsectionsForSection = function(section_id){
        return new Promise(function(resolve, reject) {
            Documentation.sectionById(section_id).then(function(data){
                var subsections = [];
                if(data.subsections !== null){
                    if(typeof(data.subsections) != "undefined"){
                        if(data.subsections.length > 0){
                            subsections = JSON.parse(subsections).data;
                        }
                    }
                }

                resolve(subsections);
            }, function(){
                reject();
            });
        });
    };

    // Save the subsections of a section
    // Example :
    // [{id: "id_of_the_section", name: "Name of the section", level: 1, order: 1}]
    Documentation.setSubsectionsForSection = function(section_id, array_sections){
        return new Promise(function(resolve, reject) {
            Documentation.sectionById(section_id).then(function(section){
                var subsections = {data: []};

                if(array_sections !== null){
                    if(typeof(array_sections) != "undefined"){
                        if(array_sections.length > 0){
                            subsections = JSON.stringify({data: array_sections});
                            section.subsections = subsections;
                        }
                    }
                }

                section.save(function(err, newSection){
                    if(err){ reject(err); }else{ resolve(newSection); }
                });
            }, function(){
                reject();
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
