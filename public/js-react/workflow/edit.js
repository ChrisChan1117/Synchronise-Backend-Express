dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "TimeAgo", "ComponentCatalog", "Component", "Components", "urlH", "WorkflowInput", "WorkflowOutput", "SettingsTab", "Export", "ExportTab"], function(){
    Array.prototype.move = function (old_index, new_index) {
        if (new_index >= this.length) {
            var k = new_index - this.length;
            while ((k--) + 1) {
                this.push(undefined);
            }
        }
        this.splice(new_index, 0, this.splice(old_index, 1)[0]);
        return this;
    };

    var Workflow = React.createClass({
        getInitialState: function(){
            return {
                components: [], // Contain the ordered list of components in the workflow (not their data)
                componentsData: {}, // Contain the data of each component
                name: "",
                identifer: "",
                inputs: [],
                outputs: [],
                loading: false,
                saving: false,
                forking: false,
                helpActivated: true,
                execution_status: 0,
                executionCurrentProgress: 0,
                start_execution: new Date(),
                end_execution: new Date(),
                error: {},
                success: {},
                lastUpdateSent: new Date().getTime(),
                isFirstLoad: true,
                inputsStatus: {},
                inputsValues: {}
            };
        },
        componentDidMount: function(){
            var target = this;
                target.setState({loading: true});

            Synchronise.Cloud.run("getWorkflow", {id: urlH.getParam("id"), realtime: true}, {
                success: function(data){
                    document.title = data.name;

                    var componentsData = target.state.componentsData;
                    var promises = [];
                    var alreadyLoading = []; // List of IDS of components already loading

                    for(var i = 0; i < data.components.length; i++){
                        var currComponent = data.components[i];
                        if(alreadyLoading.indexOf(currComponent.id_component) == -1){
                            alreadyLoading.push(currComponent.id_component);
                            promises.push(new Promise(function(resolve, reject) {
                                var answered = false;
                                Synchronise.Cloud.run("loadComponent", {id: currComponent.id_component, style: true, realtime: {ignore:["style", "code"]}, code: false}, {
                                    success: function(comp){
                                        if(!answered){
                                            if(comp.component){
                                                componentsData[comp.component.id] = _.extend(comp.component, {logo:comp.style.icon});
                                            }else{
                                                componentsData[currComponent.id_component] = false;
                                            }

                                            if(comp){
                                                var copyComponentsData = target.state.componentsData;
                                                    copyComponentsData[comp.component.id] = _.extend(comp.component, {logo:comp.style.icon});

                                                target.setState({
                                                    componentsData: copyComponentsData
                                                });
                                            }

                                            if(typeof(resolve) != "undefined"){
                                                resolve();
                                            }

                                            answered = true;
                                        }
                                    },
                                    error: function(){
                                        reject();
                                    }
                                });
                            }));
                        }
                    }

                    Promise.all(promises).then(function(){
                        if(target.state.lastUpdateSent >= data.timestampRequest || target.state.isFirstLoad || !data.timestampRequest){
                            target.setState({
                                components: _.sortBy(data.components, function(row){
                                    return row.order;
                                }),
                                name: data.name,
                                identifier: data.id,
                                inputs: data.inputs,
                                outputs: data.outputs,
                                loading: false,
                                isFirstLoad: false
                            });
                        }
                        //target.initSortable();
                        target.resizeInterface();
                    });
                },
                error: function(err){
                    new ModalErrorParse(err);
                },
                always: function(){
                    target.setState({forking: false});
                }
            });

            $(window).resize(function(){
                target.resizeInterface();
            });

            $('.rightSide').resize(function(){
                target.resizeInterface();
            });

            $('.inputContainer').resize(function(){
                target.resizeInterface();
            });

            if(urlH.getParam('tab')){
                $('#tabs a[href=#' + urlH.getParam('tab') + ']').tab('show');
            }

            $('#tabs a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                urlH.insertParam('tab', $(e.target).attr('href').replace('#', ''));
                target.resizeInterface();
            });

            $(ReactDOM.findDOMNode(this)).tooltip({ selector: '[data-toggle=tooltip]' });

            Synchronise.LocalStorage.get("helpIsActivatedForWorkflow", function(status){
                target.setState({helpActivated: status});

                if(status){
                    $('[data-toggle="tooltip"]').each(function(){
                        $(this).tooltip('enable');
                    });
                }else{
                    $('[data-toggle="tooltip"]').each(function(){
                        $(this).tooltip('disable');
                    });
                }
            }, false, true, true);
        },
        changeName: function(event){
            var target = this;
            target.setState({name: event.target.value});
            Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data: {name: event.target.value}}, {});
        },
        initSortable: function(){
            var target = this;

            var sortableStartPosition;

            var sortable = $(ReactDOM.findDOMNode(target)).find("#workflowTab .flow #listOfComponentsInFlow");
                sortable.sortable({
                    items: "li",
                    tolerance: 'pointer',
                    axis: 'y',
                    placeholder: "ui-state-highlight",
                    handle: ".header",
                    helper: function(e, f) {
                        var helper = $("<div class='cloneWhileSorting'></div>");
                            helper.css({
                                'width': $(f).css('width'),
                                'height': '50px',
                                'textAlign': "center",
                                opacity: 0,
                                borderRadius: "5px",
                                backgroundColor: $(f).find('.header').css('background-color')
                            });
                            helper.animate({
                                opacity: 0.9
                            });

                        var img = $(f).find('img').clone();
                            img.css({
                                width: "40px",
                                height: "40px",
                                marginTop: "5px",
                                marginLeft: "5px",
                                float: "left"
                            });
                        helper.append(img);

                        var title = $(f).find('.title').clone();
                            title.css({
                                position: "absolute",
                                border: "0px",
                                top: "5px"
                            });
                        helper.append(title);

                        return helper;
                    },
                    start: function(event, ui) {
                        $(ui.item).show();
                        sortableStartPosition = ui.item.index();
                        target.resizeInterface();
                    },
                    update: function(e, ui){
                        var oldPos = ui.item.sortable.index;
                        var newPos = ui.item.sortable.dropindex;
                        console.log(ui);
                        console.log("Old " + oldPos + " newPos " + newPos);
                    },
                    stop: function(event, ui){
                        var components = target.state.components.slice();

                        _.each(components, function(row){
                            console.log(row.id_component.substring(0, 3));
                        });
                        console.log("______");

                        console.log("From " + parseInt(sortableStartPosition) + " to" + parseInt(ui.item.index()));
                        components.move(sortableStartPosition, ui.item.index());

                        _.each(components, function(row){
                            console.log(row.id_component.substring(0, 3));
                        });
                        console.log("______");

                        _.each(components, function(comp, index){
                            comp.order = index;
                        });

                        var timestamp = new Date();
                        target.setState({components: components, saving: true, lastUpdateSent:timestampRequest});

                        Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data: {components: components}, timestampRequest: timestamp.getTime()}, {
                            always: function(){
                                target.setState({saving: false});
                            }
                        });

                        target.resizeInterface();
                    }
                });
                sortable.disableSelection();
        },
        resizeInterface: function(){
            var target = this;
            $('#timeline').css({ height: $(".flow").height() });

            var marginTop = 0;
            if($(window).width()>1200){
                if(target.state.components.length){
                    marginTop = "7px";
                }else{
                    marginTop = "35px";
                }

                $('.flow').css({
                    paddingTop: $('#inputContainer').height(),
                    marginTop: marginTop
                });
            }else{
                if(target.state.components.length){
                    marginTop = 0;
                }else{
                    marginTop = "35px";
                }

                $('.flow').css({
                    paddingTop: marginTop,
                    marginTop: 0
                });
            }
        },
        highlightCatalog: function(){
            $('.componentCatalog').effect("highlight", 1000);
        },
        // Makes all the calculation to select the right component
        // if the user is the owner we just return the component
        // if the user is not the owner we fork the component or get ID of the already cloned version
        getRequiredIdForComponent: function(id_component, callback){
            var target = this;

            this.getComponentFromCacheOrDatabase(id_component, function(component){
                var shouldFork = false;
                if(component.user_id != Synchronise.User.current().id){
                    if(!component.is_forked){
                        shouldFork = true;
                    }
                }

                if(!shouldFork){
                    callback(component.id);
                }else{
                    target.setState({forking: true});

                    Synchronise.Cloud.run("cloneComponent", {id: component.id}, {
                        success: function(data){
                            callback(data.id);
                        },
                        error: function(err){
                            new ModalErrorParse(err);
                        },
                        always: function(){
                            target.setState({forking: false});
                        }
                    });
                }
            });
        },
        getComponentFromCacheOrDatabase: function(id_component, callback){
            // The component is not in the cache yet
            var componentsData = this.state.componentsData;

            if(!componentsData.hasOwnProperty(id_component)){
                Synchronise.Cloud.run("loadComponent", {id: id_component, style: true, code: false}, {
                    success: function(comp){
                        componentsData[comp.component.id] = _.extend(comp.component, {logo:comp.style.icon});
                        callback(componentsData[comp.component.id]);
                    }
                });
            }else{
                callback(componentsData[id_component]);
            }
        },
        addComponent: function(id_component){
            var forked = false; // whether or not the component has been forked and is ready
            var target = this;
                target.setState({saving: true, forking: true});

            this.getRequiredIdForComponent(id_component, function(id_component_forked){
                var components_modified = target.state.components.slice();
                    components_modified.push({
                        timestamp: new Date().getTime(),
                        id_component: id_component_forked,
                        settings: {},
                        inputs: {},
                        outputs: {},
                        order: parseInt(target.state.components.length+1)
                    });
                    target.setState({components: components_modified});

                // Reset the orders of the components

                for(var i = 0; i < components_modified.length; i++){
                    components_modified[i].order = i;
                }

                // Scroll to the new added component once it has been mounted on the screen
                var interval = window.setInterval(function(index){
                    var childs = $(".flow").find('.component');
                    if(childs.length>=index){
                        var child = $(childs[index-1]);
                        // The new component is now on the flow
                        if(child.offset()){
                            var scroll = (child.offset().top-$("#workflow #inputContainer").height()-$("#workflow #inputContainer").offset().top+$(window).scrollTop());
                            $("html, body").animate({
                                scrollTop: scroll
                            }, 300);
                            window.clearInterval(interval);
                        }
                    }
                }.bind(null, components_modified.length), 50);

                var timestamp = new Date();

                target.setState({lastUpdateSent:timestamp.getTime()});
                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data: {components: components_modified}, timestampRequest: timestamp.getTime()}, {
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({saving: false});
                    }
                });

                target.resizeInterface();
            });
        },
        removeComponent: function(index){
            var target = this;
            var components_modified = this.state.components.slice(0);
            var componentToBeRemoved = components_modified[index];

            // Remove any association to the outputs of the component we remove
            // Remove association to other components
            for(var i = 0; i < components_modified.length; i++){
                var row = components_modified[i];
                var keys = Object.keys(row.inputs);
                for(var j = 0; j < keys.length; j++){
                    var key = keys[j];
                    var input = row.inputs[key];
                    if(input.from.id_component == componentToBeRemoved.id_component
                    && input.from.index == componentToBeRemoved.order){
                        delete row.inputs[key];
                    }
                }
            }

            // Remove association to workflows outputs
            var copyOutputs = this.state.outputs.slice(0);
            for(var i = 0; i < copyOutputs.length; i++){
                var output = copyOutputs[i];
                if(output.association){
                    if(output.association.parent == componentToBeRemoved.id_component
                    && componentToBeRemoved.order == output.association.index_parent){
                        copyOutputs[i].association = null;
                    }
                }
            }

            components_modified.splice(index, 1);

            // Reset the orders of the components
            for(var i = 0; i < components_modified.length; i++){
                components_modified[i].order = i;
            }

            var timestamp = new Date();
            this.setState({components: components_modified, saving: true, outputs: copyOutputs, lastUpdateSent:timestamp.getTime()});

            Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data: {components: components_modified, outputs: copyOutputs}, timestampRequest: timestamp.getTime()}, {
                error: function(err){
                    new ModalErrorParse(err);
                },
                always: function(){
                    target.setState({saving: false});
                    target.resizeInterface();
                }
            });

            target.resizeInterface();
        },
        inputSelectedForComponent: function(value){
            var target = this;

            var comps = target.state.components;
                comps[value.to.index].inputs[value.to.name] = value;

            var timestamp = new Date();
            target.setState({components: comps, saving: true, lastUpdateSent:timestamp.getTime()});

            Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data: {components: comps}, timestampRequest: timestamp.getTime()}, {
                error: function(err){
                    new ModalErrorParse(err);
                },
                always: function(){
                    target.setState({saving: false});
                    target.resizeInterface();
                }
            });

            Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data: {components: comps}, timestampRequest: timestamp.getTime()}, {
                always: function(){
                    target.setState({saving: false});
                }
            });
        },
        inputRemovedForComponent: function(value){
            var target = this;

            var components = target.state.components;
            var compFrom   = components[value.to.index];
            delete compFrom.inputs[value.to.name];

            var timestamp = new Date();
            target.setState({components: components, saving: true, lastUpdateSent:timestamp.getTime()});

            Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data: {components: components}, timestampRequest: timestamp.getTime()}, {
                always: function(){
                    target.setState({saving: false});
                }
            });

            target.resizeInterface();
        },
        // Add an input at the top of the workflow
        addInputWorkflow: function(name, type){
            var inputs = this.state.inputs;
            var index = -1;

            for(var i = 0; i < this.state.inputs.length; i++){
                if(this.state.inputs[i].name == name){
                    index = i;
                }
            }

            if(index == -1){
                var timestamp = new Date();

                inputs.push({name: name, type: (type || ["text", "text"])});
                this.setState({inputs: inputs, lastUpdateSent:timestamp.getTime()});
                this.resizeInterface();

                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data:{inputs: inputs}, timestampRequest: timestamp.getTime()}, {
                    success: function(){},
                });
            }
        },
        removeInputWorkflow: function(name){
            var target = this;
            var inputs = target.state.inputs;
            var index = -1;

            for (var i = 0; i < inputs.length; i++) {
                if(inputs[i].name == name){
                    index = i;
                }
            }

            var components_modified = target.state.components.slice(0);

            // Remove any association to the inputs of the workflow we remove
            // Remove association to other components
            for (var j = 0; j < components_modified.length; j++) {
                var row = components_modified[j];
                var keys = Object.keys(row.inputs);
                var length = keys.length;

                for (var i = 0; i < length; i++) {
                    var key = keys[i];
                    var input = components_modified[j].inputs[key];
                    if(input.from.id_component == "workflow" && input.from.name == name){
                        delete components_modified[j].inputs[key];
                    }
                }
            }

            // Remove association to workflow's outputs
            var copyOutputs = target.state.outputs.slice(0);
            for(var i = 0; i < copyOutputs.length; i++){
                var output = copyOutputs[i];
                if(output.association){
                    if(output.association.parent == "workflow"){
                        copyOutputs[i].association = null;
                    }
                }
            }

            if(index != -1){
                var timestamp = new Date();
                inputs.splice(index, 1);
                target.setState({inputs: inputs, components: components_modified, outputs: copyOutputs, lastUpdateSent:timestamp.getTime()});
                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), timestampRequest: timestamp.getTime(), data:{inputs: inputs, components: components_modified, outputs: copyOutputs}}, {
                    success: function(){},
                });
            }

            target.resizeInterface();
        },
        typeChangedForField: function(field, newType){
            var inputs = this.state.inputs;

            if(inputs){
                for(var i = 0; i < inputs.length; i++){
                    var row = inputs[i];
                    if(row.name == field){
                        inputs[i].type = newType;
                    }
                }


                var timestamp = new Date();
                this.setState({inputs: inputs, lastUpdateSent:timestamp.getTime()});
                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data:{inputs: inputs}, timestampRequest: timestamp.getTime()}, {
                    success: function(){},
                });
            }
        },
        addOutputWorkflow: function(name){
            var target = this;
            var outputs = this.state.outputs;
            var index = -1;

            for(var i = 0; i < this.state.outputs.length; i++){
                var row = this.state.outputs[i];
                if(row.name == name){
                    index = i;
                }
            }

            if(index == -1){
                var timestamp = new Date();
                outputs.push({name: name, type: ["text", "text"]});
                this.setState({outputs: outputs, lastUpdateSent:timestamp.getTime()});
                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data:{outputs: outputs}, timestampRequest: timestamp.getTime()}, {
                    success: function(){},
                });
            }

            target.resizeInterface();
        },
        removeOutputWorkflow: function(name){
            var target = this;
            var outputs = this.state.outputs;
            var index = -1;

            for (var i = 0; i < outputs.length; i++) {
                var row = outputs[i];
                if(row.name == name){
                    index = i;
                }
            }

            if(index != -1){
                var timestamp = new Date();
                outputs.splice(index, 1);
                this.setState({outputs: outputs, lastUpdateSent:timestamp.getTime()});
                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data:{outputs: outputs}, timestampRequest: timestamp.getTime()}, {
                    success: function(){},
                });
            }

            target.resizeInterface();
        },
        typeChangedForOutput: function(field, newType){
            var outputs = this.state.outputs;

            if(outputs){
                for (var i = 0; i < outputs.length; i++) {
                    var row = outputs[i];
                    if(row.name == field){
                        outputs[index].type = newType;
                    }
                }

                var timestamp = new Date();
                this.setState({outputs: outputs, lastUpdateSent:timestamp.getTime()});
                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data:{outputs: outputs}, timestampRequest: timestamp.getTime()}, {
                    success: function(){},
                });
            }
        },
        inputSelectedForOutput: function(field, value){
            var outputs = this.state.outputs;

            if(outputs){
                for (var i = 0; i < outputs.length; i++) {
                    var row = outputs[i];
                    if(row.name == field){
                        outputs[i].association = value.item.value;
                    }
                }

                var timestamp = new Date();
                this.setState({outputs: outputs, lastUpdateSent:timestamp.getTime()});
                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data:{outputs: outputs}, timestampRequest: timestamp.getTime()}, {
                    success: function(){},
                });
            }
        },
        removeAssociatedOutput: function(field){
            var target = this;
            var outputs = this.state.outputs;

            if(outputs){
                for (var i = 0; i < outputs.length; i++) {
                    var row = outputs[i];
                    if(row.name == field.name){
                        outputs[i].association = null;
                    }
                }

                var timestamp = new Date();
                this.setState({outputs: outputs, lastUpdateSent:timestamp.getTime()});
                Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data:{outputs: outputs}, timestampRequest: timestamp.getTime()}, {
                    success: function(){},
                });
            }

            target.resizeInterface();
        },
        getPublicKey: function(callback){
            var needToCreateJS = false;
            if (!Synchronise.User.current().public_key) {
                needToCreateJS = true;
            }

            if (needToCreateJS) {
                Synchronise.Cloud.run("createPublicKey", { "type": "javascript" }, {
                    success: function (key) {
                        Synchronise.User.fetchCurrent(function(){ // Refresh local data
                            callback(Synchronise.User.current().public_key);
                        });
                    }
                });
            }else{
                callback(Synchronise.User.current().public_key);
            }
        },
        runWorkflow: function(){
            var target = this;

            if(!target.state.components.length){
                // display an error modal if there is no component in the workflow
                var modal = new Modal();
                    modal.title("Run workflow");
                    modal.content("You need to add at least one component in your workflow to run it");
                    modal.footer("", true);
                    modal.show();
            }else{
                // init the interface to the start state
                target.setState({executionCurrentProgress: 0, execution_status: 1, start_execution: new Date()});

                // get the public key of the user to use while executing
                this.getPublicKey(function(public_key){
                    Synchronise.init(public_key);
                    $("html, body").animate({
                        scrollTop: 0
                    }, 150);

                    // Displays the bottom execution panel to half its size (its like a modal)
                    target.showExecutionPanel("half");

                    Synchronise.Cloud.run("executeWorkflow", _.extend({id_workflow: urlH.getParam("id")}, target.state.inputsValues), {
                        success: function(data_success){
                            // Displays the full result
                            target.showExecutionPanel("full", function(data){
                                target.setState({execution_status:2, success: data_success});
                                var intervalForJson = window.setInterval(function(){
                                    if($(ReactDOM.findDOMNode(target)).find('#resultJson')){
                                        window.clearInterval(intervalForJson);
                                        $(ReactDOM.findDOMNode(target)).find('#resultJson').JSONView(data_success);
                                    }
                                }, 10);
                            });
                        },
                        progress: function(progress, data){
                            if(data.type == "component"){
                                var step;
                                target.setState({executionCurrentProgress: progress.percentage});

                                if(data.status == "success"){
                                    step = progress.currentStep; // go to the next component
                                }else{
                                    step = progress.currentStep-1; // stay on the same component
                                }
                                var child = $("#listOfComponentsInFlow .compAt" + (progress.currentStep));
                                if(child){
                                    if(child.offset()){
                                        var scroll = (child.offset().top-$("#workflow #inputContainer").height()-$("#workflow #inputContainer").offset().top+$(window).scrollTop());

                                        $("html, body").animate({
                                            scrollTop: scroll
                                        }, 300);
                                    }
                                }
                            }
                        },
                        error: function(err){
                            target.showExecutionPanel("full", function(){
                                target.setState({execution_status:3, error: err});
                                var intervalForJson = window.setInterval(function(){
                                    if($(ReactDOM.findDOMNode(target)).find('#resultJson')){
                                        window.clearInterval(intervalForJson);
                                        $(ReactDOM.findDOMNode(target)).find('#resultJson').JSONView(err);
                                    }
                                }, 10);
                            });
                        },
                        always: function(){
                            target.setState({end_execution: new Date()});
                            window.setTimeout(function(){
                                target.setState({executionCurrentProgress: 0});
                            }, 300);
                        }
                    });
                });
            }
        },
        showExecutionPanel: function(half_or_full, callback){
            var target = this;

            KeyEventController.unsubscribeComponent("exportPanelFromExecution");
            KeyEventController.subscribeComponent("exportPanelFromExecution", function(key){
                if(key == 27){
                    target.hideExecutionPanel();
                }
            });

            if(half_or_full == "half"){
                $('#executionPanel').animate({bottom: "-20px", height: "150px"}, 500, "easeOutBack", function(){
                    if(typeof(callback) != "undefined"){
                        callback();
                    }
                });
                $('#shadowForExecutionPanel').animate({opacity: 1}, 300);
                $('#shadowForExecutionPanel').css({display: "block"}, 300);
            }else{
                $('#executionPanel').animate({height: "90%"}, 500, "easeInBack", function(){
                    if(typeof(callback) != "undefined"){
                        callback();
                    }
                });
            }
        },
        hideExecutionPanel: function(){
            KeyEventController.unsubscribeComponent("exportPanelFromExecution");
            $('#executionPanel').animate({bottom: "-150px", height: "150px"}, 500, "easeInBack");
            $('#shadowForExecutionPanel').animate({opacity: 0}, 300, function(){
                $('#shadowForExecutionPanel').css({display: "none"}, 300);
            });
        },
        actionToFixError: function(){
            var target = this;

            if(target.state.error.type == "component"){
                window.setTimeout(function(){
                    var child = $("#listOfComponentsInFlow .compAt" + (target.state.error.index));

                    if(child){
                        if(child.offset()){
                            var scroll = (child.offset().top-$("#workflow #inputContainer").height()-$("#workflow #inputContainer").offset().top+$(window).scrollTop());

                            $("html, body").animate({
                                scrollTop: scroll
                            }, 300, function(){
                                child.find('.header').effect("highlight", 1000);
                            });
                        }
                    }
                }, 300);
            }else if(target.state.error.type == "workflow"){
                window.setTimeout(function(){
                    var scroll = 0;

                    $("html, body").animate({
                        scrollTop: scroll
                    }, 300, function(){
                        $(ReactDOM.findDOMNode(target)).find('#inputsValues .card').effect("highlight",{color:'#1194F6'}, 500);
                    });
                }, 300);
            }

            target.hideExecutionPanel();
        },
        toggleHelp: function(value){
            Synchronise.LocalStorage.set("helpIsActivatedForWorkflow", value, true);

            var target = this;
                target.setState({helpActivated: value});

            if(value){
                $('[data-toggle="tooltip"]').each(function(){
                    $(this).tooltip('enable');
                });
            }else{
                $('[data-toggle="tooltip"]').each(function(){
                    $(this).tooltip('disable');
                });
            }
        },
        runInputValueChanged: function(name, event){
            var target = this;
            var clone  = this.state.inputsValues;
                clone[name] = event.target.value;

            target.setState({
                inputsValues: clone
            });
        },
        nameInputChanged: function(fromName, toName){
            var target = this;

            // Change the name
            var copyInputs = this.state.inputs.slice(0);
            for(var i = 0; i < copyInputs.length; i++){
                var row = copyInputs[i];
                if(row.name == fromName){
                    row.name = toName;
                    break;
                }
                copyInputs[i] = row;
            }

            // For each components, associate the inputs to the new name
            var copyComponents = this.state.components.slice(0);
            for(var i = 0; i < copyComponents.length; i++){
                var row = copyComponents[i];
                for(var j = 0; j < Object.keys(row.inputs).length; j++){
                    var rowInput = row.inputs[Object.keys(row.inputs)[j]];
                    if(rowInput.from.name == fromName
                    && rowInput.from.id_component == "workflow"){
                        rowInput.from.name = toName;
                    }
                    row.inputs[Object.keys(row.inputs)[j]] = rowInput;
                }
                copyComponents[i] = row;
            }

            var timestamp = new Date();

            target.setState({inputs: copyInputs, components: copyComponents, lastUpdateSent:timestamp.getTime()});
            Synchronise.Cloud.run("updateWorkflow", {id: urlH.getParam("id"), data:{inputs: copyInputs/*, components: copyComponents*/}, timestampRequest: timestamp.getTime()}, {
                success: function(){},
            });
        },
        render: function(){
            var target = this;

            var messageIfNoComponents = "";
            if(!this.state.components.length && !this.state.loading){
                messageIfNoComponents= (
                   <div className="card" style={{textAlign: "center"}}>There is no components selected for this workflow. Please select a component from the <b style={{cursor: "pointer"}} onClick={this.highlightCatalog}>catalog</b></div>
                )
            }

            var components = (<div></div>);
            if(this.state.components.length){
                components = <Components inputs={target.state.inputs}
                                         associatedData={target.state.components}
                                         addInputWorkflow={target.addInputWorkflow}
                                         components={target.state.components}
                                         componentsData={target.state.componentsData}
                                         removeComponent={target.removeComponent}
                                         resizeInterface={target.resizeInterface}
                                         inputSelectedForComponent={target.inputSelectedForComponent}
                                         inputRemovedForComponent={target.inputRemovedForComponent}/>;
            }

            var contentWorkflow = "";
            var loader = "";
            if(this.state.loading){
                loader = (
                    <div className="col-xs-12" style={{textAlign: "center"}}>
                        <Loader/>
                    </div>
                );
            }

            var marginTopFlow = "55px";
            var paddingBottom = "0px";
            var timeline = "";
            if(this.state.components.length){
                if($(window).width()>1200){
                    marginTopFlow = "7px";
                }else{
                    marginTopFlow = "0px";
                }
                timeline = (<div id="timeline"></div>);
            }else if(!this.state.components.length && !this.state.loading){ // There is no component in this workflow
                marginTopFlow = "40px";
            }

            // If the last component has outputs we don't set padding
            // If it does we do set a padding of 20px
            if(this.state.components.length){
                paddingBottom = "20px";
            }

            contentWorkflow = (
                <div>
                    <WorkflowInput inputs={this.state.inputs}
                                   addInputWorkflow={this.addInputWorkflow}
                                   typeChangedForField={this.typeChangedForField}
                                   nameInputChanged={this.nameInputChanged}
                                   removeInputWorkflow={this.removeInputWorkflow}/>
                    <div className="row flow" align="center" style={{marginTop: marginTopFlow}}>
                        {loader}
                        <div className="col-xs-10 col-xs-offset-1" style={{paddingBottom: paddingBottom}}>{timeline}{messageIfNoComponents}{components}</div>
                    </div>
                    <WorkflowOutput outputs={this.state.outputs}
                                    inputs={this.state.inputs}
                                    components={this.state.components}
                                    componentsData={this.state.componentsData}
                                    inputSelectedForOutput={this.inputSelectedForOutput}
                                    removeAssociatedOutput={this.removeAssociatedOutput}
                                    removeOutputWorkflow={this.removeOutputWorkflow}
                                    typeChangedForOutput={this.typeChangedForOutput}
                                    addOutputWorkflow={this.addOutputWorkflow}/>
                    <div id="maskTimelineBottom"></div>
                </div>
            );

            var status = "";
            if(this.state.loading){
                status = (<span className="label label-primary">Loading</span>);
            }else if(this.state.saving){
                status = (<span className="label label-primary">Saving</span>);
            }else{
                status = (<span className="label label-success">Synced</span>);
            }

            var helpToggleButton = "";
            if(this.state.helpActivated){
                helpToggleButton = (
                    <div className="btn-group">
                        <label className="btn btn-xs btn-default active" onClick={this.toggleHelp.bind(null, true)}>on</label>
                        <label className="btn btn-xs btn-default" onClick={this.toggleHelp.bind(null, false)}>off</label>
                    </div>
                );
            }else{
                helpToggleButton = (
                    <div className="btn-group">
                        <label className="btn btn-xs btn-default" onClick={this.toggleHelp.bind(null, true)}>on</label>
                        <label className="btn btn-xs btn-default active" onClick={this.toggleHelp.bind(null, false)}>off</label>
                    </div>
                );
            }

            var exportBlockForExecutionPanel = "";
            if(this.state.execution_status == 2){ // Done and succeeded
                var execution_duration = (this.state.end_execution.getTime() - this.state.start_execution.getTime())/1000;
                exportBlockForExecutionPanel = (
                    <div className="container-fluid">
                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <div id="export" className="row-fluid" style={{paddingTop: "20px"}}>
                                    <div className="col-md-6 col-xs-12">
                                        <legend>Export in your app <i style={{position: "absolute", cursor: "pointer", right: "-14px", top: "0px"}} className="fa fa-times fa-5 visible-xs visible-sm" onClick={this.hideExecutionPanel}></i></legend>
                                        <Export loading={false} id={this.state.identifier} inputs={this.state.inputs}/>
                                    </div>

                                    <div className="col-md-6 col-xs-12">
                                        <legend>Enjoy your awesomeness! <span className="pull-right">{execution_duration}s to execute  <i style={{position: "absolute", cursor: "pointer", right: "-14px", top: "0px"}} className="fa fa-times fa-5 hidden-xs hidden-sm" onClick={this.hideExecutionPanel}></i></span></legend>
                                        <div id="resultJson" style={{border: "1px solid #47B04B", borderRadius: "5px", minHeight: "50px", backgroundColor: "rgba(183, 221, 185, 0.37)", padding: "10px", color: "black"}}>
                                            {JSON.stringify(target.state.success)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            if(this.state.execution_status == 3){ // Done and error
                var execution_duration = (this.state.end_execution.getTime() - this.state.start_execution.getTime())/1000;
                var errorString = "";
                if(this.state.error.type == "component"){
                    errorString = (
                        <div style={{fontFamily: "monospace"}}>
                            <p style={{color: "black"}}>The execution of a component failed</p>
                            <p style={{color: "black"}}>Component name : {this.state.componentsData[this.state.error.id].name}</p>
                            <p style={{color: "black"}}>Index of the component : {this.state.error.index+1}</p>
                            <p style={{color: "black"}}>Reason : <span style={{color: "red"}}>{this.state.error.error.error}</span></p>
                        </div>
                    );
                }

                exportBlockForExecutionPanel = (
                    <div className="container-fluid">
                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <div id="export" className="row-fluid" style={{paddingTop: "20px"}}>
                                    <div className="col-xs-12">
                                        <legend>Uh oh. Let see what happened there. <span className="pull-right">{execution_duration}s to execute <button className="btn btn-primary btn-xs" onClick={this.actionToFixError}>Fix now</button></span></legend>

                                        <div id="resultJson" style={{border: "1px solid #EC2F2A", borderRadius: "5px", minHeight: "50px", backgroundColor: "rgba(243, 193, 191, 0.33)", padding: "10px"}}>
                                            {errorString}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            var progressBlockForExecutionPanel = "";
            if(this.state.execution_status == 1){ // Executing
                progressBlockForExecutionPanel = (
                    <div className="row-fluid">
                        <div style={{textAlign: "center"}} className="col-xs-12">
                            <h4>{this.state.executionCurrentProgress}%</h4>
                        </div>

                        <div className="col-xs-10 col-xs-offset-1">
                            <div className="progress" style={{marginTop: "20px", borderRadius: "5px"}}>
                                <div className="progress-bar progress-bar-primary" role="progressbar" aria-valuenow={this.state.executionCurrentProgress} aria-valuemin="0" aria-valuemax="100" style={{width: this.state.executionCurrentProgress+"%"}}></div>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div>
                    <div id="shadowForExecutionPanel" style={{display: "none", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, opacity: 0}}></div>
                    <span className="pull-right"
                          style={{marginTop: "-55px", right: "25px", position: "absolute"}}>
                          <small>Help</small> {helpToggleButton}
                          <span data-toggle="tooltip"
                                data-placement="left"
                                data-delay="200"
                                data-container="body"
                                data-trigger="hover"
                                style={{marginLeft: "10px"}}
                                title="This element indicates if the changes you made saved correctly on our servers.">{status}</span>
                    </span>
                    <div className="col-lg-4 col-md-12 col-sm-12 col-xs-12 leftSide">
                        <div style={{textAlign: "center"}}>
                            <button className="btn btn-primary"
                                    data-toggle="tooltip"
                                    data-placement="right"
                                    data-trigger="hover"
                                    data-container="body"
                                    data-delay="300"
                                    title="This button executes the workflow and lets you try it before you integrate it in your project. If there is any error in your workflow you will be advised how to fix it."
                                    onClick={this.runWorkflow}>Run</button><br/>
                            <ul className="nav nav-tabs" role="tablist" id="tabs">
                                <li role="presentation" className="active" style={{float: "none", display: "inline-block"}}>
                                    <a href="#workflowTab" aria-controls="workflowTab" role="tab" data-toggle="tab">Workflow</a>
                                </li>
                                <li role="presentation" style={{float: "none", display: "inline-block"}}>
                                    <a href="#settingsTab" aria-controls="settingsTab" role="tab" data-toggle="tab">Settings</a>
                                </li>
                                <li role="presentation" style={{float: "none", display: "inline-block"}}>
                                    <a href="#exportTab" aria-controls="exportTab" role="tab" data-toggle="tab">Export</a>
                                </li>
                            </ul>
                            <br/>
                        </div>
                        <WorkflowInputValues inputs={target.state.inputs}
                                             inputsValues={this.state.inputsValues}
                                             inputsStatus={target.state.inputsStatus}
                                             inputValueChanged={target.runInputValueChanged}/>
                        <ComponentCatalog clickOnComponent={target.addComponent} forking={target.state.forking}/>
                    </div>

                    <div className="col-lg-8 col-md-12 col-sm-12 col-xs-12 rightSide">
                        <div id="executionPanel" style={{paddingBottom: "30px", overflowY: "auto", position: "fixed", bottom: "-150px", width: "100%", right: 0, height: "100px", background: "rgba(255,255,255,0.95)", zIndex: 2147483001}}>
                            {exportBlockForExecutionPanel}{progressBlockForExecutionPanel}
                        </div>

                        <div className="tab-content">
                            <div role="tabpanel" className="tab-pane fade in active" id="workflowTab">
                                {contentWorkflow}
                            </div>

                            <SettingsTab identifer={target.state.identifier} name={target.state.name} loading={target.state.loading} changeName={target.changeName}/>
                            <ExportTab loading={target.state.loading} id={target.state.identifier} inputs={target.state.inputs}/>
                        </div>
                    </div>
                </div>
            );
        }
    });

    ReactDOM.render(<Workflow/>, document.getElementById("workflow"));
});
