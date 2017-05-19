(function(){
    dependenciesLoader(["$", "Mousetrap", "React", "ReactDOM", "Loader"], function(){
        // Display the list of projects
        var ProjectsList = React.createClass({
            getInitialState: function(){
                return {
                    projects : Array(),
                    loading  : true
                }
            },
            componentDidMount: function(){
                var target = this;
                Synchronise.Cloud.run("projectList", {realtime: true}, {
                    success: function(projects){
                        target.setState({
                            projects : projects,
                            loading  : false
                        });
                    },
                    error: function(){
                        target.setState({
                            loading  : false
                        });
                    }
                });
            },
            createProject: function(){
                document.location.href="/project?backuri=" + encodeURIComponent("/query") + "&backlabel=" + encodeURIComponent("Back to query") + "&displayModalCreate=true";
            },
            render: function(){
                var loading = "";
                if(this.state.loading){
                    loading = <Loader/>
                }

                var bottomSeparator = "";
                if(this.state.projects.length){
                    bottomSeparator = (
                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <hr/><br/>
                            </div>
                        </div>
                    );
                }

                return (
                    <div>
                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <center><p>All the queries you create on Synchronise.IO are stored in a <b>project</b>. This allows you to arrange your queries into their specific context. Projects have their own settings which you can change in order to match your needs.</p></center><br/>
                                <center><button className="btn btn-primary cbutton cbutton--effect-novak" onClick={this.createProject}>Create new project</button></center>
                            </div>
                        </div>

                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <hr/><br/>
                            </div>
                        </div>

                        {loading}

                        <div className="row projectsList" align="center">
                            {this.state.projects.map(function(item){
                                return <ProjectBlock id={item.id}
                                                     description={item.description}
                                                     icon={item.icon}
                                                     url={item.url}
                                                     name={item.name}
                                                     permissions={item.permissions}
                                                     key={"project"+item.id} />
                            })}
                        </div>

                        {bottomSeparator}
                    </div>
                );
            }
        });

        // Display a project block on the interface
        var ProjectBlock = React.createClass({
            getInitialState: function(){
                var icon = "/images/defaultProjectIcon.png";
                if(this.props.icon){
                    icon = this.props.icon;
                }

                return {
                    iconUrl          : icon,
                    contentClassName : ""
                }
            },
            open: function(){
                document.location.href= "/query/project?id=" + this.props.id;
            },
            componentDidMount: function(){
                this.setState({contentClassName : "display"});
            },
            render: function(){
                var description = "";
                if(this.props.description){
                    description = <small className="hidden-xs">{this.props.description}</small>;
                }

                var url = "";
                if(this.props.url){
                    url = <small className="hidden-xs"><a href={this.props.url} target="_blank">{this.props.url}</a></small>
                }

                var sharedRibbon = "";
                if(!this.props.permissions.own){
                    sharedRibbon = <div className="isSharedRibbon"></div>;
                }

                return (
                    <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12 project" align="center">
                        <div className={"content " + this.state.contentClassName}>
                            <img className="icon" src={this.state.iconUrl} />
                            <h3>{this.props.name}</h3>
                            {description}
                            {url}
                            {sharedRibbon}
                            <div className="open" onClick={this.open}>Open</div>
                        </div>
                    </div>
                );
            }
        });

        ReactDOM.render(<ProjectsList />, document.getElementById("projectsList"));
    });
}());
