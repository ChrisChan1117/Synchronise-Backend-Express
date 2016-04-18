var ProjectsList;
var ProjectItem;

dependenciesLoader(["React", "ReactDOM", "$", "Loader"], function(){
    // Display the list of projects
    // Props :
    // - (object)items                  : The list of items created by the user
    // - (object)targetOnCreate         : The callback to trigger when the user want to create a new item for the current project
    // - (function)targetOnClick        : The callback to trigger when an item is clicked
    // - (function)targetOnRemove       : The callback to trigger when an item is attempted to be removed
    // - (boolean)shouldCreate          : Wether or not to display and trigger the callback when the create button is clicked
    // - (boolean)shouldRemove          : Wether or not to display and trigger the callback when the delete an item of project
    // - (boolean)shouldClick           : Wether or not to trigger the callback when when we click on an item of project
    // - (function)shouldDisplayProject : Callback to determine if a project should be displayed or not. The callback receives a project object and should simply return true or false
    ProjectsList = React.createClass({
        displayName: "ProjectsList",
        getInitialState: function(){
            return {
                projects    : Array(),
                loading     : true,
                openedBlock : ""
            };
        },
        componentDidMount: function(){
            var target = this;

            Synchronise.Cloud.run("projectList", {realtime: true, cacheFirst: true}, {
                success: function(projects){
                    if(target.isMounted()){
                        target.setState({
                            projects : projects,
                            loading  : false
                        });
                    }

                    if(urlH.getParam("projectOpened")){
                        target.open(urlH.getParam("projectOpened"));
                    }
                },
                error: function(err){
                    new ModalErrorParse(err);
                },
                always: function(){
                    if(target.isMounted()){
                        target.setState({loading : false});
                    }
                }
            });
        },
        createProject: function(){
            document.location.href="/project?backuri=" + encodeURIComponent("/query") + "&backlabel=" + encodeURIComponent("Back to query") + "&displayModalCreate=true";
        },
        open: function(id){
            var target = this;
                target.setState({openedBlock: id});

            KeyEventController.subscribeComponent("projectOpened", function(key){
                if(key == 27){
                    target.setState({openedBlock: ""});
                    urlH.insertParam("projectOpened", "");
                    KeyEventController.unsubscribeComponent("projectOpened");
                }
            });

            window.requestAnimationFrame(function(){
                if($('[id="' + id + '"]').offset()){
                    $("html, body").animate({ scrollTop: $('[id="' + id + '"]').offset().top-100 }, 300);
                    urlH.insertParam("projectOpened", id);
                }
            });
        },
        close: function(){
            var target = this;
                target.setState({openedBlock: ""});
            KeyEventController.unsubscribeComponent("projectOpened");

            urlH.insertParam("projectOpened", "");
        },
        onCreateItem: function(data){
            if(this.props.shouldCreate || typeof(this.props.shouldCreate) == "undefined"){
                this.props.targetOnCreate(data);
            }
        },
        onClickItem: function(data){
            if(this.props.shouldClick || typeof(this.props.shouldClick) == "undefined"){
                this.props.targetOnClick(data);
            }
        },
        onRemoveItem: function(data){
            if(this.props.shouldRemove || typeof(this.props.shouldRemove) == "undefined"){
                this.props.targetOnRemove(data);
            }
        },
        render: function(){
            var target = this;

            var loading = "";
            if(this.state.loading){
                loading = (<Loader/>);
            }

            return (
                <div>
                    {loading}
                    <div className="row projectsList" align="center">
                        {this.state.projects.map(function(item){
                            var shouldDisplayProject = true;

                            if(typeof(target.props.shouldDisplayProject) != "undefined"){
                                shouldDisplayProject = target.props.shouldDisplayProject(item);
                            }

                            if(shouldDisplayProject){
                                return <ProjectBlock id={item.id}
                                                     description={item.description}
                                                     icon={item.icon}
                                                     url={item.url}
                                                     name={item.name}
                                                     permissions={item.permissions}
                                                     bg_color={item.bg_color}
                                                     txt_color={item.txt_color}
                                                     flt_color={item.flt_color}
                                                     wantsToOpen={target.open}
                                                     close={target.close}
                                                     opened={(target.state.openedBlock == item.id)}
                                                     items={_.filter(target.props.items, function(row){
                                                        return (row.id_project == item.id)
                                                     })}
                                                     targetOnCreate={target.onCreateItem.bind(null, item.id)}
                                                     targetOnClick={target.onClickItem}
                                                     targetOnRemove={target.onRemoveItem}
                                                     shouldCreate={target.props.shouldCreate}
                                                     shouldClick={target.props.shouldClick}
                                                     shouldRemove={target.props.shouldRemove}
                                                     key={"project"+item.id} />
                            }
                        })}
                    </div>
                </div>
            );
        }
    });

    // Display a project block on the interface
    // Props
    // - (string)icon             : The icon of the project
    // - (string)id               : The ID of the project
    // - (string)name             : The name of the project
    // - (string)description      : The Description of the project
    // - (string)url              : The URL of the project
    // - (object)permissions      : The permissions of the project in regards to the current user
    // - (boolean)opened          : Whether the project is currently opened on the screen or not
    // - (object)items            : The list of components associated to this project
    // - (function)wantsToOpen    : Notifies the parent React component that the current project wants to be opened on the screen
    // - (function)close          : Notifies the parent React component that the current project wants to be closed
    // - (function)targetOnClick  : The callback to trigger when an item is clicked
    // - (function)targetOnRemove : The callback to trigger when an item is attempted to be removed
    // - (boolean)shouldCreate    : Wether or not to display and trigger the callback when the create button is clicked
    // - (boolean)shouldRemove    : Wether or not to display and trigger the callback when the delete an item of project
    // - (boolean)shouldClick     : Wether or not to trigger the callback when when we click on an item of project
    var ProjectBlock = React.createClass({
        displayName: "ProjectBlock",
        getInitialState: function(){
            var icon = "https://images.synchronise.io/defaultProjectIcon.png";
            if(this.props.icon){
                icon = this.props.icon;
            }

            return {
                iconUrl          : icon,
                contentClassName : ""
            }
        },
        open: function(){
            var target = this;
            this.props.wantsToOpen(this.props.id);
        },
        componentDidMount: function(){
            this.setState({contentClassName : "display"});

            $(ReactDOM.findDOMNode(this)).find('.icon').load(function(){
                $(this).animate({opacity: 1});
            });
        },
        createComponent: function(){
            createComponent(this.props.id);
        },
        render: function(){
            var target = this;

            var description = "";
            if(this.props.description){
                description = <small className="hidden-xs" style={{color:this.props.txt_color}}>{this.props.description}</small>;
            }

            var url = "";
            if(this.props.url){
                url = <small className="hidden-xs"><a href={this.props.url} target="_blank" style={{color:this.props.txt_color}}>{this.props.url}</a></small>
            }

            var sharedRibbon = "";
            if(!this.props.permissions.own){
                sharedRibbon = <div className="isSharedRibbon"></div>;
            }

            var openedClass = "";
            if(this.props.opened){
                openedClass = "openedProject";
            }

            // Project closed
            var content = (
                <div>
                    <img className="icon" src={this.state.iconUrl} />
                    <h3 style={{color:this.props.txt_color}}>{this.props.name}</h3>
                    {description}
                    {url}
                    {sharedRibbon}
                    <div className="open" onClick={this.open} style={{color:this.props.txt_color, borderColor:this.props.txt_color}}>Open</div>
                    <span className="amountOfItems" style={{borderColor: this.props.txt_color, color: this.props.txt_color}}>{this.props.items.length} <i className="fa fa-puzzle-piece"></i></span>
                </div>
            );

            // Project opened
            if(this.props.opened){ // Remove the open button
                var componentsList = (
                    <div className="table-responsive">
                        <table className="table" style={{background: "white"}}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Created</th>
                                    <th>Last update</th>
                                    <th>Identifier</th>
                                    <th style={{textAlign: "center"}}>Status</th>
                                    <th>Owned</th>
                                </tr>
                            </thead>

                            <tbody>
                                {this.props.items.map(function(row){
                                    var statusPublication = 0;
                                    if(row.published){
                                        if(row.approved){
                                            statusPublication = 2; // Published
                                        }else{
                                            if(!row.rejected){
                                                statusPublication = 1; // Pending
                                            }else{
                                                statusPublication = 3; // Rejected
                                            }
                                        }
                                    }

                                    return <ProjectItem id={row.id}
                                                        owned={row.user_id == Synchronise.User.current().id}
                                                        key={row.id+target.props.id}
                                                        created={row.created_at}
                                                        lastUpdate={row.modified_at}
                                                        identifier={row.id}
                                                        statusPublication={statusPublication}
                                                        targetOnClick={target.props.targetOnClick.bind(null, row.id)}
                                                        targetOnRemove={target.props.targetOnRemove.bind(null, row.id)}
                                                        shouldClick={target.props.shouldClick}
                                                        shouldRemove={target.props.shouldRemove}
                                                        name={row.name}/>
                                })}
                            </tbody>
                        </table>
                    </div>
                );

                var createContent = "";
                if(this.props.shouldCreate || typeof(this.props.shouldCreate) == "undefined"){
                    createContent = (<div className="hidden-xs" style={{textAlign:"center", position: "absolute", left: "55px", top: "13px"}}><button className="btn btn-primary btn-sm" onClick={target.props.targetOnCreate}>Create new</button></div>);
                }

                content = (
                    <div className="container-fluid">
                        <div className="row-fluid">
                            <div className="col-xs-12">
                                <img className="icon" src={this.state.iconUrl} />
                                <h3 style={{color:this.props.txt_color}}>{this.props.name}</h3>
                                {description}
                                {url}
                                {sharedRibbon}
                                <center><button className="btn btn-primary btn-sm visible-xs" onClick={target.props.targetOnCreate}>Create new</button></center>
                                {componentsList}
                                {createContent}
                                <span className="close" onClick={this.props.close} style={{color:this.props.txt_color}}><i className="fa fa-times"></i></span>
                                <span className="amountOfItems" style={{color:this.props.txt_color, borderColor: this.props.txt_color}}>{this.props.items.length} <i className="fa fa-puzzle-piece"></i></span>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className={"col-lg-3 col-md-4 col-sm-6 col-xs-12 project " + openedClass} align="center" id={this.props.id}>
                    <div className={"content card " + this.state.contentClassName} style={{backgroundColor: this.props.bg_color, color: this.props.txt_color}}>
                        {content}
                    </div>
                </div>
            );
        }
    });

    // Displays a row for a Project in the table of component
    // Params :
    // - (string)id               : Id of the component
    // - (string)name             : The name of the component
    // - (string)created          : The date when the component was created
    // - (string)lastUpdate       : The date when the component was last updated
    // - (string)identifier       : The unique identifier of the component
    // - (integer)statusPublication: The status of the publication of the element on the market place
    // - (function)targetOnClick  : The callback to trigger when the item is clicked
    // - (function)targetOnRemove : The callback to trigger when an item is attempted to be removed
    // - (boolean)shouldRemove    : Wether or not to display and trigger the callback when the delete an item of project
    // - (boolean)shouldClick     : Wether or not to trigger the callback when when we click on an item of project
    ProjectItem = React.createClass({
        displayName: "ProjectItem",
        getInitialState: function(){
            return {removing: false};
        },
        selectAllIdentifier: function(){
            $(ReactDOM.findDOMNode(this)).find('input').select();
        },
        targetOnClick: function(data, event){
            if(this.props.shouldClick || typeof(this.props.shouldClick) == "undefined"){
                this.props.targetOnClick(data, event);
            }
        },
        render: function(){
            var style = {};
            if(this.state.removing){
                style.opacity = 0.3;
            }

            var removeContent = (<td></td>);
            if((this.props.shouldRemove || typeof(this.props.shouldRemove) == "undefined") && this.props.owned){
                removeContent = (<td style={{textAlign:"center"}} onClick={this.props.targetOnRemove}><i className="fa fa-times"></i></td>);
            }

            var labelForMarketPlace = "";
            switch (this.props.statusPublication) {
                case 0: // Not published
                    labelForMarketPlace = (<label className="label label-default">Not published</label>);
                    break;

                case 1: // Pending approval
                    labelForMarketPlace = (<label className="label label-primary">Pending approval</label>);
                    break;

                case 2: // Published
                    labelForMarketPlace = (<label className="label label-success">Published</label>);
                    break;

                case 3: // Rejected
                    labelForMarketPlace = (<label className="label label-danger">Reject</label>);
                    break;

                case 4: // Deploying
                    labelForMarketPlace = (<label className="label label-warning">Deploying</label>);
                    break;

                default: // Not published
                    labelForMarketPlace = (<label className="label label-default">Not published</label>);
                    break;
            }

            var ownedLabel = "";
            if(this.props.owned){
                ownedLabel = (<span style={{color: "green"}}>yes</span>);
            }else{
                ownedLabel = (<span style={{color: "red"}}>no</span>);
            }

            return (
                <tr className="itemRow" style={style}>
                    <td onClick={this.targetOnClick} style={{textAlign: "left"}}>{this.props.name}</td>
                    <td onClick={this.targetOnClick} style={{textAlign: "left"}}><TimeAgo date={new Date(this.props.created)}/></td>
                    <td onClick={this.targetOnClick} style={{textAlign: "left"}}><TimeAgo date={new Date(this.props.lastUpdate)}/></td>
                    <td onClick={this.selectAllIdentifier} style={{textAlign: "left"}}><input type="text"
                                                                                              defaultValue={this.props.identifier}
                                                                                              readOnly
                                                                                              className="form-control input-xs"
                                                                                              style={{
                                                                                                   fontFamily : "'Courier New', Courier, monospace",
                                                                                                   fontSize   : "15px",
                                                                                                   height     : "20px"
                                                                                              }}/></td>
                    <td style={{textAlign: "center"}}>{labelForMarketPlace}</td>
                    <td>{ownedLabel}</td>
                    {removeContent}
                </tr>
            );
        }
    });

});
