var panelFlow;
var DATABASES = "databases";
var ADDDATABASE = 'databaseType';
var ADDSQLDATABASE = 'sqlForm';
var ADDNOSQLDATABASE = 'nosqlForm';
var SYNSCHEMA = 'syncSchema';
var UPDATESQLDATABASE = false;
var askedForPassword = false;
var currentDBId = false;

var currentAddDatabaseState = 0;
var firstTimeDisplayedDatabase = false;

dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader"], function(){
    initInterface();
    keys();

    function initInterface(){
        $('.masterLoading').remove();

        panelFlow = new PanelFlow('flowPanels', 'flowPanel');
        refreshPanelFlowSize();

        panelFlow.init();

        panelFlow.scrollToBlock("databases");

        function debouncer( func , timeout ) {
            var timeoutID , timeout = timeout || 200;
            return function () {
                var scope = this , args = arguments;
                clearTimeout( timeoutID );
                timeoutID = setTimeout( function () {
                    func.apply( scope , Array.prototype.slice.call( args ) );
                } , timeout );
            }
        }

        $(window).resize(debouncer( function ( e ) {
            refreshPanelFlowSize();
        }));
    }

    function refreshPanelFlowSize(){
        var topOfPage = $('#topOfPageForCalculation').offset().top;

        panelFlow.minHeight(($(window).height()-topOfPage)+'px');
        panelFlow.maxHeight(($(window).height()-topOfPage)+'px');
    }

    function keys(){
        KeyEventController.subscribeComponent("panelFlow", function(key){
            if(key == 27 || key == 38){
                //backAction();
                if(panelFlow.currentPanelNumber()>0){
                    panelFlow.scrollToBlock(panelFlow.currentPanelNumber()-1);
                }
            }
        });
    }

    function backAction(){
        panelFlow.scrollToBlock(panelFlow.currentPanelNumber());

        switch(panelFlow.currentPanel().blockId()){
            case ADDDATABASE:
                panelFlow.scrollToBlock(DATABASES);
                break;

            case ADDSQLDATABASE:
            case ADDNOSQLDATABASE:
                if(UPDATESQLDATABASE){
                    panelFlow.scrollToBlock(DATABASES);
                    UPDATESQLDATABASE = false;
                    $('.databaseForm').animate({ scrollTop: 0 }, "slow");
                }else{
                    $('.databaseForm').animate({ scrollTop: 0 }, "slow");
                    panelFlow.scrollToBlock(ADDDATABASE);
                }
                $('.databaseForm input').val('');
                $('.databaseForm select').find('option').eq(0).attr('selected', 'selected');
                $('.databaseForm .form-group').removeClass('has-error');
                $('.databaseForm .form-group').removeClass('has-feedback');
                break;
        }
    }

    ////////// REACT.JS //////////
    // Displays the list of databases owned by the user or shared with him/her
    var DatabaseList = React.createClass({
        getInitialState: function() {
            return {
                databases             : Array(),
                firstDataFetchingDone : false,
                orderType             : "modified_at",
                orderByDirection      : "desc",
                changingOrder         : false
            }
        },
        componentDidMount: function() {
            var target = this;

             // Fetch database list from the server
            Synchronise.Cloud.run("getListOfDatabase", {realtime: true}, {
                success: function(results){
                    if(results.databases.length){
                        panelFlow.scrollToBlock("databases");
                    }else{
                        panelFlow.scrollToBlock("noDatabase");
                    }
                    target.setState({
                        databases             : results.databases,
                        firstDataFetchingDone : true,
                        orderType             : results.settingsForOrdering.orderType,
                        orderByDirection      : results.settingsForOrdering.orderByDirection
                    });

                    $(ReactDOM.findDOMNode(target)).find('.infiniteLoading').animate({
                        opacity: 0
                    }, 500);

                    window.setTimeout(function(){
                        target.setState({changingOrder : false});
                    }, 500);
                },
                error: function(err){
                    new ModalErrorParse(err);
                }
            });
        },
        addDatabase: function(){
            panelFlow.scrollToBlock("databaseType");
        },
        orderingSelectorChange: function(component, type, DOMElement){
            var target = this;

            target.setState({changingOrder: true});

            switch(type){
                case "orderType":
                    target.setState({"orderType" : DOMElement.target.value});
                    break;

                case "orderByDirection":
                    target.setState({"orderByDirection" : DOMElement.target.value});
                    break;
            }

            Synchronise.Cloud.run("setSettingsForOrderingDatabase", {key: type, value: DOMElement.target.value}, {
                success: function(){ },
                error: function(err){
                    new ModalErrorParse(err);
                }
            });
        },
        render: function(){
            var target = this;

            var loader;
            if(!this.state.firstDataFetchingDone){
                loader = <Loader />;
            }else{
                loader = "";
            }

            var changingOrderLoader = "";
            if(this.state.changingOrder){
                changingOrderLoader = <InfiniteLoader/>;
            }

            var ordering = "";
            if(this.state.databases.length){
                ordering = (
                    <div>
                        <div className="col-lg-9 col-md-8 col-sm-12 col-xs-12" style={{textAlign: "right"}}>
                            {changingOrderLoader}
                        </div>

                        <div className="col-lg-3 col-md-4 col-sm-12 col-xs-12" style={{textAlign: "right"}}>
                            <form className="form-inline">
                                <select className="form-control" value={this.state.orderType} onChange={this.orderingSelectorChange.bind(null, this, "orderType")}>
                                    <option value="modified_at">Update date</option>
                                    <option value="created_at">Creation date</option>
                                    <option value="title">Title</option>
                                    <option value="subtype">Type</option>
                                    <option value="updating">Status</option>
                                </select>

                                <select className="form-control" value={this.state.orderByDirection} onChange={this.orderingSelectorChange.bind(null, this, "orderByDirection")}>
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </select>
                            </form>
                        </div>

                        <div className="col-xs-12">
                            <hr/>
                        </div>
                    </div>
                );
            }

            return (
                <div>
                    {ordering}

                    <div>
                        {loader}

                        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12 dbBlock">
                            <div className="content" onClick={this.addDatabase}>
                                <i className="fa fa-plus fa-3" style={{color: "darkgray", fontSize: "40px", lineHeight: "150px"}}></i>
                            </div>
                        </div>

                        {this.state.databases.map(function(database){
                            var updating = false;

                            return <DatabaseBlock key={database.id}
                                                  id_database={database.id}
                                                  update={target.updateCredentials}
                                                  refreshSchema={target.updateDatabaseSchema}/>;
                        })}
                    </div>
                </div>
            );
        }
    });

    // Displays a database block
    // (the square one with all the differents functions that cna be used to sync and modify a database)
    var DatabaseBlock = React.createClass({
        getInitialState: function(){
            var defaultState = {
                classNameContent                : "content",
                classNameForRefreshSchemaButton : "fa fa-refresh refreshSchema",
                styleForContent                 : {},
                removing                        : false,
                loading                         : false,

                title                           : "",
                type                            : "",
                updating                        : false
            };

            return defaultState;
        },
        componentDidMount: function(){
            var target = this;

            this.setState({classNameContent : "content display"});

            var icon = $(ReactDOM.findDOMNode(target)).find('img');
                icon.css('opacity', '0');

            $(icon).load(function() {
                $(this).animate({
                    opacity: 1
                }, 500);
            });

            target.setState({loading: true});

            Synchronise.Cloud.run("databaseObject", {id: target.props.id_database, realtime: true}, {
                success: function(data){
                    target.setState({title: data.title, type: data.subtype, updating: data.updating});
                },
                error: function(err){
                    new ModalErrorParse(err);
                },
                always: function(){
                    target.setState({loading: false});
                }
            });
        },
        removeDatabase: function(){
            if(!this.state.removing && !this.state.updating){
                this.setState({removing: true});

                var target = this;
                var DOMElement = $(ReactDOM.findDOMNode(this));

                DOMElement.animate({
                    opacity: 0.5
                }, 300);

                Synchronise.Cloud.run('removeDatabase', {databaseId: target.props.id_database}, {
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
                        new ModalErrorParse(error).title('Removing database');
                    },
                    abort: function(){
                        DOMElement.animate({
                            opacity: 1
                        }, 300);
                    },
                    always: function(){
                        target.setState({removing: false});
                    }
                });
            }
        },
        updateSchema: function(){
            var target = this;

            if(!this.state.updating){
                target.setState({updating: true});

                DatabaseFunctions.updateDatabase(this.props.id_database).then(function(){
                    window.setTimeout(function(){
                        // Animate the icon after a successfull sync
                        var element = $(ReactDOM.findDOMNode(target));
                        var icon = element.find('.refreshSchema');

                            icon.transit({
                               rotate3d : '0, 1, 0, 90deg'
                            }, function(){
                                icon.removeClass('fa-refresh');
                                icon.addClass('fa-check');
                                icon.css('color', 'green');

                                icon.transit({
                                   rotate3d : '0, 0, 0, 0deg'
                                }, function(){
                                    window.setTimeout(function(){
                                        icon.transit({
                                           rotate3d : '0, 1, 0, 90deg'
                                        }, function(){
                                            icon.removeClass('fa-check');
                                            icon.addClass('fa-refresh');
                                            icon.css('color', 'black');

                                            icon.transit({
                                               rotate3d : '0, 0, 0, 0deg'
                                           }, function(){
                                               target.setState({updating: false});
                                           });
                                        });
                                    }, 2000);
                                });
                            });
                    }, 300);
                }, function(err){
                    target.setState({updating: false});
                    new ModalErrorParse(err);
                });
            }
        },
        updateCredentials: function(){

        },
        render: function() {
            var classNameForRefreshSchemaButton = this.state.classNameForRefreshSchemaButton;
            var styleForContent = this.state.styleForContent;
            if(this.state.updating){
                classNameForRefreshSchemaButton = "fa fa-refresh fa-spin refreshSchema";
                styleForContent                 = { borderColor: "orange" };
            }

            var content = "";

            if(!this.state.loading){
                content = (
                    <div className={this.state.classNameContent} style={styleForContent}>
                        <i className="fa fa-cog updateDatabase" onClick={this.updateCredentials}></i>
                        <i className={classNameForRefreshSchemaButton} onClick={this.updateSchema}></i>
                        <i className="fa fa-trash removeDatabase" onClick={this.removeDatabase}></i>

                        <img src={'https://images.synchronise.io/databasesType/'+this.state.type+'-icon.png'} />
                        <h4 className="title">{this.state.title}</h4>

                        <div className="open">Open</div>
                    </div>
                );
            }else{
                content = (
                    <div className={this.state.classNameContent} style={styleForContent}>
                        <center><Loader/></center>
                    </div>
                );
            }

            return (
                <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12 dbBlock dbBlockFull databaseRow">
                    {content}
                </div>
            );
        }
    });

    // Displays a message to say that there is no databases registered at the moment
    var NoDatabaseBlock = React.createClass({
        addDatabase: function(){
            panelFlow.scrollToBlock(ADDDATABASE);
        },
        render: function(){
            return (
                <div className="row-fluid" align="center">
            		Oops, sounds like you haven't setup a database yet. Let's fix this now : <br/><br/>
            		<button className="btn btn-primary cbutton cbutton--effect-novak" onClick={this.addDatabase}>Add a new database</button>
            	</div>
            );
        }
    });

    // Displays the different types of databases
    var DatabaseTypes = React.createClass({
        getInitialState: function(){
            return {
                types : Array({
                    label               : "Relational Database",
                    type                : "sql",
                    image               : "mysql.png",
                    indexDefaultSubtype : 7, // Generic SQL
                    subtypes            : Array({
                        label: "IBM DB2",
                        value: "db2",
                        image: "db2.png"
                    }, {
                        label: "Microsoft Access",
                        value: "maccess",
                        image: "access.png"
                    }, {
                        label: "Microsoft SQL Server",
                        value: "msqlserver",
                        image: "mssql.png"
                    }, {
                        label: "MySQL",
                        value: "mysql",
                        image: "mysql.png"
                    }, {
                        label: "Oracle",
                        value: "oracle",
                        image: "oracle.png"
                    }, {
                        label: "PostgreSQL",
                        value: "postgre",
                        image: "postgre.png"
                    }, {
                        label: "SQLite",
                        value: "sqlite",
                        image: "sqlite.png"
                    }, {
                        label: "Generic SQL",
                        value: "sql",
                        image: "sql.png"
                    })
                }, {
                    label               : "Document store",
                    type                : "nosql",
                    image               : "mongo.png",
                    indexDefaultSubtype : 0, // MongoDB
                    subtypes            : Array({
                        label: "MongoDB",
                        value: "mongo",
                        image: "mongo.png"
                    },{
                        label: "CouchDB",
                        value: "couchdb",
                        image: "couchdb.png"
                    },{
                        label: "CouchBase",
                        value: "couchbase",
                        image: "couchbase.png"
                    })
                }, {
                    label               : "Key-value store",
                    type                : "keyvalue",
                    image               : "redis.png",
                    indexDefaultSubtype : 0, // Redis
                    subtypes            : Array({
                        label: "Redis",
                        value: "redis",
                        image: "redis.png"
                    },{
                        label: "Memcached",
                        value: "memcached",
                        image: "memcached.png"
                    })
                })
            };
        },
        cancel: function(){
            panelFlow.scrollToBlock(DATABASES);
        },
        render: function(){
            return (
                <div>
                    <div className="row-fluid">
                        <br/>
                    </div>

                    <div className="row-fluid databaseTypesBlocksList">
                        {this.state.types.map(function(item){
                            return <DatabaseTypesBlock label={item.label}
                                                       type={item.type}
                                                       image={item.image}
                                                       subtypes={item.subtypes}
                                                       indexDefaultSubtype={item.indexDefaultSubtype}
                                                       key={"databaseBlockType"+item.type} />
                        })}
                    </div>

                    <div className="row">
                        <div className="col-xs-12">
                            <hr/>
                        </div>
                    </div>

                    <div className="row" align="center">
                        <div className="col-xs-12">
                            <a className="btn btn-default cbutton cbutton--effect-novak" onClick={this.cancel}>Cancel</a>
                        </div>
                    </div>
                </div>
            );
        }
    });

    // Display a block of type of database (SQL, No-SQL, Virtual ...)
    var DatabaseTypesBlock = React.createClass({
        goToForm: function(){
            ReactDOM.render(<DatabaseForm masterType={this.props.type}
                                       titleTypeDatabase={this.props.type+" database"}
                                       subtypesDatabases={this.props.subtypes}
                                       saved={this.savedDatabase}
                                       indexDefaultSubtypeDatabase={this.props.indexDefaultSubtype}/>, document.getElementById("databaseForm"));
            panelFlow.scrollToBlock("databaseForm");
        },
        savedDatabase: function(){
            ReactDOM.unmountComponentAtNode(document.getElementById('databaseForm'));
        },
        componentDidMount: function(){
            var target = this;

            var icon = $(ReactDOM.findDOMNode(target)).find('img');
                icon.css('opacity', '0');

            $(icon).load(function() {
                $(this).animate({
                    opacity: 1
                }, 500);
            });
        },
        render: function(){
            return (
                <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12" onClick={this.goToForm}>
                    <div className="panel panel-default">
                        <div className="panel-heading">{this.props.label}</div>

                        <div className="panel-body">
                            <img src={"/images/"+this.props.image} height="54px" />
                        </div>
                    </div>
                </div>
            );
        }
    });

    // Displays a form to add or update the information of a database
    var DatabaseForm = React.createClass({
        getInitialState: function(){
            var target = this;

            var states = {
                valuesFields: { // Contains the value of the fields
                    title    : "",
                    name     : "",
                    url      : "",
                    username : "",
                    password : "",
                    port     : "",
                    limit    : ""
                },
                classesForFields : { // Contains the specific classes to display for the fields (has-error, has-feedback ...)
                    title    : "",
                    name     : "",
                    url      : "",
                    username : "",
                    password : "",
                    port     : "",
                    limit    : ""
                },
                selectedSubtype : this.props.subtypesDatabases[0], // Current selected database subtype (mysql, mongo ...)
                canSave         : true, // Whether the data in the form are compliant to the rules
                saving          : false, // Tells if the form is currently saving the data
                incorrectFields : Array() // List of fields that are currently not complying with their rules
            };

            // Set the default values if given
            if(typeof(target.props.valuesFields) != "undefined"){
                state.valuesFields = target.props.valuesFields;
            }

            return states;
        },
        // The user has selected a database subtype
        selectedDatabaseSubtype: function(selectedItem){
            this.setState({
                selectedSubtype: selectedItem
            });
        },
        // The user has given a connection string for a database
        dataForFormPasted: function(data){
            // Select subtype
            var selectedSubtype = false;
            // Try to find the given database type in the list
            _.each(this.props.subtypesDatabases, function(row){
                if(row.value == data.type){
                    selectedSubtype = row;
                }
            });

            // We could not find the type of the database given
            // Default one is the last one of the list of subtypes
            if(!selectedSubtype){
                selectedSubtype = this.props.subtypesDatabases[this.props.indexDefaultSubtypeDatabase];
            }

            var valuesFields = this.state.valuesFields;
                valuesFields.name = data.name;
                valuesFields.url = data.url;
                valuesFields.username = data.username;
                valuesFields.password = data.password;

            if(data.port){ // If the connection string given by the user contained also a connection port we include it
                valuesFields.port = data.port;
            }

            this.setState({
                selectedSubtype : selectedSubtype,
                valuesFields    : valuesFields
            });

            this.checkFields();
        },
        handleInput: function(item, e){
            // Save the new value of the field
            var valuesFields = this.state.valuesFields;
                valuesFields[item] = e.target.value;

            this.setState({ valuesFields : valuesFields });
            this.checkFields();
        },
        checkFields: function(){
            var target = this;
            var fieldsToCheck = Array('title', 'name', 'url', 'username', 'password');
            var incorrectFields = Array();
            var readyToGo = true; // Assume we can save at first
            var domNode = $(ReactDOM.findDOMNode(target));

            _.each(fieldsToCheck, function(item){
                if(target.state.valuesFields[item].length>0){
                    target.state.classesForFields[item] = "";
                }else{
                    incorrectFields.push(item);
                    readyToGo = false;
                    target.state.classesForFields[item] = "has-error has-feedback";
                }
            });

            var port = target.state.valuesFields["port"];
            if(port.length){
                if((port % 1 === 0) && port > 0){
                    target.state.classesForFields["port"] = "";
                }else{
                    readyToGo = false;
                    incorrectFields.push("port");
                    target.state.classesForFields["port"] = "has-error has-feedback";
                }
            }else{
                target.state.classesForFields["port"] = "";
            }

            var limit = target.state.valuesFields["limit"];
            if(limit.length){
                if((limit % 1 === 0)  && limit > 0){
                    target.state.classesForFields["limit"] = "";
                }else{
                    readyToGo = false;
                    incorrectFields.push("limit");
                    target.state.classesForFields["limit"] = "has-error has-feedback";
                }
            }else{
                target.state.classesForFields["limit"] = "";
            }

            target.setState({
                canSave         : readyToGo,
                incorrectFields : incorrectFields
            });
        },
        cancel: function(){
            panelFlow.scrollToBlock("databaseType");
            var timeoutUnmountComponent = window.setTimeout(function(){
                ReactDOM.unmountComponentAtNode(document.getElementById('databaseForm'));
                window.clearTimeout(timeoutUnmountComponent);
            }, 500);
        },
        save: function(){
            var target = this;
                target.checkFields();

            if(!target.state.saving){
                target.setState({saving : true});

                // There are fields that needs some fixing before we can submit the data
                if(!target.state.canSave){
                    // We scroll the screen to the first incorrect field
                    var componentDOMElement = $(ReactDOM.findDOMNode(target));
                    var fieldToScrollToDOMElement = componentDOMElement.find('.' + target.state.incorrectFields[0]);

                    // Center the view to the first field that is incorrect
                    /*componentDOMElement.animate({
                        scrollTop: (fieldToScrollToDOMElement.position().top)+(componentDOMElement.height()/2)+(fieldToScrollToDOMElement.height()/2)
                    }, 500);*/

                    target.setState({saving: false});
                }else{
                    // We send the information to the server
                    Synchronise.Cloud.run("addUpdateDatabaseCredentials", {
                        title         : target.state.valuesFields["title"],
                        name          : target.state.valuesFields["name"],
                        url           : target.state.valuesFields["url"],
                        username      : target.state.valuesFields["username"],
                        password      : target.state.valuesFields["password"],
                        port          : target.state.valuesFields["port"],
                        limit         : target.state.valuesFields["limit"],
                        type          : target.state.selectedSubtype.value,
                        masterType    : target.props.masterType,

                        realtime      : false
                    }, {
                        success: function(message){
                            target.setState({saving: false});
                            panelFlow.scrollToBlock("databases");
                            target.props.saved();
                            // Notify the parent that we have saved. The parent will apply a new key to the component, therefore it will reset to initialstate of component
                        },
                        error: function(error){
                            target.setState({saving: false});
                            new ModalErrorParse(error);
                        }
                    });
                }
            }else{
                // We have to deny the saving because it is already saving
                $(ReactDOM.findDOMNode(target)).find('.saveButton').effect("highlight");
            }
        },
        render: function(){
            var labelForSavingButton = "Save";
            if(this.state.saving){
                labelForSavingButton = "Saving ..."
            }

            return (
                <div>
                    <div className="row" style={{textAlign:"center"}}>
                        <div className="col-xs-12">
                            <small>The credentials displayed below are transferred securely through SSL to your browser and decrypted using the password you gave us when you first signed-up. Your identity is saved locally in your browser by a unique token which is automatically removed at the end of your session. Your password is the only phrase capable of decrypting the passwords and therefore you should always keep it secret. If you want to discover about how we make our service safe and secure go to <a href="/security" alt="Security">Security</a></small>
                        </div>
                    </div>

                	<div className="row-fluid">
                        <div className="col-xs-12">
                            <legend>{this.props.titleTypeDatabase.charAt(0).toUpperCase()+this.props.titleTypeDatabase.slice(1)}</legend>
                        </div>

                        <div className="col-xs-12">
                            Have a database connection string ? Copy paste it in the input below to populate the form automatically.<br/>
                            {<DatabaseFormAutoPopulateField dataPasted={this.dataForFormPasted}/>}<br/>
                        </div>

                        <div className="col-xs-12" id="databaseSubtypes">
                            {<DatabaseFormSubTypeSelector subtypesDatabases={this.props.subtypesDatabases}
                                                          onSelect={this.selectedDatabaseSubtype}
                                                          selectedItem={this.state.selectedSubtype} />}
                        </div>
                		<div className="col-xs-12">
                            <form>
                                <div className={"form-group " + this.state.classesForFields["title"]}>
                                    <label>Database title</label>
                                    <input type="text"
                                           placeholder="Give a nice title to your database to remember it."
                                           className="form-control title"
                                           autoComplete="off"
                                           onChange={this.handleInput.bind(null, "title")}
                                           value={this.state.valuesFields["title"]} />
                                </div>
                                <hr/>
                                <div className={"form-group " + this.state.classesForFields["name"]}>
                                    <label>Name</label>
                                    <input type="text"
                                           placeholder="The name your database is it called on the server"
                                           className="form-control name"
                                           autoComplete="off"
                                           onChange={this.handleInput.bind(null, "name")}
                                           value={this.state.valuesFields["name"]} />
                                </div>
                                <div className={"form-group " + this.state.classesForFields["url"]}>
                                    <label>Url</label>
                                    <input type="text"
                                           placeholder="Url/IP of the database"
                                           className="form-control url"
                                           autoComplete="off"
                                           onChange={this.handleInput.bind(null, "url")}
                                           value={this.state.valuesFields["url"]} />
                                </div>
                                <div className={"form-group " + this.state.classesForFields["username"]}>
                                    <label>User</label>
                                    <input type="text"
                                           placeholder="Username of the database"
                                           className="form-control username"
                                           autoComplete="off"
                                           onChange={this.handleInput.bind(null, "username")}
                                           value={this.state.valuesFields["username"]} />
                                </div>
                                <div className={"form-group " + this.state.classesForFields["password"]}>
                                    <label>Password</label>
                                    <input type="password"
                                           placeholder="Password of the database"
                                           className="form-control password"
                                           autoComplete="off"
                                           onChange={this.handleInput.bind(null, "password")}
                                           value={this.state.valuesFields["password"]} />
                                </div>
                                <div className={"form-group " + this.state.classesForFields["port"]}>
                                    <label>Port</label>
                                    <input type="text"
                                           placeholder="Leave empty for default (3306)"
                                           className="form-control port"
                                           autoComplete="off"
                                           onChange={this.handleInput.bind(null, "port")}
                                           value={this.state.valuesFields["port"]} />
                                </div>
                                <div className={"form-group " + this.state.classesForFields["limit"]}>
                                    <label>Concurrent connection</label>
                                    <input type="text"
                                           placeholder="Leave empty for default (1)"
                                           className="form-control limit"
                                           autoComplete="off"
                                           onChange={this.handleInput.bind(null, "limit")}
                                           value={this.state.valuesFields["limit"]} />
                                    <small>The more concurrent connection the faster and more scalable your app or website will be. If your database is already used by one of your app or website you should allow at least one connection slot for it. Please check with your database provider for more info on your limit of concurrent connection.</small>
                                </div>
                            </form>

                            <div className="row buttonAddDatabase" style={{textAlign:"center"}}>
                                <button className="btn btn-default cbutton cbutton--effect-novak saveButton" onClick={this.save}>{labelForSavingButton}</button>
                                <button className="btn btn-default cbutton cbutton--effect-novak" onClick={this.cancel}>Back</button>
                            </div>

                            <div className="row-fluid">
                            	<br/>
                            </div>
                    	</div>
                	</div>
                </div>
            );
        }
    });

    // Displays the list of database subtypes (mysql, postgre ...) available for a specific database type (sql, nosql)
    var DatabaseFormSubTypeSelector = React.createClass({
        selected: function(item){
            var itemNumber = 0;
            _.each(this.props.subtypesDatabases, function(row, index){
                if(row.value == item.value){
                    itemNumber = index;
                }
            });
            this.props.onSelect(item);
        },
        render: function(){
            var target = this;

            return (
                <div>
                {
                    this.props.subtypesDatabases.map(function(item, index){
                        var isSelected = false;
                        if(target.props.selectedItem.value == item.value){
                            isSelected = true;
                        }
                        return (<DatabaseFormSubTypeItem value={item.value}
                                                         label={item.label}
                                                         image={item.image}
                                                         selected={target.selected.bind(null, item)}
                                                         isSelected={isSelected}
                                                         key={"subtypeOption"+item.value} />);
                    })
                }
                </div>
            );
        }
    });

    // Display an item of database form subtypes selector
    var DatabaseFormSubTypeItem = React.createClass({
        render: function(){
            var isSelectedClass = "";
            if(this.props.isSelected){
                isSelectedClass = "active";
            }

            return (
                <div className={"panel panel-default col-md-2 databaseSubtype "+ isSelectedClass} onClick={this.props.selected}>
                  <div className="panel-body">
                    <img src={"https://images.synchronise.io/databasesType/"+this.props.image} width="100px" />
                    {this.props.label}
                  </div>
                </div>
            );
        }
    });

    var DatabaseFormAutoPopulateField = React.createClass({
        getInitialState: function(){
            return {
                inputValue      : "",
                validationState : ""
            }
        },
        handleInput: function(input){
            var regex = /^(mysql|oracle|postgresql|sqlserver|sqlite|db2|mongo|couchdb|couchbase|redis|memcached.*):\/\/([A-Za-z0-9%_-]+):([A-Za-z0-9%]+)@(((?:https?:\/\/)?[\da-z\.-]+\.[a-z\.]{2,6}[\/\w \.-]*)(?::([0-9]{1,5}))?\/([a-z0-9%_-]+))(?:\?reconnect=(true|false))?$/;

            this.setState({
                inputValue: input.target.value
            });

            if(!input.target.value.length){
                this.setState({
                    validationState : ""
                });
            }else{
                var check = regex.exec(input.target.value);
                if(check){
                    this.setState({
                        validationState: "has-success"
                    });
                    var data = {
                        type     : check[1],
                        username : check[2],
                        password : check[3],
                        url      : check[5],
                        port     : check[6],
                        name     : check[7]
                    };
                    this.props.dataPasted(data);
                }else{
                    this.setState({
                        validationState: "has-error"
                    });
                    $(ReactDOM.findDOMNode(this)).find('input').effect("shake");
                }
            }
        },
        render: function(){
            return (
                <div className={"form-group " + this.state.validationState}>
                    <input type="text"
                           className="form-control"
                           placeholder="dbtype://username:password@url/dbname:port"
                           onChange={this.handleInput}
                           value={this.state.inputValue} />
                </div>
            );
        }
    });

    ReactDOM.render(<DatabaseList className="row" />, document.getElementById('databaseList'));
    ReactDOM.render(<DatabaseTypes/>, document.getElementById("databaseType"));
    ReactDOM.render(<NoDatabaseBlock/>, document.getElementById("noDatabase"));
});
