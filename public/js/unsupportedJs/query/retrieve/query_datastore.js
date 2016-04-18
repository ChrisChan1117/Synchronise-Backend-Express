"use strict";

var QueryDatastore;
(function () {
    dependenciesLoader(["$", "React", "ReactDOM", "Loader", "Synchronise", "PanelFlow", "panelFlow" /* Instance of the flow */], function () {
        QueryDatastore = React.createClass({
            displayName: "QueryDatastore",

            getInitialState: function getInitialState() {
                return {
                    currentPage: 0,
                    db_type: "",
                    databases: [],
                    selected_datastore: null,
                    selected_db_id: null,
                    loading_db_type: false
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;
                var queryId = urlH.getParam("query");
                if (queryId) {
                    Synchronise.Cloud.run("getQuery", { id_query: queryId, realtime: false }, {
                        success: function success(query) {
                            target.select_db_type(query.db_type);
                            target.setState({
                                loading_db_type: true,
                                selected_db_id: query.db_id
                            });
                        }
                    });
                }

                $("#blocks").on('panelWillAppear', function (e, block) {
                    if (block.blockId() == "dataSources") {
                        $("#titleBlock h1 small").text("Select your data source");
                        $("#blocks").opacity = 1;
                    }
                });
            },
            select_db_type: function select_db_type(new_db_type) {
                var target = this;
                target.setState({
                    db_type: new_db_type,
                    loading_db_type: true,
                    databases: []
                });

                Synchronise.Cloud.run("getListOfDatabaseWithType", { type: new_db_type, realtime: true }, {
                    success: function success(result) {
                        target.setState({
                            loading_db_type: true,
                            databases: []
                        });

                        var databases = [];

                        var dbLoaded = 0; // Keep track of how many DBs have been loaded

                        for (var i = 0; i < result.databases.length; i++) {
                            Synchronise.Cloud.run("databaseObject", { realtime: false, id: result.databases[i].id }, {
                                success: function success(db) {
                                    databases = databases.concat(db);
                                },
                                always: function always() {
                                    dbLoaded++;
                                    // When all DB have been loaded
                                    if (dbLoaded >= result.databases.length) {
                                        target.setState({
                                            loading_db_type: false,
                                            databases: databases
                                        });
                                    }
                                }
                            });
                        }

                        $('#listDataStore').animate({ opacity: 1 }, 500);

                        // There is no DB to load
                        if (!result.databases.length) {
                            target.setState({
                                loading_db_type: false
                            });
                        }
                    }
                });
            },
            select_datastore: function select_datastore(id) {
                var target = this;

                if (target.state.selected_db_id != id) {
                    var type = location.pathname.slice(location.pathname.lastIndexOf("/") + 1);
                    // INSERT WARNING BEFORE CREATING QUERY
                    var queryId = urlH.getParam("query");
                    // if we are updating a query, check if the user really wants to change the datastore
                    if (queryId) {
                        new ModalConfirm("You are about to change the database used for this query, if you proceed it will result in all of the fields selected previously being deleted. Do you want to continue anyway?", function (confirm) {
                            if (confirm) {
                                target.setState({
                                    selected_db_id: id
                                });
                                modalMessage.show('Updating datastore, please wait ...');

                                Synchronise.Cloud.run("changeQueryDatastore", {
                                    id_query: queryId,
                                    id_db: id,
                                    db_type: target.state.db_type
                                }, {
                                    success: function success() {
                                        panelFlow.scrollToBlock('name');
                                    },
                                    error: function error(err) {
                                        new ModalParseError(err);
                                    },
                                    always: function always() {
                                        modalMessage.hide();
                                    }
                                });
                            }
                        });
                    } else {
                        this.setState({
                            selected_db_id: id
                        });
                        modalMessage.show('Saving datastore, please wait ...');
                        Synchronise.Cloud.run("createQuery", {
                            id_project: window.idProject,
                            id_db: id,
                            type: type,
                            db_type: this.state.db_type
                        }, {
                            success: function success(query) {
                                urlH.insertParam("query", query.id);
                                modalMessage.hide();
                                panelFlow.scrollToBlock('name');
                            }
                        });
                    }
                } else {
                    panelFlow.scrollToBlock('name');
                }
            },
            render: function render() {
                return React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "row-fluid", id: "listOfDatabaseTypes" },
                        React.createElement(Datastores, { db_type: this.state.db_type, select_db_type: this.select_db_type,
                            currentPage: this.state.currentPage })
                    ),
                    React.createElement(
                        "div",
                        { className: "container-fluid", id: "listDataStore", "data-idblock": "listDataStore" },
                        React.createElement(DatastorePatternList, { db_type: this.state.db_type, select_datastore: this.select_datastore,
                            selected_datastore: this.state.selected_datastore,
                            databases: this.state.databases,
                            loading: this.state.loading_db_type,
                            selected_db_id: this.state.selected_db_id })
                    )
                );
            }
        });

        var Datastores = React.createClass({
            displayName: "Datastores",

            getInitialState: function getInitialState() {
                return {
                    loading: false,
                    databaseTypes: [],
                    selected_db_type: null
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;
                target.setState({ loading: true });

                Synchronise.Cloud.run("getTypeOfDatastores", { realtime: false }, {
                    success: function success(data) {
                        target.setState({ databaseTypes: data });
                    },
                    error: function error(err) {
                        new ModalParseError(err);
                    },
                    always: function always() {
                        target.setState({ loading: false, updating: false });
                    }
                });
            },
            selectDBType: function selectDBType(db_type_index) {
                var selected = this.state.databaseTypes[db_type_index];

                this.setState({
                    selected_db_type: db_type_index
                });

                this.props.select_db_type(selected.masterType);
            },
            render: function render() {
                var target = this;

                var loader = "";
                if (target.state.loading) {
                    loader = React.createElement(Loader, null);
                }

                return React.createElement(
                    "div",
                    null,
                    loader,
                    target.state.databaseTypes.map(function (item, key) {
                        return React.createElement(Datastore, { key: key, masterType: item.masterType, title: item.title,
                            iconName: item.iconName, selectDBType: target.selectDBType.bind(null, key),
                            selected: target.props.db_type == item.masterType });
                    })
                );
            }
        });

        var Datastore = React.createClass({
            displayName: "Datastore",

            getInitialState: function getInitialState() {
                return {
                    active: false
                };
            },
            render: function render() {
                var classname = "panel panel-default dataStoreType";
                if (this.props.selected) {
                    classname += " active";
                }
                return React.createElement(
                    "div",
                    { className: "datastoreTypeContainer", onClick: this.props.selectDBType },
                    React.createElement(
                        "div",
                        { className: classname, "data-type": this.props.masterType },
                        React.createElement(
                            "div",
                            { className: "panel-heading" },
                            this.props.title
                        ),
                        React.createElement(
                            "div",
                            { className: "panel-body" },
                            React.createElement("img", { src: "/images/" + this.props.iconName + ".png" })
                        )
                    )
                );
            }
        });

        var DatastorePatternList = new React.createClass({
            displayName: "DatastorePatternList",
            selected: function selected(index) {
                var target = this;
                target.setState({
                    selected_datastore: index
                });

                var selected = this.props.databases[index];
                var type = location.pathname.slice(location.pathname.lastIndexOf("/") + 1);
                modalMessage.show('Saving datastore, please wait ...');
                var queryId = urlH.getParam("query");

                // if we are updating a query, check if the user really wants to change the datastore
                if (queryId) {
                    new ModalConfirm("You are about to change the database used for this query, if you proceed it will result in all of the fields selected previously being deleted. Do you want to continue anyway?", function (confirm) {
                        if (confirm) {
                            Synchronise.Cloud.run("changeQueryDatastore", {
                                id_query: queryId,
                                id_db: selected.id,
                                db_type: target.props.db_type
                            }, {
                                success: function success(query) {
                                    modalMessage.hide();
                                    window.setTimeout(function () {
                                        panelFlow.scrollToBlock('name');
                                    }, 300);
                                }
                            });
                        }
                    });
                } else {
                    Synchronise.Cloud.run("createQuery", {
                        id_project: window.idProject,
                        id_db: selected.id,
                        type: type,
                        db_type: this.props.db_type
                    }, {
                        success: function success(query) {
                            urlH.insertParam("query", window.idProject);
                            modalMessage.hide();
                            window.setTimeout(function () {
                                panelFlow.scrollToBlock('name');
                            }, 300);
                        }
                    });
                }
            },
            render: function render() {
                var target = this;
                var loader = "";

                if (this.props.loading) {
                    loader = React.createElement(Loader, null);
                }

                var content;
                // No databases and not loading -> Warning message
                if (!this.props.loading && !this.props.databases.length) {
                    content = React.createElement(
                        "div",
                        { className: "noDataStore", style: { textAlign: "center" } },
                        "No databases found for this type. Please go to the ",
                        React.createElement(
                            "a",
                            { href: "/database" },
                            "Database"
                        ),
                        " page if you want to add a new one."
                    );
                } else if (!this.props.loading && this.props.databases.length) {
                    // Not loading and found available databases
                    content = React.createElement(
                        "ul",
                        { className: "list-inline" },
                        this.props.databases.map(function (item, key) {
                            return React.createElement(DatastorePattern, { key: key,
                                type: item.type,
                                title: item.title,
                                id: item.id,
                                clicked: target.props.select_datastore.bind(null, item.id),
                                selected: item.id == target.props.selected_db_id });
                        })
                    );
                }

                if (!this.props.loading) {
                    return React.createElement(
                        "div",
                        { className: "col-lg-12 well", align: "center" },
                        loader,
                        React.createElement(
                            "div",
                            { className: "content" },
                            content
                        )
                    );
                } else {
                    return React.createElement(
                        "div",
                        { className: "col-lg-12 well", align: "center" },
                        loader
                    );
                }
            }
        });

        var DatastorePattern = new React.createClass({
            displayName: "DatastorePattern",
            render: function render() {
                var className = "panel fadeInListDataStorePanel";
                if (this.props.selected) {
                    className += " active";
                }

                return React.createElement(
                    "li",
                    { className: "dataStore", "store-type": this.props.type, "data-id": this.props.id,
                        onClick: this.props.clicked, onMouseEnter: this.mouseEnter, onMouseLeave: this.mouseLeave },
                    React.createElement(
                        "div",
                        { className: className, style: { display: "inline-block" } },
                        React.createElement(
                            "div",
                            { className: "panel-heading" },
                            this.props.title
                        ),
                        React.createElement(
                            "div",
                            { className: "panel-body" },
                            React.createElement("img", { src: "/images/" + this.props.type + ".png", width: "auto", height: "55px" })
                        )
                    )
                );
            }
        });

        ReactDOM.render(React.createElement(QueryDatastore, null), document.getElementById("query_datastore"));
    });
})();