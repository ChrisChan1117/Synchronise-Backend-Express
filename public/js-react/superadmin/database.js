dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function(){
    // This represents all functions related to database management
    var DatabaseBlock = React.createClass({
        displayName: "DatabaseBlock",
        getInitialState: function(){
            return {};
        },
        wypeDatabase: function(){

        },
        render: function(){
            return (
                <div className="card">
                    <div className="row">
                        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
                            <p>Removes every data in the database</p>
                        </div>

                        <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6"
                             style={{textAlign: "center"}}>
                            <button className="btn btn-primary cbutton cbutton--effect-novak"
                                    onClick={this.wypeDatabase}>
                                    <i className="fa fa-refresh hidden fa-spin"></i> <span className="label">Wipe</span>
                            </button>
                        </div>
                    </div>

                    <hr/>

                    <DatabaseBlockListModels/>
                </div>
            );
        }
    });

    // This represents the list of models
    var DatabaseBlockListModels = React.createClass({
        displayName: "DatabaseBlockListModels",
        getInitialState: function(){
            return {
                models  : Array(),
                loading : false,
                loaded  : false,
                collectionListOpened : false
            };
        },
        componentDidMount: function(){
            var target = this;

            $(ReactDOM.findDOMNode(this)).on("click", "#collapseCollectionsListButton", function(){
                if(!target.state.loading && !target.state.loaded){
                    target.setState({loading: true});
                    Synchronise.Cloud.run("superadminModelList", {}, {
                        success: function(data){
                            target.setState({models: data});
                        },
                        error: function(err){
                            console.log(err);
                        },
                        always: function(){
                            target.setState({loading: false, loaded: true});
                        }
                    });
                }
            });
        },
        toggleCollectionList: function(){
            this.setState({collectionListOpened: !this.state.collectionListOpened});
        },
        render: function(){
            var target = this;

            // Handle the collapseCollectionsListToggleWithESC
            if(target.state.collectionListOpened){
                KeyEventController.subscribeComponent("toggleCollectionList", function(key){
                    if(key == 27){
                        $(ReactDOM.findDOMNode(target)).find("#collapseCollectionsList").collapse('hide');
                        target.setState({collectionListOpened: !target.state.collectionListOpened});
                    }
                });
            }else {
                KeyEventController.unsubscribeComponent("toggleCollectionList");
            }

            var contentLoadingLabel = (
                <tr>
                    <td colSpan="3"></td>
                </tr>
            );
            if(this.state.loading){
                contentLoadingLabel = (
                    <tr>
                        <td colSpan="3" className="loadingModelListLabel"><Loader/></td>
                    </tr>);
            }

            return (
                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">
                        <p>Models</p>
                    </div>

                    <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6"
                         style={{textAlign: "center"}}>
                        <button onClick={this.toggleCollectionList}
                                className="btn btn-default cbutton cbutton--effect-novak"
                                type="button"
                                data-toggle="collapse"
                                data-target="#collapseCollectionsList"
                                aria-expanded="false"
                                id="collapseCollectionsListButton"
                                aria-controls="collapseCollectionsList">Expand</button>
                    </div>

                    <div className="col-xs-12"><br/></div>

                    <div className="col-xs-12">
                        <div className="collapse" id="collapseCollectionsList">
                            <table className="table table-bordered table-striped table-responsive table-hover">
                                <tbody>
                                    <tr>
                                        <th>Name</th>
                                        <th>Records</th>
                                        <th>Actions</th>
                                    </tr>{contentLoadingLabel}{this.state.models.map(function(item){
                                        return <DatabaseBlockListModelsListItem name={item} key={"model"+item} />;
                                    })}
                                </tbody>
                            </table>
                            <div className="col-xs-12"></div>
                        </div>
                    </div>
                </div>
            );
        }
    });

    // This represents a row of one Model type with action buttons
    var DatabaseBlockListModelsListItem = React.createClass({
        displayName: "DatabaseBlockListModelsListItem",
        getInitialState: function(){
            return {
                records : "Counting ...",
                wyping  : false
            };
        },
        componentDidMount: function(){
            this.loadAmountOfRecords();
        },
        loadAmountOfRecords: function(){
            var target = this;

            target.setState({records: "Counting ..."});

            Synchronise.Cloud.run("superadminModelCount", {model : this.props.name}, {
                success: function(result){
                    target.setState({records: result});
                },
                error: function(){
                    target.setState({records: "An error occured while counting"});
                }
            });
        },
        wype: function(){
            var target = this;

            if(!target.state.wyping){
                new ModalConfirm("Are you sure you want to wype this Model ?", function(confirm){
                    if(confirm){
                        target.setState({wyping: true});
                        Synchronise.Cloud.run("superadminFlushModel", {model: target.props.name}, {
                            success: function(){
                                target.setState({wyping: false});
                                target.loadAmountOfRecords();
                            },
                            error: function(error){
                                target.setState({wyping: false});
                                new ModalErrorParse(error);
                            }
                        });
                    }
                });
            }
        },
        display: function(){
            var target = this;
            ReactDOM.render(<DatabaseBlockModelContent name={this.props.name}/>, document.getElementById("databaseModelContent"));
            panelFlow.scrollToBlock("databaseModelContentPanel");

            KeyEventController.subscribeComponent("databaseModelContentPanel", function(key){
                if(key == 27 || key == 38){
                    window.setTimeout(function(){
                        if(target.isMounted()){
                            ReactDOM.unmountComponentAtNode(document.getElementById('databaseModelContent'));
                        }
                    }, 500);

                    panelFlow.scrollToBlock("databaseBlockPanel");
                    KeyEventController.unsubscribeComponent("databaseModelContentPanel");
                }
            });
        },
        render: function(){
            return (
                <tr className="model">
                    <td className="name">{this.props.name}</td>
                    <td className="records">{this.state.wyping ? "Wyping ..." : this.state.records }</td>
                    <td className="actions">
                        <div className="btn-group" role="group" aria-label="...">
                            <button className="btn btn-xs btn-default cbutton cbutton--effect-novak" onClick={this.display}>Display</button>
                            <button className="btn btn-xs btn-primary cbutton cbutton--effect-novak" onClick={this.wype}>Wipe</button>
                        </div>
                    </td>
                </tr>
            );
        }
    });

    // Displays the data of a Model
    var DatabaseBlockModelContent = React.createClass({
        displayName: "DatabaseBlockModelContent",
        getInitialState: function(){
            return {
                loading: false,
                records: Array()
            };
        },
        removeRow: function(id, callback){
            Synchronise.Cloud.run("superadminRemoveRowFromModel", {
                model : this.props.name,
                id    : id
            }, {
                always: function(){
                    callback();
                }
            });
        },
        componentDidMount: function(){
            var target = this;
                target.setState({loading: true});

            Synchronise.Cloud.run("superadminContentOfModel", {model: this.props.name, realtime: true}, {
                success: function(data){
                    if(!data.length){
                        panelFlow.scrollToBlock("databaseBlockPanel");
                    }
                    target.setState({records: data});
                },
                error: function(err){
                    new ModalErrorParse("An error occured while trying to display the content of this model", function(){
                        panelFlow.scrollToBlock("databaseBlockPanel");
                        KeyEventController.unsubscribeComponent("databaseModelContentPanel");
                        window.setTimeout(function(){
                            ReactDOM.unmountComponentAtNode(document.getElementById('databaseModelContent'));
                        }, 500);
                    });
                },
                always: function(){
                    target.setState({loading: false});
                }
            });
        },
        render: function(){
            var content = "";
            if(this.state.loading){
                content = <Loader/>;
            }else{
                // Collect of the keys existing in the data set
                var keysOfTable = Array();
                _.each(this.state.records, function(record){
                    keysOfTable = _.union(keysOfTable, Object.keys(record));
                });

                keysOfTable.reverse();

                content = <DatabaseBlockModelContentTable headerKeys={keysOfTable}
                                                          records={this.state.records}
                                                          removeRow={this.removeRow}/>
            }

            return (<div>{content}</div>);
        }
    });

    // This represents the structure of the table that it display to show the content of a model
    var DatabaseBlockModelContentTable = React.createClass({
        displayName: "DatabaseBlockModelContentTable",
        getInitialState: function(){
            return { isRemoving: false };
        },
        removeRow: function(id, event){
            var target = this;

            if(!target.state.isRemoving){
                target.setState({ isRemoving: true });
                target.props.removeRow(id, function(){
                    target.setState({ isRemoving: false });
                });
            }
        },
        render: function(){
            var target = this;

            return (
                <table className="table table-bordered table-striped table-responsive table-hover card">
                    <tbody>
                        <DatabaseBlockModelContentTableHeader keys={target.props.headerKeys}/>
                        {target.props.records.map(function(record){
                            return <DatabaseBlockModelContentTableRow key={record.id}
                                                                      record={record}
                                                                      headerKeys={target.props.headerKeys}
                                                                      removeRow={target.removeRow}/>;
                        })}
                    </tbody>
                </table>
            );
        }
    });

    // This represents the header of the table
    var DatabaseBlockModelContentTableHeader = React.createClass({
        displayName: "DatabaseBlockModelContentTableHeader",
        render: function(){
            return (
                <tr>
                    {this.props.keys.map(function(item){
                        return <th key={"header"+item}>{item}</th>;
                    })}
                </tr>
            );
        }
    });

    // This represents one row of a the content of the Model
    var DatabaseBlockModelContentTableRow = React.createClass({
        displayName: "DatabaseBlockModelContentTableRow",
        getInitialState: function(){
            return { isRemoving : false };
        },
        removeRow: function(event){
            if(!this.state.isRemoving){
                this.props.removeRow(this.props.record.id, event);
                this.setState({isRemoving: true});
            }
        },
        render: function(){
            var target = this;

            var style = {
                opacity: 1
            };

            if(this.state.isRemoving){
                style.opacity = 0.3;
            }

            return (
                <tr className="modelContentRow" style={style}>
                    {target.props.headerKeys.map(function(key){
                        if(typeof(target.props.record[key]) != "undefined"){
                            if(target.props.record[key] != null){
                                return (<td key={"rowWithHeader"+key+target.props.record[key].toString()}>{target.props.record[key].toString()}</td>);
                            }else{
                                return (<td key={"rowWithHeader"+key+"N/A"}>N/A</td>);
                            }
                        }else{
                            return (<td key={"rowWithHeader"+key+"N/A"}>N/A</td>);
                        }
                    })}
                    <td className="remove"><i className="fa fa-times" onClick={target.removeRow}></i></td>
                </tr>
            );
        },
    });

    var isAllowedThisSection = false;
    _.each(Synchronise.User.current().roles, function(row){
        if(row.name == "superadmin"
        || row.name == "admin"){
            isAllowedThisSection = true;
        }
    });

    if(isAllowedThisSection){
        ReactDOM.render(<DatabaseBlock/>, document.getElementById("databaseBlock"));
    }
});
