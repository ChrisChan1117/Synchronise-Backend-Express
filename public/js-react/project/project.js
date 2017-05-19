(function(){
    dependenciesLoader(["React", "ReactDOM", "Synchronise", "Typeahead", "Loader", "ProjectModalInfo", "ProjectModalTeam", "ProjectModalStore"], function(){
        // Display the list of projects
        var ProjectsList = React.createClass({
            getInitialState: function(){
                return {
                    projects : [],
                    loading  : true
                };
            },
            componentDidMount: function(){
                var target = this;

                Synchronise.Cloud.run("projectList", {realtime: true, cacheFirst: true}, {
                    success: function(projects){
                        var projectsNew = _.each(projects, function(item){
                            if(!item.icon){
                                item.icon = "/images/defaultProjectIcon.png";
                            }
                        });

                        target.setState({
                            projects : projectsNew,
                            loading  : false
                        });

                        Intercom('update');
                    }
                });

                // Loads the list of known relationship with the current user.
                // This includes all the people he/she has already talked to, worked with in a common project, or invited
                Synchronise.Cloud.run("getUserConnections", {realtime: true, user_object: true}, {
                    success: function(members){
                        _.each(members, function(member){
                            member.text = member.name + " (" + member.email + ")" ;
                            member.value = member.email;
                        });
                        if(target.isMounted()){
                            target.setState({
                                listOfKnownPeople: members
                            });
                        }

                    }
                });

                // We should display the modal for new project already
                if(urlH.getParam('displayModalCreate')){
                    collectInputForProjectAndReturn(false);
                }
            },
            createProject: function(){
                collectInputForProjectAndReturn(false);
            },
            render: function(){
                var target = this;
                var loading = "";
                if(this.state.loading){
                    loading = <Loader />;
                }

                var separator = "";
                if(this.state.projects.length ||
                   this.state.loading){
                    separator = (
                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <hr/>
                                <br/>
                            </div>
                        </div>
                    );
                }

                return (
                    <div>
                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <center><p>All the components and workflows you create on Synchronise can be stored in a <b>project</b>. You can add your colleagues to a project to give them access to the components and worflows you created.</p></center><br/>
                                <center><button className="btn btn-primary cbutton cbutton--effect-novak" onClick={this.createProject}>Create new project</button></center>
                            </div>
                        </div>

                        {separator}

                        <div className="">
                            <div className="row projectsList" align="center">
                                {loading}
                                {this.state.projects.map(function(item){
                                    return <ProjectBlock id_project={item.id}
                                                         description={item.description}
                                                         icon={item.icon}
                                                         url={item.url}
                                                         name={item.name}
                                                         permissions={item.permissions}
                                                         key={"project"+item.id}
                                                         bg_color={item.bg_color}
                                                         txt_color={item.txt_color}
                                                         flt_color={item.flt_color}
                                                         knownUsers={target.state.listOfKnownPeople}/>
                                })}
                            </div>
                        </div>
                    </div>
                );
            }
        });

        // Display a project block on the interface
        // Props :
        // - (string)id_project  : The unique ID of the project
        // - (object)permissions : The permissions of the current user in regards to the project
        // - (object)knownUsers  : The list of users that the current user has been interacting with already in the past
        // - (string)description : The description of the project
        // - (string)url         : The url of the project
        // - (string)icon        : The icon of the project
        // - (string)name        : The name of the project
        // - (string)bg_color    : The background color of the project
        // - (string)txt_color   : The text color of the project
        // - (string)flt_color   : The filter to apply to the project
        var ProjectBlock = React.createClass({
            getInitialState: function(){
                return {
                    contentClassName : ""
                }
            },
            settings: function(){
                collectInputForProjectAndReturn(this.props.id_project, "info", this.props.permissions, this.props.knownUsers);
            },
            team: function(){
                collectInputForProjectAndReturn(this.props.id_project, "team", this.props.permissions, this.props.knownUsers);
            },
            delete: function(){
                var target = this;
                var DOMElement = $(ReactDOM.findDOMNode(target));

                new ModalConfirm("You are about to delete this project. This include all the Components and Workflows attached to it and any other material that you have created. Are you sure you want to do this ?", function(confirm){
                    if(confirm){
                        DOMElement.animate({
                            opacity: 0.5
                        }, 300);

                        Synchronise.Cloud.run("removeProject", {id_project: target.props.id_project}, {
                            success: function(){
                                DOMElement.animate({
                                    width: "0px",
                                    opacity: 0
                                }, 300);
                            },
                            error: function(error){
                                DOMElement.animate({
                                    opacity: 1
                                }, 300);
                                new ModalErrorParse(error).title('Removing project');
                            }
                        });
                    }
                });
            },
            componentDidMount: function(){
                this.setState({contentClassName : "display"});

                var icon = $(ReactDOM.findDOMNode(this)).find('.icon');
                    icon.css('opacity', '0');

                $(icon).load(function() {
                    $(this).animate({
                        opacity: 1
                    }, 500);
                });
            },
            openProjectUrl: function(){
                var url = this.props.url;
                if(url.indexOf("http://") == -1 && url.indexOf("https://") == -1){
                    url = "http://" + url;
                }
                window.open(url, '_blank');
            },
            render: function(){
                var description = "";
                if(this.props.description){
                    description = <small className="hidden-xs" style={{color:this.props.txt_color+"!important"}}>{this.props.description}</small>;
                }

                var url = "";
                if(this.props.url){
                    url = <small className="hidden-xs"><a onClick={this.openProjectUrl} target="_blank" style={{color:this.props.txt_color+"!important", cursor: "pointer"}}>{this.props.url}</a></small>
                }

                var deleteContent = "";
                var sharedRibbon = "";
                var infoButton = "";
                if(this.props.permissions.own){
                    infoButton = (<div className="settings" onClick={this.settings}><i className="fa fa-cog"></i></div>);
                    deleteContent = (<div className="delete" onClick={this.delete}><i className="fa fa-trash"></i></div>);
                }else{
                    sharedRibbon = (<div className="isSharedRibbon"></div>);
                }

                return (
                    <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12 project" align="center">
                        <div className={"content card "+this.state.contentClassName} style={{backgroundColor: this.props.bg_color, color: this.props.txt_color}}>
                            {infoButton}
                            {deleteContent}
                            <div className="team" onClick={this.team}><i className="fa fa-users"></i></div>

                            <img className="icon" src={this.props.icon} />
                            <h3 style={{color:this.props.txt_color}}>{this.props.name}</h3>
                            {description}
                            <span style={{color:this.props.txt_color}}>{url}</span>
                            {sharedRibbon}
                        </div>
                    </div>
                );
            }
        });

        // Display a ProjectModal and uses callbacks once completed or aborted
        function collectInputForProjectAndReturn(idProject, tab, permissions, knownUsers){
            var tabsState = {
                info : "",
                team : "",
                store: ""
            };

            /* if there is no permission passed a new project is being created, so the user will have the owner permissions */
            permissions = permissions || {
                view  : true,
                edit  : true,
                own   : true
            };

            if(permissions.own){
                tabsState.info = "active";
            }else{
                tabsState.team = "active";
            }

            if(typeof(tab) != "undefined"){
                _.each(Object.keys(tabsState), function(item){
                    tabsState[item] = "";
                });

                tabsState[tab] = "active";
            }

            ReactDOM.render(<ProjectModal id_project={idProject}
                                          title="Project"
                                          tabsState={tabsState}
                                          permissions={permissions}
                                          knownUsers={knownUsers}/>, document.getElementById("projectModal"));
        }

        var ProjectModal = React.createClass({
            getInitialState: function(){
                return {
                    componentDisplayed : false
                };
            },
            componentDidMount: function(){
                var target = this;
                // Close modal on click on the dark background around it

                $(ReactDOM.findDOMNode(target).parentNode).bind("click touchstart", function(e){
                    if(e.target.id == "projectModal"){
                        target.closeModal();
                    }
                });
                // Close modal on esc
                KeyEventController.subscribeComponent("collectInputForProjectAndReturn", function(key){
                    if(key == 27){
                        target.closeModal();
                    }
                });

                $(ReactDOM.findDOMNode(target).parentNode).addClass('fadeInBackground');

                var item = window.setTimeout(function(){
                    $(ReactDOM.findDOMNode(target)).addClass('slideInProject');
                    /*if(target.isMounted()){
                        target.setState({
                            componentDisplayed : true
                        });

                    }*/
                    window.clearTimeout(item);
                }, 300);
            },
            closeModal: function(){
                var target = this;
                if(target.isMounted()){
                    $(ReactDOM.findDOMNode(target)).addClass('slideOutProject');
                    window.setTimeout(function(){
                        $(ReactDOM.findDOMNode(target).parentNode).addClass('fadeOutBackground');
                        window.setTimeout(function(){
                            $(ReactDOM.findDOMNode(target).parentNode).removeClass('fadeOutBackground fadeInBackground');
                            ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(target).parentNode);
                        }, 500);
                    }, 300);
                    // Unsubscribe to the esc key event
                    KeyEventController.unsubscribeComponent("collectInputForProjectAndReturn");
                }
             },
            render: function(){

                var tabs = "";
                if(this.props.id_project){
                    tabs = <TabsForProjectModal tabsState={this.props.tabsState} permissions={this.props.permissions} />;
                }

                var projectInfo = "";
                var projectMarketPlace = "";
                if(this.props.permissions.own == true){
                    projectInfo = (
                        <ProjectModalInfo state={this.props.tabsState.info}
                                          id_project={this.props.id_project}
                                          closeModal={this.closeModal}
                                          permissions={this.props.permissions}
                                          validateButtonLabel="Save"
                                          validateButtonLabelActive="Saving ..."/>
                    );

                    projectMarketPlace = (
                        <ProjectModalStore state={this.props.tabsState.store}
                                           permissions={this.props.permissions}
                                           id_project={this.props.id_project}
                                           closeModal={this.closeModal}/>
                    );
                }

                var tabsContent = (
                        <div className="tab-content">
                            {projectInfo}
                            <ProjectModalTeam state={this.props.tabsState.team}
                                              permissions={this.props.permissions}
                                              id_project={this.props.id_project}
                                              closeModal={this.closeModal}
                                              knownUsers={this.props.knownUsers}/>
                            {projectMarketPlace}
                        </div>
                    );

                return (
                    <div className="content" ref="projectModal">
                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <i className="fa fa-times pull-right" onClick={this.closeModal}></i>
                            </div>
                        </div>

                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <legend>{this.props.title}</legend>
                            </div>
                        </div>

                        {tabs} {tabsContent}
                    </div>
                );
            }
        });

        // Display a modal to create or update the data of a project
        // - (object)permissions: permissions of the user for the current object
        var TabsForProjectModal = React.createClass({
            render: function(){
                var classNameInfo = this.props.tabsState.info;
                var classNameTeam = this.props.tabsState.team;
                var classNameStore = this.props.tabsState.store;

                var infoTab = "";
                var marketplaceTab = "";
                if(this.props.permissions.own == true){
                    infoTab = (<li style={{float: "none", display: "inline-block"}} role="projectModal" className={classNameInfo}><a href="#info" aria-controls="info" role="tab" data-toggle="tab">Info</a></li>);
                    marketplaceTab = (<li style={{float: "none", display: "inline-block"}} role="projectModal" className={classNameStore}><a href="#store" aria-controls="store" role="tab" data-toggle="tab">Marketplace</a></li>);
                }

                return (
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 tabsModal">
                        <ul className="nav nav-tabs" role="tablist" style={{textAlign: "center"}}>
                            {infoTab}
                            <li style={{float: "none", display: "inline-block"}} role="projectModal" className={classNameTeam}><a href="#team" aria-controls="team" role="tab" data-toggle="tab">Team</a></li>
                            {marketplaceTab}
                        </ul>
                    </div>
                );
            }
        });

        ReactDOM.render(<ProjectsList/>, document.getElementById("projectsList"));
    });
}());
