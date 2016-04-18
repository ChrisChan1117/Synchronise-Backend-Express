dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function(){
    // This creates and populates a fake database for development purposes
    var RecordsPopulate = React.createClass({
        displayName: "RecordsPopulate",
        getInitialState: function(){
            return {
                loading: false,
                loadingWL: false,
                emailField: "",
                emailFieldWL: "",
                emailForPermission: "",
                searchingForPermissions: false,
                permissionsForUser: [],
                permissionToAdd: "",
                savingPermission: false,
                changingPlanForUser: false,
                emailForPlan: "",
                planToSet: ""
            };
        },
        emailFieldChange: function(name, e){
            if(!this.state.loading){
                var data = {};
                    data[name] = e.target.value;
                this.setState(data);
            }
        },
        populate: function(){
            var target = this;

            if(!target.state.loading){
                target.setState({ loading : true });

                Synchronise.Cloud.run("superadminPopulateDatabase", {email: target.state.emailField}, {
                    success: function(){
                        target.setState({ emailField: "" });
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    progress: function(progress, message){
                        console.log("Progress : " + JSON.stringify(progress) + " - Message : " + JSON.stringify(message));
                    },
                    always: function(){
                        target.setState({loading: false});
                    }
                });
            }
        },
        populateWL: function(){
            var target = this;

            if(!target.state.loadingWL){
                target.setState({ loadingWL : true});

                Synchronise.Cloud.run("superadminPopulateWhiteList", {email: target.state.emailFieldWL}, {
                    success: function(){
                        target.setState({ emailFieldWL: "" });
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    progress: function(progress, message){
                        console.log("Progress : " + JSON.stringify(progress) + " - Message : " + JSON.stringify(message));
                    },
                    always: function(){
                        target.setState({loadingWL: false});
                    }
                });
            }
        },
        findPermissionsForUser: function(){
            if(!this.state.searchingForPermissions) {
                var target = this;
                    target.setState({searchingForPermissions: true});

                Synchronise.Cloud.run("userObject", {user_id: target.state.emailForPermission}, {
                    success: function(user){
                        target.setState({permissionsForUser: user.roles});
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({searchingForPermissions: false});
                    }
                });
            }
        },
        // Save the email field for permission finder
        emailForPermissionChanged: function(event){
            var target = this;
                target.setState({emailForPermission: event.target.value});
        },
        removePermissionForUser: function(permissionObject){
            if(!this.state.searchingForPermissions) {
                var target = this;
                    target.setState({searchingForPermissions: true});

                Synchronise.Cloud.run("superadminRemovePermissionForUser", {id_role: permissionObject.id, id_user: target.state.emailForPermission}, {
                    success: function(){
                        target.findPermissionsForUser();
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({searchingForPermissions: true});
                    }
                });
            }
        },
        addPermissionForUser: function(){
            if(!this.state.savingPermission){
                var target = this;
                    target.setState({savingPermission: true});

                if(target.state.emailForPermission.length && target.state.permissionToAdd.length){
                    Synchronise.Cloud.run("superadminAddPermissionForUser", {role_name: target.state.permissionToAdd, id_user: target.state.emailForPermission}, {
                        success: function(){
                            target.findPermissionsForUser();
                        },
                        error: function(err){
                            new ModalErrorParse(err);
                        },
                        always: function(){
                            target.setState({savingPermission: false});
                        }
                    });
                }
            }
        },
        permissionToAddChange: function(event){
            var target = this;
                target.setState({permissionToAdd: event.target.value});
        },
        emailForPlanChanged: function(event){
            var target = this;
                target.setState({emailForPlan: event.target.value});
        },
        changePlanForUser: function(){
            var target = this;
            if(!target.state.changingPlanForUser){
                target.setState({changingPlanForUser: true});

                Synchronise.Cloud.run("superadminChangePlanForUser", {email_user: target.state.emailForPlan, plan: target.state.planToSet}, {
                    success: function(){
                        target.setState({emailForPlan: "", planToSet: ""});
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({changingPlanForUser: false});
                    }
                });
            }
        },
        planToSetChanged: function(event){
            var target = this;
                target.setState({planToSet: event.target.value});
        },
        render: function(){
            var target = this;

            var populateButtonLabel = "Populate";
            if(this.state.loading){
                populateButtonLabel = "Populating ...";
            }

            var populateButtonLabelWL = "Populate";
            if(this.state.loadingWL){
                populateButtonLabelWL = "Populating ...";
            }

            var findPermissionsButtonLabel = "Find permissions for user";
            if (this.state.searchingForPermissions) {
                findPermissionsButtonLabel = "Searching...";
            }

            var addPermissionsButtonLabel = "Add new permission";
            var changePlanButtonLabel     = "Change plan";

            if(this.state.changingPlanForUser){
                changePlanButtonLabel = "Saving...";
            }

            return (
                <div className="row-fluid">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 card">
                        <div className="row-fluid">
                            <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                                <form className="form-horizontal">
                                    <div className="form-group">
                                        <label htmlFor="emailField">Users permissions</label>
                                        <input id="emailField"
                                               type="text"
                                               placeholder="Email address of the user"
                                               className="form-control"
                                               value={this.state.emailForPermission}
                                               onChange={this.emailForPermissionChanged}/>
                                        {this.state.permissionsForUser.map(function(permission){
                                            return (<label className="label label-primary" style={{marginLeft: "5px"}}>{permission.name} <i className="fa fa-times" onClick={target.removePermissionForUser.bind(null, permission)}></i></label>);
                                        })}
                                    </div>
                               </form>
                            </div>

                            <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12"
                                 style={{textAlign: "center"}}>
                                <button className="btn btn-primary cbutton cbutton--effect-novak"
                                        onClick={this.findPermissionsForUser}>
                                        <i className="fa fa-refresh hidden fa-spin"></i> <span className="label">{findPermissionsButtonLabel}</span>
                                </button>
                            </div>
                        </div>

                        <div className="row-fluid">
                            <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                                <form className="form-horizontal">
                                    <div className="form-group">
                                        <input id="emailField"
                                               type="text"
                                               placeholder="Permission to add"
                                               className="form-control"
                                               value={this.state.permissionToAdd}
                                               onChange={this.permissionToAddChange}/>
                                    </div>
                               </form>
                            </div>

                            <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12"
                                 style={{textAlign: "center"}}>
                                <button className="btn btn-primary cbutton cbutton--effect-novak"
                                        onClick={this.addPermissionForUser}>
                                        <i className="fa fa-refresh hidden fa-spin"></i> <span className="label">{addPermissionsButtonLabel}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 card">
                        <div className="row-fluid">
                            <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                                <form className="form-horizontal">
                                    <div className="form-group">
                                        <label htmlFor="emailField">User plan</label>
                                        <input id="emailField"
                                               type="text"
                                               placeholder="Email address of the user"
                                               className="form-control"
                                               value={this.state.emailForPlan}
                                               onChange={this.emailForPlanChanged}/>
                                    </div>
                               </form>
                            </div>

                            <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12"
                                 style={{textAlign: "center"}}>
                                <button className="btn btn-primary cbutton cbutton--effect-novak"
                                        onClick={this.changePlanForUser}>
                                        <i className="fa fa-refresh hidden fa-spin"></i> <span className="label">{changePlanButtonLabel}</span>
                                </button>
                            </div>
                        </div>

                        <div className="row-fluid">
                            <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                                <form className="form-horizontal">
                                    <div className="form-group">
                                        <input id="emailField"
                                               type="text"
                                               placeholder="Plan to set"
                                               className="form-control"
                                               value={this.state.planToSet}
                                               onChange={this.planToSetChanged}/>
                                    </div>
                               </form>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    });

    var isAllowedThisSection;
    _.each(Synchronise.User.current().roles, function(row){
        if(row.name == "superadmin"
        || row.name == "admin"){
            isAllowedThisSection = true;
        }
    });

    if(isAllowedThisSection){
        ReactDOM.render(<RecordsPopulate/>, document.getElementById("recordsPopulate"));
    }
});
