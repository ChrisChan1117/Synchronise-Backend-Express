dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function(){
    var Realtime = React.createClass({
        displayName: "Realtime",
        getInitialState: function(){
            return {
                subscriptions       : [],
                loading             : false,
                saving              : false,
                isExportingToJSON   : false,
                isImportingFromJSON : false,
                fieldsForNew        : [],
                roomForNew          : "",
                subForNew           : ""
            };
        },
        componentDidMount: function(){
            var target = this;
                target.setState({loading: true});

            Synchronise.Cloud.run("listOfRealtimeSubscriptions", {realtime: true}, {
                success: function(data){
                    target.setState({subscriptions: _.sortBy(data, function(row){
                        return row.room;
                    })});
                },
                error: function(err){
                    new ModalErrorParse(err);
                },
                always: function(){
                    target.setState({loading: false});
                }
            });
        },
        fieldChange: function(fieldName, event){
            var data = {};
                data[fieldName] = event.target.value;

            this.setState(data);
        },
        addNewField: function(fieldName, optionalValue){
            var field = {name: fieldName};
            if(optionalValue){
                field.value = optionalValue;
            }

            var currentFields = this.state.fieldsForNew;
            var alreadyExists = false;
            _.each(currentFields, function(cur, index){
                if(cur.name == fieldName){
                    alreadyExists = true;
                    currentFields[index] = field;
                }
            });

            if(!alreadyExists){
                currentFields.push(field);
            }

            this.setState({fieldsForNew: currentFields});
        },
        submitNewSubscription: function(){
            var target = this;

            if(!target.state.saving &&
                target.state.roomForNew &&
                target.state.fieldsForNew){
                    target.setState({saving: true});

                Synchronise.Cloud.run("superadminSubscribeFunctionToRealTime", {
                    room: target.state.roomForNew,
                    "name": target.state.subForNew,
                    "parameters": target.state.fieldsForNew
                }, {
                    success: function(){
                        target.setState({
                            roomForNew   : "",
                            subForNew    : "",
                            fieldsForNew : []
                        });
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({saving: false});
                    }
                });
            }
        },
        exportToJSON: function(){
            var target = this;
            if(!this.state.isExportingToJSON){
                target.setState({isExportingToJSON: true});
                Synchronise.Cloud.run("listOfRealtimeSubscriptions", {}, {
                    success: function(json){
                        var modal = new Modal();
                            modal.title("Export to JSON");
                            modal.content('<textarea class="form-control">' + JSON.stringify({data: json}) + '</textarea>');
                            modal.footer("", true);
                            modal.show();
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({isExportingToJSON: false});
                    }
                });
            }
        },
        importFromJSON: function(){
            var target = this;
            if(!this.state.isImportingFromJSON){
                target.setState({isImportingFromJSON: true});

                new ModalAskInput("Import from JSON", function(data){
                    var dataParsed = JSON.parse(data).data;
                    var promises = [];

                    _.each(dataParsed, function(object){
                        promises.push(new Promise(function(resolve, reject) {
                            var promisesInternal = [];

                            _.each(object.subscriptions, function(sub){
                                promisesInternal.push(new Promise(function(resolve1, reject1) {
                                    Synchronise.Cloud.run("superadminSubscribeFunctionToRealTime", {
                                        room: object.room,
                                        "name": sub.name,
                                        "parameters": sub.parameters
                                    }, {
                                        always: function(){
                                            resolve1();
                                        }
                                    });
                                }));
                            });

                            Promise.all(promisesInternal).then(function(){
                                resolve();
                            });
                        }));
                    });

                    Promise.all(promises).then(function(){
                        target.setState({isImportingFromJSON: false});
                    });
                });
            }
        },
        render: function(){
            var contentExistingSubscriptions = <Loader/>;
            var labelExportToJSONButton = "Export to JSON";
            if(this.state.isExportingToJSON){
                labelExportToJSONButton = "Exporting...";
            }

            if(!this.state.loading){
                contentExistingSubscriptions = (
                    <div>
                        <center><button style={{marginBottom: "10px"}} className="btn btn-primary" onClick={this.exportToJSON}>{labelExportToJSONButton}</button></center>
                        <table className="table table-striped table-bordered">
                            <tbody>
                                <tr>
                                    <th>Room</th>
                                    <th>Target</th>
                                    <th>Parameters</th>
                                </tr>

                                {this.state.subscriptions.map(function(row, index){
                                    return row.subscriptions.map(function(sub, index2){
                                        if(index2 == 0){
                                            return <RealtimeItem room={row.room}
                                                                 subscription={sub}
                                                                 parameters={sub.parameters}
                                                                 key={row.id+sub.name}/>
                                        }else{
                                            return <RealtimeItem room={row.name}
                                                                 subscription={sub}
                                                                 parameters={sub.parameters}
                                                                 key={row.id+sub.name}/>
                                        }
                                    });
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            }

            var labelImportFromJSONButton = "Import from JSON";
            if (this.state.isImportingFromJSON) {
                labelImportFromJSONButton = "Importing...";
            }

            return (
                <div>
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 card">
                        <legend>Add new subscription</legend>

                        <div className="col-xs-12">
                            <center><button style={{marginBottom: "10px"}} className="btn btn-primary" onClick={this.importFromJSON}>{labelImportFromJSONButton}</button></center>
                            <table className="table table-striped table-bordered">
                                <tbody>
                                    <tr>
                                        <th>Room</th>
                                        <th>Target</th>
                                        <th>Parameters</th>
                                    </tr>

                                    <tr>
                                        <td style={{fontFamily: '"Courier New", Courier, monospace', backgroundColor: "#5BAAEC"}}><input type="text"
                                                                                                                                         placeholder="Room name"
                                                                                                                                         onChange={this.fieldChange.bind(null, "roomForNew")}
                                                                                                                                         value={this.state.roomForNew} /></td>
                                        <td style={{backgroundColor: "#87CA54"}}>
                                            <div style={{fontFamily: '"Courier New", Courier, monospace'}}><input type="text"
                                                                                                                  placeholder="Subscription name"
                                                                                                                  onChange={this.fieldChange.bind(null, "subForNew")}
                                                                                                                  value={this.state.subForNew} /></div>
                                        </td>
                                        <td>
                                            {this.state.fieldsForNew.map(function(field){
                                                return (
                                                    <div key={"fieldsForNew"+field.name+field.value}>
                                                        <input type="text" defaultValue={field.name} className="col-lg-5 col-md-5 col-sm-12 col-xs-12"/>
                                                        <input type="text" defaultValue={field.value} className="col-lg-5 col-md-5 col-sm-12 col-xs-12"/>
                                                        <i className="fa fa-times col-lg-2 col-md-2 col-sm-12 col-xs-12"></i>
                                                    </div>)
                                            })}
                                            <RealtimeNewFieldItem submit={this.addNewField}/>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="col-xs-12" style={{textAlign: "center"}}>
                            <button className="btn btn-primary" onClick={this.submitNewSubscription}>Save subscription</button>
                        </div>
                    </div>

                    <div className="col-xs-12"><hr/></div>

                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 card">
                        <legend>Existing subscriptions</legend>

                        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 table-responsive">
                            {contentExistingSubscriptions}
                        </div>
                    </div>
                </div>
            );
        }
    });

    var RealtimeNewFieldItem = React.createClass({
        displayName: "RealtimeNewFieldItem",
        getInitialState: function(){
            return {
                fieldName     : "",
                optionalValue : ""
            };
        },
        fieldChange: function(fieldName, event){
            var data = {};
                data[fieldName] = event.target.value;

            this.setState(data);
        },
        submit: function(){
            if(this.state.fieldName.length){
                this.props.submit(this.state.fieldName, this.state.optionalValue);
            }
        },
        render: function(){
            return (
                <div style={{fontFamily: '"Courier New", Courier, monospace'}}>
                    <div className="col-lg-5 col-md-5 col-sm-12 col-xs-12"><input type="text"
                                                                                  className="form-control input-xs"
                                                                                  value={this.state.fieldName}
                                                                                  onChange={this.fieldChange.bind(null, "fieldName")}
                                                                                  placeholder="Field name"/></div>
                    <div className="col-lg-5 col-md-5 col-sm-12 col-xs-12"><input type="text"
                                                                                  className="form-control input-xs"
                                                                                  value={this.state.optionalValue}
                                                                                  onChange={this.fieldChange.bind(null, "optionalValue")}
                                                                                  placeholder="Optional value"/></div>
                                                                              <div className="col-lg-2 col-md-2 col-sm-12 col-xs-12"><button className="btn btn-xs btn-primary" onClick={this.submit}>Add</button></div>
                </div>
            );
        }
    });

    // Displays on line of Realtime subscription
    // Params :
    // - room : The room name (optional if this is not the 1st subscription of the list)
    // - subscription : The current subscription to display
    // - parameters : The parameters of the current subscription
    var RealtimeItem = React.createClass({
        displayName: "RealtimeItem",
        render: function(){
            var target = this;

            var bgcolorForRoom = "transparent";
            var colorForRoom   = "black";
            if(target.props.room){
                bgcolorForRoom = "#5BAAEC";
                colorForRoom   = "white";
            }

            return (
                <tr>
                    <td style={{fontFamily: '"Courier New", Courier, monospace', backgroundColor: bgcolorForRoom, color: colorForRoom}}>{target.props.room}</td>
                    <td style={{backgroundColor: "#87CA54", color: "white"}}>
                        <div>
                            <div style={{fontFamily: '"Courier New", Courier, monospace'}}>{target.props.subscription.name}</div>
                        </div>
                    </td>
                    <td>
                        {target.props.parameters.map(function(param, index){
                            return (
                                <div key={target.props.room+param.name} style={{fontFamily: '"Courier New", Courier, monospace'}}>
                                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12"><input type="text" className="form-control input-xs" placeholder="Field name" defaultValue={param.name}/></div>
                                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12"><input type="text" className="form-control input-xs" placeholder="Optional value" defaultValue={param.value}/></div>
                                </div>
                            )
                        })}
                    </td>
                </tr>
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
        ReactDOM.render(<Realtime/>, document.getElementById("realtime"));
    }
});
