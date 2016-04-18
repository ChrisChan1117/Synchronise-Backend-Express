var Component;
dependenciesLoader(["ReactDOM", "React", "_", "Loader", "Typeahead"], function(){
    // Defines a component displayed on the workflow
    // Props:
    // - (integer)index : The index of the component in the list of components in the flow
    // - (function)removeFromWorkflow : Callback to trigger when the component is removed
    // - (object)data : All the information we need to display the component on the screen
    // - (function)inputSelected : Callback to trigger when an input has been selected
    // - (function)removeAssociatedInput: Callback to trigger when an input has been removed
    // - (object)inputs : The list of input that have already been selected for the current component
    // {
    //    id_component: id_component,
    //    settings: {},
    //    inputs: {},
    //    outputs: {}
    // }
    Component = React.createClass({
        getInitialState: function(){
            return {
                loading: false,
                helpActivated: false,
                component: {},
                classForComponent: "",
                style    : {
                    bg_color: "",
                    txt_color: "",
                    icon_flts: ""
                }
            };
        },
        componentDidMount: function(){
            var target = this;
                if(target.isMounted()){
                    target.setState({loading: true});
                }

            var timestamp = new Date().getTime();

            Synchronise.Cloud.run("loadComponent", {id: target.props.data.id_component, style: true, code: false, realtime: {ignore: ["style", "code"]}}, {
                success: function(data){
                    var params = data;
                        params.classForComponent = "displayed";

                    if(!params.hasOwnProperty("style")){
                        params.style= {
                            icon: "",
                            bg_color: "white",
                            txt_color: "black",
                            icon_flts: ""
                        };
                    }

                    if(!params.style.icon){
                        params.style.icon = "https://images.synchronise.io/defaultProjectIcon.png";
                    }

                    if(target.isMounted()){
                        target.setState(params);
                        // Set position top allows us to animate on movements
                        $(ReactDOM.findDOMNode(target)).css({top: $(ReactDOM.findDOMNode(target)).offset().top});
                    }
                },
                error: function(err){
                    new ModalErrorParse(err);
                },
                always: function(){
                    if(target.isMounted()){
                        target.setState({loading: false});
                        target.props.refreshFlow();
                        target.addRequiredInputsToWorkflowIfComponentIsFirst();
                        target.activateDeactivateHelp();
                    }
                }
            });
        },
        activateDeactivateHelp: function(){
            var target = this;
            Synchronise.LocalStorage.get("helpIsActivatedForWorkflow", function(status){
                if(target.isMounted()){
                    target.setState({helpActivated: status});

                    if(status){
                        $(ReactDOM.findDOMNode(target)).find('[data-toggle="tooltip"]').each(function(){
                            $(this).tooltip('enable');
                        });
                    }else{
                        $(ReactDOM.findDOMNode(target)).find('[data-toggle="tooltip"]').each(function(){
                            $(this).tooltip('disable');
                        });
                    }
                }
            }, false, true, true);
        },
        addRequiredInputsToWorkflowIfComponentIsFirst: function(){
            var target = this;
            // The component is the first of the flow
            if(target.props.index == 0){
                var dataOfNewComponent = target.props.associatedData;
                // Verify that all mandatory inputs of the first component have been associated to an input of the workflow
                // If no, we create a new input on the workflow and associate it to the first component
                for(var i = 0; i < target.state.component.inputs.length; i++){
                    var currentInput = target.state.component.inputs[i];

                    // The input is not optional
                    if(!currentInput.is_optional){
                        // The input is not associated to something
                        if(!dataOfNewComponent.inputs.hasOwnProperty(currentInput.name)){
                            var workflow_input_name = currentInput.name+"_"+1;
                            target.props.addInputWorkflow(workflow_input_name, currentInput.type);

                            var dataForAssociation = {
                                from: {
                                    id_component : "workflow",
                                    name         : workflow_input_name,
                                    index        : -1
                                },
                                to : {
                                    id_component : target.state.component.id,
                                    name         : currentInput.name,
                                    index        : 0
                                }
                            };
                            target.props.inputSelected(dataForAssociation);
                        }
                    }
                }
            }
        },
        remove: function(){
            var target = this;
            $(ReactDOM.findDOMNode(target)).find('.component').animate({
                minHeight: "0px",
                height: "0px"
            }, 200, "easeInBack");

            target.setState({classForComponent: ""});

            window.setTimeout(function(){
                target.props.removeFromWorkflow(target.props.index);
            }, 500);
        },
        render: function(){
            var content = "";
            var settings = "";

            if(this.state.component.settings){
                settings = (
                    <div className="content">
                        <div className="row-fluid">
                            <legend>Settings</legend>
                        </div>

                        <div className="row form">
                            {this.state.component.settings.map(function(row){
                                var field = "";
                                switch (row.type) {
                                    case "input":
                                        field = (<input type={row.subtype} className="form-control" placeholder={row.placeholder}/>);
                                        break;
                                }

                                return (
                                    <div className="form-group col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                        <label style={{color: "#777"}}>row.name</label>
                                        {field}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            var marginTop = "20px";
            var inputs = "";
            var marginBottom = "0px";
            var outputs = "";

            if(this.state.component.hasOwnProperty("inputs") && this.state.component.hasOwnProperty("outputs")){
                if(Object.keys(this.state.component.inputs).length){
                    marginTop = "20px";
                    inputs = (
                        <div data-toggle="tooltip"
                             data-placement="top"
                             data-trigger="hover"
                             data-delay="300"
                             data-container="body"
                             title="This block contains the inputs required by this component to execute. You can associate any inputs of the component with either, an input of the workflow, or the output of another component above this one."
                             className="inputs"
                             style={{marginTop: marginTop, backgroundColor: "white", borderBottomColor: this.state.style.txt_color}}>
                            <ComponentInput inputs={this.state.component.inputs}
                                            index={this.props.index}
                                            refreshFlow={this.props.refreshFlow}
                                            availableInputs={this.props.availableInputs}
                                            txt_color={this.state.txt_color}
                                            inputSelected={this.props.inputSelected}
                                            removeAssociatedInput={this.props.removeAssociatedInput}
                                            inputsAlreadyAssociated={this.props.inputs}
                                            component_id={this.props.data.id_component}/>
                        </div>
                    );
                    marginTop = "0px";
                }

                if(Object.keys(this.state.component.outputs).length){
                    marginBottom = "0px";
                    outputs = (
                        <div className="outputs"
                             data-placement="bottom"
                             data-toggle="tooltip"
                             data-trigger="hover"
                             data-delay="300"
                             data-container="body"
                             title="This block contains the outputs the component returns when it finishes executing. You can associate the outputs of this component to the input of another component below this one."
                             style={{backgroundColor: "white", borderTopColor: this.state.style.txt_color, marginBottom: marginBottom}}>
                            <ComponentOutput outputs={this.state.component.outputs}
                                             index={this.props.index}
                                             refreshFlow={this.props.refreshFlow}
                                             component_id={this.props.data.id_component}/>
                        </div>
                    );
                    marginBottom = "0px";
                }
            }

            if(this.state.loading){
                content = <Loader/>;
            }else{
                content = (
                    <div style={{marginBottom: marginBottom, marginTop: marginTop}}>
                        {inputs}
                        <div className="header" style={{background: this.state.style.bg_color}}>
                            <legend className="title"
                                    style={{color: this.state.style.txt_color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}><span className="orderLabel" style={{borderColor:this.state.style.txt_color, color: this.state.style.txt_color}}>{this.props.index+1}</span> {this.state.component.name}</legend>
                            <i className="fa fa-times remove"
                               onClick={this.remove}
                               style={{color: this.state.style.txt_color, cursor: "pointer"}}></i>
                            <img className="serviceLogo" src={this.state.style.icon} style={{borderRadius: "5px"}}/>
                        </div>
                        {settings}
                        {outputs}
                    </div>
                );
            }

            var loader = "";
            if(this.state.loading){
                loader = (
                    <div className="col-xs-12" style={{textAlign: "center"}}>
                         <Loader/>
                    </div>
                );
            }

            return (
                <li data-id={this.props.data.id_component} className="liForComponent" style={{marginBottom: marginBottom, marginTop: marginTop}}>
                    {loader}
                    <div className={"col-lg-12 col-md-12 col-sm-12 col-xs-12 component card compAt" + this.props.index + " " + this.state.classForComponent}
                         style={{zIndex: 500-this.props.index}}>
                        {content}
                    </div>
                </li>
            );
        }
    });

    // Props :
    // - (array)inputs: The list of inputs the component is expecting
    // - (integer)index : Index of the component in the list of components
    // - (string)component_id : The id of the component
    // - (text)txt_color : Color of the text to apply on the typeahead
    // - (function)inputSelected : Callback to trigger when an input has been selected
    // - (function)removeAssociatedInput: Callback to trigger when an input has been removed
    // - (object)inputsAlreadyAssociated: List of inputs that have already been associated to another output
    // - (function)refreshFlow : Callback to trigger when we are done drawing in order to refresh the drawing of the flow
    // - (array)availableInputs : An array of all the available inputs for the current component in the list of the workflow
    var ComponentInput = React.createClass({
        displayName: "ComponentInput",
        componentDidMount: function(){
            var target = this;
            window.setTimeout(function(){
                target.props.refreshFlow();
            }, 300);
        },
        inputSelected: function(item){
            var target = this;
            this.props.inputSelected({
                from: {
                    id_component : item.item.value.parent,
                    name         : item.item.value.input_name,
                    index        : item.item.value.index_parent
                },
                to : {
                    id_component : target.props.component_id,
                    name         : item.item.value.target_name,
                    index        : target.props.index
                }
            });
        },
        removeAssociatedInput: function(data){
            this.props.removeAssociatedInput(data);
        },
        renderInputWithData: function(row){
            var target = this;

            var contentColLeft = "";
            if(!target.props.inputsAlreadyAssociated.hasOwnProperty(row.name)){
                var inputTypeSignature = "";
                for(var i = 0; i < row.type.length; i++){
                    inputTypeSignature+=row.type[i];
                }

                var arrayOptions = [];
                for(var k = 0; k < target.props.availableInputs.length; k++){
                    var currentParent = target.props.availableInputs[k];

                    var parent       = currentParent.parent;
                    var parent_index = currentParent.index;
                    var inputs       = currentParent.inputs;
                    var icon;
                    // If it is not an input from the workflow itself
                    if(currentParent.index != -1){
                        icon = currentParent.icon;
                    }

                    for(var j = 0; j < inputs.length; j++){
                        var input = inputs[j];
                        var inputTypeSignatureRow = "";
                        for(var i = 0; i < input.type.length; i++){
                            inputTypeSignatureRow+=input.type[i];
                        }

                        if(inputTypeSignatureRow == inputTypeSignature){
                            var text = (parent_index+1) + ": " + input.name;
                            if(parent_index == -1){ // workflow input
                                text = "workflow : " + input.name;
                            }

                            arrayOptions.push({
                                value: {
                                    parent       : parent,
                                    target_name  : row.name,
                                    index_parent : parent_index,
                                    input_name   : input.name
                                },
                                icon   : icon,
                                text   : text
                            });
                        }
                    }
                }

                contentColLeft = (
                    <div style={{paddingLeft: "5px", paddingRight: "5px", position: "absolute"}}>
                        <Typeahead options={arrayOptions}
                                   onSelected={target.inputSelected}
                                   typeContent="text"
                                   className="typeaheadForInputInComponent"
                                   openedOnfocus={true}
                                   txt_color={target.props.txt_color}
                                   placeholder="Click to select variable"/>
                    </div>
                );
            }else{
                var data = target.props.inputsAlreadyAssociated[row.name];
                var dataInputAlreadyAssociated = data.from;
                var badgeIndex = "";
                if(dataInputAlreadyAssociated.index+1 > 0){
                    badgeIndex = dataInputAlreadyAssociated.index+1;
                }else{
                    badgeIndex = "workflow";
                }

                contentColLeft = (
                    <div className="inputItem colLeft">
                        <img src={dataInputAlreadyAssociated.icon} style={{width: "15px"}}/> <div style={{display: "inline-block", border: "1px solid darkgray", borderRight: "none", borderTopLeftRadius: "5px", borderBottomLeftRadius: "5px", lineHeight: "16px", height: "17px"}}><span className="associatedBadgeIndex">{badgeIndex}</span></div>
                        {row.type.map(function(type, index){
                            return (<span className='type' key={target.props.component_id+dataInputAlreadyAssociated.name+target.props.index+type+index+"associated"}>{type}</span>);
                        })}
                        <span className="name label label-primary">{dataInputAlreadyAssociated.name}</span>
                        <span className="remove" style={{display: "inline", marginLeft: "10px", cursor: "pointer", position: "relative", top: "-1px"}} onClick={target.removeAssociatedInput.bind(null, data)}><i className="fa fa-times"></i></span>
                    </div>
                );
            }

            return (
                <div key={target.props.component_id+row.name+target.props.index} className="row" style={{marginBottom: "5px"}}>
                    <div style={{position: "absolute", left: "25%", width: "50%"}}><i className="fa fa-long-arrow-right"></i></div>

                    <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6" style={{textAlign: "center", paddingRight: "20px"}}>
                        {contentColLeft}
                    </div>

                    <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6"  style={{textAlign: "center"}}>
                        <div className="inputItem">
                            {row.type.map(function(type, index){
                                return (<span className='type' key={target.props.component_id+row.name+target.props.index+type+index}>{type}</span>);
                            })}
                            <span className="name label label-primary">{row.name}</span>
                        </div>
                    </div>
                </div>
            );
        },
        render: function(){
            var target = this;

            // This is if the block of a component would be too big because of the amount of inputs
            var collapsedInputs = "";
            var amountOfOptionalInputs = _.filter(this.props.inputs, function(row){
                return row.is_optional;
            }).length;

            if(amountOfOptionalInputs){
                var uniqueIdCollapseBlock = "optionalCollapse"+this.props.component_id+this.props.index;
                collapsedInputs = (
                    <div>
                        <a role="button" data-toggle="collapse" href={"#"+uniqueIdCollapseBlock} aria-expanded="false" aria-controls={uniqueIdCollapseBlock}>
                            Show optional inputs
                        </a>

                        <div className="collapse" id={uniqueIdCollapseBlock}>
                            {this.props.inputs.map(function(row){
                                if(row.is_optional){
                                    return target.renderInputWithData(row);
                                }else{
                                    return "";
                                }
                            })}
                        </div>
                    </div>
                );
            }

            return (
                <div>
                    {this.props.inputs.map(function(row){
                        if(!row.is_optional){
                            return target.renderInputWithData(row);
                        }else{
                            return "";
                        }
                    })}
                    {collapsedInputs}
                </div>
            );
        }
    });

    // Props :
    // - (array)outputs: The list of outputs the component is expecting
    // - (integer)index : Index of the component in the list of components
    // - (string)component_id : The id of the component
    // - (function)graphAddOutput : Callback to trigger when we need to add a cell on the graph
    // - (function)refreshFlow : Callback to trigger when we are done drawing in order to refresh the drawing of the flow
    var ComponentOutput = React.createClass({
        displayName: "ComponentOutput",
        componentDidMount: function(){
            var target = this;
            window.setTimeout(function(){
                target.props.refreshFlow();
            }, 300);
        },
        render: function(){
            var target = this;

            return (
                <div style={{wordWrap: "break-word"}}>
                    {this.props.outputs.map(function(row){
                        return (
                            <div key={target.props.component_id+row.name+target.props.index}
                                 className="inputItem"
                                 style={{display: "inline-block", marginLeft: "5px"}}
                                 onMouseDown={target.mousedown}>
                                {row.type.map(function(type, index){
                                    return (<span className='type' key={target.props.component_id+row.name+target.props.index+type+index}>{type}</span>);
                                })}
                                <span className="name label label-primary">{row.name}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }
    });
});
