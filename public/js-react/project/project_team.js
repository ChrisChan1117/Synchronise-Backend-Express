var ProjectModalTeam;
dependenciesLoader(["React", "ReactDOM", "_", "Loader"], function(){
    ProjectModalTeam = React.createClass({
        getInitialState: function(){
            return {
                teamMembers         : [],
                listOfKnownPeople   : [],
                loading             : true,
                addingMember        : false,
                addMemberPermission : 'view',
                valueInputAddMember : '',
                leaving             : false
            }
        },
        componentDidMount: function(){
            var target = this;
            // Load the list of members allowed to access this project
            if(this.props.id_project){
                Synchronise.Cloud.run("teamMembersForProject", {id_project: this.props.id_project, realtime: true}, {
                    success: function(members){
                        if(target.isMounted()){
                            target.setState({
                                teamMembers  : members,
                                loading      : false
                            });
                        }

                    },
                    error: function(){
                        if(target.isMounted()){
                            target.setState({
                                loading : false
                            });
                        }
                    }
                });
            }

            this.setState({
                listOfKnownPeople: this.props.knownUsers
            });
        },
        memberSelected: function(item){
            var target = this;

            if(!this.state.addingMember){
                target.setState({
                    addingMember: true
                });

                var string = "";
                if(typeof(item) == "string"){
                    string = item;
                }else{
                    string = item.item.email;
                }
                var permissions = {
                    view  : false,
                    edit  : false,
                    own   : false
                };

                if(typeof(permissions[this.state.addMemberPermission]) != "undefined"){
                    permissions[this.state.addMemberPermission] = true;
                }
                Synchronise.Cloud.run("addMemberToProject", {searchString: string, permissions: permissions, id_project: this.props.id_project}, {
                    always: function(){
                        target.setState({
                            addingMember        : false,
                            valueInputAddMember : ''
                        });
                    },
                    error: function(err){
                        console.log(err);
                        function validateEmail(email) {
                            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            return re.test(email);
                        }

                        // The user we are trying to associate is not registered
                        if(err.error == "undefinedUser"){
                            if(validateEmail(string)){
                                new ModalConfirm("The user your are trying to add is not registered yet. Would you like to invite that person ?", function(confirm){
                                    if(confirm){

                                    }
                                });
                            }else{
                                new ModalErrorParse("You are trying to add an incorrect user. Please type the email address of a user or type a name to get suggestions.");
                            }
                        }else{
                            new ModalErrorParse(err);
                        }
                    },
                    success: function(){
                    }
                });
            }
        },
        selectAddMemberPermissionChange : function(e){
            var target = this;
            var value = e.target.value;
            if(value == "own"){
                new ModalConfirm("You are about to give the owner permission to that user. You will no longer have the right to administrate this project if you continue. Are you sure you want to do this ?", function(confirm){
                    if(confirm){
                        target.setState({
                            addMemberPermission: value
                        });
                    }else{
                        target.setState({
                            addMemberPermission: 'view'
                        });
                    }
                });
            }else{
                this.setState({
                    addMemberPermission: value
                });
            }
        },
        closeModal: function(){
            this.props.closeModal();
        },
        leaveProject: function(){
            var target = this;
            this.setState({
                leaving: true
            });

            Synchronise.Cloud.run("leaveProject", {id_project:this.props.id_project}, {
                success: function(){
                    target.closeModal();
                },
                error: function(err){
                    new ModalErrorParse(err);
                },
                always : function(){
                    if(target.isMounted()){
                        target.setState({
                            leaving: false
                        });
                    }
                }
            });
        },
        render: function(){
            var target = this;
            var labelForLeaveButton;
            var addMember;
            var membersContent = "";
            var leaveProjectButton;
            var addingMemberLoader = "";
            if(this.state.leaving){
                labelForLeaveButton = "Leaving Project...";
            } else {
                labelForLeaveButton = "Leave Project";
            }

            if(this.state.teamMembers.length){
                membersContent = (
                    <div>
                        <div className="col-xs-12">
                            <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Permission</th>
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.teamMembers.map(function(item){
                                    return (<ProjectModalTeamMember item={item}
                                                                    id_project={target.props.id_project}
                                                                    id_user={item.id}
                                                                    key={"member"+item.id}
                                                                    permissions={target.props.permissions}
                                                                    closeModal={target.props.closeModal}/>);
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }

            /* If the current user is the owner he can add new users to the project but can't quit. */
            if(this.props.permissions.own){
                addMember = (
                    <div>
                    <div className="col-xs-12">
                        <div className="col-lg-10">
                            <Typeahead type="text"
                                       className="form-control input-lg"
                                       placeholder="Type an email address or the name of someone you already know"
                                       value = {this.state.valueInputAddMember}
                                       options={this.state.listOfKnownPeople}
                                       onSelected={this.memberSelected}
                                       /*onChange={this.inputAddMemberChange}*/
                                       ref="addMemberInput" />
                            {addingMemberLoader}
                        </div>

                        <div className="col-lg-2">
                            <select className="form-control input-lg" style={{lineHeight: '30px'}} onChange={this.selectAddMemberPermissionChange} defaultValue="view">
                              <option value="view">View</option>
                              <option value="edit">Modify</option>
                            </select>
                        </div>

                    </div>
                    <div className="col-xs-12">
                        <hr />
                    </div>
                    </div>
                );
                leaveProjectButton = "";
            } else {
                addMember = "";
                leaveProjectButton = (
                    <div>
                        <center><button className="btn btn-warning cbutton cbutton--effect-novak" disabled={this.state.leaving} onClick={this.leaveProject}>{labelForLeaveButton}</button></center>
                    </div>
                );
            }

            if(this.state.loading){
                membersContent = <Loader />;
            }


            if(this.state.addingMember){
                addingMemberLoader = <InfiniteLoader />;
            }

            return (
                <div role="tabpanel" className={"tab-pane fade in team " + this.props.state} id="team">
                    {addMember}
                    {membersContent}
                    {leaveProjectButton}
                </div>
            );
        }
    });

    var ProjectModalTeamMember = React.createClass({
        getInitialState: function(){
            return {
                loading : false
            };
        },
        changeMemberPermission: function(e){
            var target = this;
            var valueForSelect = "";
            var select = e.target;
            var newPermissions = e.target.value;
            var permissions = {
                view  : false,
                edit  : false,
                own   : false
            };
            switch(newPermissions){
                case "own":
                    permissions.view = true;
                    permissions.edit = true;
                    permissions.own = true;
                    break;
                case "edit":
                    permissions.view = true;
                    permissions.edit = true;
                    break;
                case "view":
                    permissions.view = true;
                    break;
            }

            if(newPermissions == "own"){
                new ModalConfirm("You are about to give the owner permission to that user. You will no longer have the right to administrate this project if you continue. Are you sure you want to do this ?", function(confirm){
                    if(confirm){
                        Synchronise.Cloud.run("changeMemberPermissionsForProject", {id_project:target.props.id_project, id_team_member:target.props.id_user, permissions:permissions}, {
                            success: function(){
                                target.closeModal();
                            },
                            error: function(err){
                            },
                            always: function(permissions){
                            }
                        });
                    }else{
                        _.each(Object.keys(target.props.item.permissions), function(current){
                            if(target.props.item.permissions[current]){
                                valueForSelect = current;
                            }
                        });
                        select.value = valueForSelect;
                    }
                });
            }else{
                Synchronise.Cloud.run("changeMemberPermissionsForProject", {id_project:this.props.id_project, id_team_member:this.props.id_user, permissions:permissions}, {
                    success: function(){
                    },
                    error: function(err){
                    },
                    always: function(permissions){
                    }
                });
            }
        },
        closeModal: function(){
            this.props.closeModal();
        },
        removeMember: function(){
            var target = this;

            if(!target.state.loading){
                target.setState({
                    loading : true
                });
                var element = $(ReactDOM.findDOMNode(target));
                    element.animate({
                        opacity: 0.3
                    }, 300);
                Synchronise.Cloud.run("removeTeamMemberFromProject", {id_project:this.props.id_project, id_team_member:this.props.id_user}, {
                    success: function(){
                        element.slideUp();
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                        element.animate({
                            opacity: 1
                        }, 300);
                    },
                    always : function(){
                        target.setState({
                            loading: false
                        });
                    }
                });
            }
        },
        render: function(){
            var target         = this;
            var selectContent  = "";
            var valueForSelect = "";
            var removeContent  = "";
            _.each(Object.keys(target.props.item.permissions), function(current){
                if(target.props.item.permissions[current]){
                    valueForSelect = current;
                }
            });

            // If the current member display is not already the owner of the project, we can display the option 'owner'
            if(!target.props.item.permissions.own){
                /* If the active user is the project owner then display the delete button, otherwise nothing.
                Also display a select to set the permissions.*/
                if(this.props.permissions.own){
                    removeContent = (
                        <i className="fa fa-trash-o" onClick={target.removeMember} style={{fontSize: '20px'}}></i>
                    );
                    selectContent = (
                        <select className="form-control" defaultValue={valueForSelect} onChange={this.changeMemberPermission}>
                            <option value="view">View</option>
                            <option value="edit">Edit</option>
                            <option value="own">Owner</option>
                        </select>
                    );
                } else {
                    removeContent = "";
                    selectContent = (<span style={{textTransform: "capitalize"}}>{valueForSelect}</span>);
                }
            }else{
                selectContent = "Owner";
                removeContent = "";
            }

            return (
                <tr className="member">
                    <td>{target.props.item.name}</td>
                    <td>{target.props.item.email}</td>
                    <td>
                        {selectContent}
                    </td>
                    <td style={{textAlign:'center'}} className="delete">
                        {removeContent}
                    </td>
                </tr>
            );
        }
    });
});
