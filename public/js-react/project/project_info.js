var ProjectModalInfo;

dependenciesLoader(["React", "ReactDOM", "_", "Loader"], function(){
    ProjectModalInfo = React.createClass({
        getInitialState: function(){
            return {
                iconUrl              : "/images/defaultProjectIcon.png",
                defaultProjectIcon   : "/images/defaultProjectIcon.png",
                iconFile             : false,
                name                 : "",
                url                  : "",
                description          : "",
                loading              : true,
                saving               : false,
                inputValueValidation : {
                    "name": {
                        typingHasStarted   : false,
                        valueCorrect       : false,
                        valueAcceptedRegex : "",
                        required           : true,
                        className          : ""
                    },
                    "url": {
                        typingHasStarted   : false,
                        valueCorrect       : true,
                        valueAcceptedRegex : /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi ,
                        required           : false,
                        className          : ""
                    },
                    "description": {
                        typingHasStarted   : false,
                        valueCorrect       : true,
                        valueAcceptedRegex : "",
                        required           : false,
                        className          : ""
                    }
                }
            };
        },
        componentDidMount: function(){
            var target = this;
            // Load data for project from server
            if(this.props.id_project){
                Synchronise.Cloud.run("getProject", {id_project: this.props.id_project, realtime: true}, {
                    success: function(project){
                        if(target.isMounted()){
                            target.setState({
                                name        : project.name,
                                url         : project.url,
                                description : project.description,
                                loading     : false
                            });
                            if(project.icon){
                                target.setState({
                                    iconUrl : project.icon
                                });
                            }else{
                                target.setState({
                                    iconUrl : target.state.defaultProjectIcon
                                });
                            }
                            var inputValueValidation = target.state.inputValueValidation;
                            inputValueValidation["name"].valueCorrect = true;
                            target.setState({
                                inputValueValidation: inputValueValidation
                            });
                        }
                    },
                    error: function(err){
                        target.setState({
                            loading : false
                        });
                        new ModalErrorParse(err, function(){
                            target.closeModal();
                        });
                    }
                });
            }else{
                target.setState({
                    loading: false
                });
            }
        },
        displayFilePickerForIcon: function(){
            $(ReactDOM.findDOMNode(this)).find('.iconGroup input[type=file]').trigger('click');
        },
        iconFileSelected: function(e){
            var target = this;
            var input = $(e.target);
            var files = input.prop("files");
            if(files && files[0]){
                target.setState({
                    iconFile: files
                });

                var reader = new FileReader();
                    reader.onload = function(e){
                        target.setState({
                            iconUrl: e.target.result
                        });
                        var icon = $(ReactDOM.findDOMNode(target)).find('.icon');
                        icon.css('opacity', '0');

                        $(icon).load(function() {
                            $(this).animate({
                                opacity: 1
                            }, 500);
                        });
                    };
                reader.readAsDataURL(files[0]);
            }
        },
        handleChangeInputs: function(field, e) {
            var nextState    = {};
                nextState[field] = e.target.value;

            var inputs       = this.state.inputValueValidation;
            var currentField = inputs[field];
                currentField.valueCorrect = true; // Assume it is correct before validation
                currentField.typingHasStarted = true;

            if(currentField.valueAcceptedRegex){
                var regex = new RegExp(currentField.valueAcceptedRegex);
                currentField.valueCorrect = e.target.value.match(regex);
            }

            if(currentField.required && !e.target.value.length){
                currentField.valueCorrect = false;
            }else if(!currentField.required && !e.target.value.length){
                currentField.valueCorrect = true;
            }

            if(!currentField.valueCorrect){
                currentField.className = "has-error has-feedback";
            }else{
                currentField.className = "";
            }

            inputs[field] = currentField;
            nextState["inputValueValidation"] = inputs;

            this.setState(nextState);
        },
        validate: function(){
            var target  = this;

            var canSave = true;
            // If any of the fields are not correct, we cannot save
            _.each(this.state.inputValueValidation, function(item){
                if(!item.valueCorrect){
                    canSave = false;
                }
            });

            if(canSave){
                this.setState({
                    saving : true
                });

                var data = {};
                if(this.props.id_project){
                    data.id_project = this.props.id_project;
                }

                data.name        = this.state["name"];
                data.url         = this.state["url"];
                data.description = this.state["description"];

                if(this.state.iconFile){
                    Synchronise.File.upload(this.state.iconFile, "synchroniseio-projects-icons", {
                        success: function(urls){
                            data.icon = urls[0].url;
                            target.setState({iconUrl: urls[0].url});
                            execute();
                        }
                    });
                }else{
                    data.icon = target.state.iconUrl;
                    execute();
                }

                function execute(){
                    Synchronise.Cloud.run("createOrUpdateProject", data, {
                        success: function(){
                            target.setState({
                                saving: false
                            });
                            target.props.closeModal();
                            window.Intercom('update');
                        },
                        error: function(){
                            new ModalErrorParse(err, function(){
                                target.setState({
                                    saving: false
                                });
                            });
                        }
                    });
                }
            }
        },
        render: function(){
            var labelForValidateButton;
            var validateButtonDisable = "";
            if(this.state.saving){
                labelForValidateButton = this.props.validateButtonLabelActive;
                validateButtonDisable = "disabled";
            }else{
                labelForValidateButton = this.props.validateButtonLabel;
            }

            var content = "";
            var button = "";
            if(this.state.loading){
                content = <Loader />;
                button = ("");
            }else{
                /* If the user can edit or is the owner then let him edit the fields */
                if(this.props.permissions.own || this.props.permissions.edit){
                    content = (
                        <form>
                            <div className="form-group iconGroup">
                                <img src={this.state.iconUrl} className="icon" />
                                <div className="editProjectIcon"
                                     onClick={this.displayFilePickerForIcon}>Edit project icon</div>
                                <input type="file"
                                       accept="image/png, image/gif, image/jpeg"
                                       onChange={this.iconFileSelected} />
                            </div>

                            <div className={"form-group " + this.state.inputValueValidation["name"].className}>
                                <label>Name</label>
                                <input type="input"
                                       className="form-control"
                                       value={this.state.name}
                                       onChange={this.handleChangeInputs.bind(this, 'name')}/>
                            </div>

                            <div className={"form-group " + this.state.inputValueValidation["url"].className}>
                                <label>Url</label>
                                <input type="input"
                                       className="form-control"
                                       value={this.state.url}
                                       onChange={this.handleChangeInputs.bind(this, 'url')} />
                            </div>

                            <div className={"form-group " + this.state.inputValueValidation["description"].className}>
                                <label>Description</label>
                                <textarea className="form-control"
                                          value={this.state.description}
                                          onChange={this.handleChangeInputs.bind(this, 'description')} />
                            </div>
                        </form>
                    );
                    button = (
                        <button className="btn btn-primary cbutton cbutton--effect-novak"
                            onClick={this.validate}
                            disabled={validateButtonDisable}>{labelForValidateButton}</button>
                    );
                } else {
                    content = (
                        <form>
                            <div className="form-group iconGroup">
                                <img src={this.state.iconUrl} className="icon" />
                            </div>

                            <div className={"form-group " + this.state.inputValueValidation["name"].className}>
                                <label>Name</label>
                                <div>{this.state.name}</div>
                            </div>

                            <div className={"form-group " + this.state.inputValueValidation["url"].className}>
                                <label>Url</label>
                                <div>{this.state.url}</div>
                            </div>

                            <div className={"form-group " + this.state.inputValueValidation["description"].className}>
                                <label>Description</label>
                                <div>{this.state.description}</div>
                            </div>
                        </form>
                    );
                    button = ("");
                }
            }

            return (
                <div role="tabpanel" className={"tab-pane fade in " + this.props.state}  id="info">
                    <div className="row-fluid">
                        <div className="col-lg-3 col-md-2 hidden-sm hidden-xs"></div>

                        <div className="col-lg-6 col-md-8 col-sm-12 col-xs-12">{content}</div>

                        <div className="col-lg-3 col-md-2 hidden-sm hidden-xs"></div>

                        <div className="row">
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 footerButtons">
                                {button}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    });
});
