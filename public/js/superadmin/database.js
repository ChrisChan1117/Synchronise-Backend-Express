"use strict";

dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function () {
    // This represents all functions related to database management
    var DatabaseBlock = React.createClass({
        displayName: "DatabaseBlock",
        getInitialState: function getInitialState() {
            return {};
        },
        wypeDatabase: function wypeDatabase() {},
        render: function render() {
            return React.createElement(
                "div",
                { className: "card" },
                React.createElement(
                    "div",
                    { className: "row" },
                    React.createElement(
                        "div",
                        { className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" },
                        React.createElement(
                            "p",
                            null,
                            "Removes every data in the database"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "col-lg-6 col-md-6 col-sm-6 col-xs-6",
                            style: { textAlign: "center" } },
                        React.createElement(
                            "button",
                            { className: "btn btn-primary cbutton cbutton--effect-novak",
                                onClick: this.wypeDatabase },
                            React.createElement("i", { className: "fa fa-refresh hidden fa-spin" }),
                            " ",
                            React.createElement(
                                "span",
                                { className: "label" },
                                "Wipe"
                            )
                        )
                    )
                ),
                React.createElement("hr", null),
                React.createElement(DatabaseBlockListModels, null)
            );
        }
    });

    // This represents the list of models
    var DatabaseBlockListModels = React.createClass({
        displayName: "DatabaseBlockListModels",
        getInitialState: function getInitialState() {
            return {
                models: Array(),
                loading: false,
                loaded: false,
                collectionListOpened: false
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;

            $(ReactDOM.findDOMNode(this)).on("click", "#collapseCollectionsListButton", function () {
                if (!target.state.loading && !target.state.loaded) {
                    target.setState({ loading: true });
                    Synchronise.Cloud.run("superadminModelList", {}, {
                        success: function success(data) {
                            target.setState({ models: data });
                        },
                        error: function error(err) {
                            console.log(err);
                        },
                        always: function always() {
                            target.setState({ loading: false, loaded: true });
                        }
                    });
                }
            });
        },
        toggleCollectionList: function toggleCollectionList() {
            this.setState({ collectionListOpened: !this.state.collectionListOpened });
        },
        render: function render() {
            var target = this;

            // Handle the collapseCollectionsListToggleWithESC
            if (target.state.collectionListOpened) {
                KeyEventController.subscribeComponent("toggleCollectionList", function (key) {
                    if (key == 27) {
                        $(ReactDOM.findDOMNode(target)).find("#collapseCollectionsList").collapse('hide');
                        target.setState({ collectionListOpened: !target.state.collectionListOpened });
                    }
                });
            } else {
                KeyEventController.unsubscribeComponent("toggleCollectionList");
            }

            var contentLoadingLabel = React.createElement(
                "tr",
                null,
                React.createElement("td", { colSpan: "3" })
            );
            if (this.state.loading) {
                contentLoadingLabel = React.createElement(
                    "tr",
                    null,
                    React.createElement(
                        "td",
                        { colSpan: "3", className: "loadingModelListLabel" },
                        React.createElement(Loader, null)
                    )
                );
            }

            return React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                    "div",
                    { className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" },
                    React.createElement(
                        "p",
                        null,
                        "Models"
                    )
                ),
                React.createElement(
                    "div",
                    { className: "col-lg-6 col-md-6 col-sm-6 col-xs-6",
                        style: { textAlign: "center" } },
                    React.createElement(
                        "button",
                        { onClick: this.toggleCollectionList,
                            className: "btn btn-default cbutton cbutton--effect-novak",
                            type: "button",
                            "data-toggle": "collapse",
                            "data-target": "#collapseCollectionsList",
                            "aria-expanded": "false",
                            id: "collapseCollectionsListButton",
                            "aria-controls": "collapseCollectionsList" },
                        "Expand"
                    )
                ),
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement("br", null)
                ),
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "collapse", id: "collapseCollectionsList" },
                        React.createElement(
                            "table",
                            { className: "table table-bordered table-striped table-responsive table-hover" },
                            React.createElement(
                                "tbody",
                                null,
                                React.createElement(
                                    "tr",
                                    null,
                                    React.createElement(
                                        "th",
                                        null,
                                        "Name"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "Records"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "Actions"
                                    )
                                ),
                                contentLoadingLabel,
                                this.state.models.map(function (item) {
                                    return React.createElement(DatabaseBlockListModelsListItem, { name: item, key: "model" + item });
                                })
                            )
                        ),
                        React.createElement("div", { className: "col-xs-12" })
                    )
                )
            );
        }
    });

    // This represents a row of one Model type with action buttons
    var DatabaseBlockListModelsListItem = React.createClass({
        displayName: "DatabaseBlockListModelsListItem",
        getInitialState: function getInitialState() {
            return {
                records: "Counting ...",
                wyping: false
            };
        },
        componentDidMount: function componentDidMount() {
            this.loadAmountOfRecords();
        },
        loadAmountOfRecords: function loadAmountOfRecords() {
            var target = this;

            target.setState({ records: "Counting ..." });

            Synchronise.Cloud.run("superadminModelCount", { model: this.props.name }, {
                success: function success(result) {
                    target.setState({ records: result });
                },
                error: function error() {
                    target.setState({ records: "An error occured while counting" });
                }
            });
        },
        wype: function wype() {
            var target = this;

            if (!target.state.wyping) {
                new ModalConfirm("Are you sure you want to wype this Model ?", function (confirm) {
                    if (confirm) {
                        target.setState({ wyping: true });
                        Synchronise.Cloud.run("superadminFlushModel", { model: target.props.name }, {
                            success: function success() {
                                target.setState({ wyping: false });
                                target.loadAmountOfRecords();
                            },
                            error: function error(_error) {
                                target.setState({ wyping: false });
                                new ModalErrorParse(_error);
                            }
                        });
                    }
                });
            }
        },
        display: function display() {
            var target = this;
            ReactDOM.render(React.createElement(DatabaseBlockModelContent, { name: this.props.name }), document.getElementById("databaseModelContent"));
            panelFlow.scrollToBlock("databaseModelContentPanel");

            KeyEventController.subscribeComponent("databaseModelContentPanel", function (key) {
                if (key == 27 || key == 38) {
                    window.setTimeout(function () {
                        if (target.isMounted()) {
                            ReactDOM.unmountComponentAtNode(document.getElementById('databaseModelContent'));
                        }
                    }, 500);

                    panelFlow.scrollToBlock("databaseBlockPanel");
                    KeyEventController.unsubscribeComponent("databaseModelContentPanel");
                }
            });
        },
        render: function render() {
            return React.createElement(
                "tr",
                { className: "model" },
                React.createElement(
                    "td",
                    { className: "name" },
                    this.props.name
                ),
                React.createElement(
                    "td",
                    { className: "records" },
                    this.state.wyping ? "Wyping ..." : this.state.records
                ),
                React.createElement(
                    "td",
                    { className: "actions" },
                    React.createElement(
                        "div",
                        { className: "btn-group", role: "group", "aria-label": "..." },
                        React.createElement(
                            "button",
                            { className: "btn btn-xs btn-default cbutton cbutton--effect-novak", onClick: this.display },
                            "Display"
                        ),
                        React.createElement(
                            "button",
                            { className: "btn btn-xs btn-primary cbutton cbutton--effect-novak", onClick: this.wype },
                            "Wipe"
                        )
                    )
                )
            );
        }
    });

    // Displays the data of a Model
    var DatabaseBlockModelContent = React.createClass({
        displayName: "DatabaseBlockModelContent",
        getInitialState: function getInitialState() {
            return {
                loading: false,
                records: Array()
            };
        },
        removeRow: function removeRow(id, callback) {
            Synchronise.Cloud.run("superadminRemoveRowFromModel", {
                model: this.props.name,
                id: id
            }, {
                always: function always() {
                    callback();
                }
            });
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("superadminContentOfModel", { model: this.props.name, realtime: true }, {
                success: function success(data) {
                    if (!data.length) {
                        panelFlow.scrollToBlock("databaseBlockPanel");
                    }
                    target.setState({ records: data });
                },
                error: function error(err) {
                    new ModalErrorParse("An error occured while trying to display the content of this model", function () {
                        panelFlow.scrollToBlock("databaseBlockPanel");
                        KeyEventController.unsubscribeComponent("databaseModelContentPanel");
                        window.setTimeout(function () {
                            ReactDOM.unmountComponentAtNode(document.getElementById('databaseModelContent'));
                        }, 500);
                    });
                },
                always: function always() {
                    target.setState({ loading: false });
                }
            });
        },
        render: function render() {
            var content = "";
            if (this.state.loading) {
                content = React.createElement(Loader, null);
            } else {
                // Collect of the keys existing in the data set
                var keysOfTable = Array();
                _.each(this.state.records, function (record) {
                    keysOfTable = _.union(keysOfTable, Object.keys(record));
                });

                keysOfTable.reverse();

                content = React.createElement(DatabaseBlockModelContentTable, { headerKeys: keysOfTable,
                    records: this.state.records,
                    removeRow: this.removeRow });
            }

            return React.createElement(
                "div",
                null,
                content
            );
        }
    });

    // This represents the structure of the table that it display to show the content of a model
    var DatabaseBlockModelContentTable = React.createClass({
        displayName: "DatabaseBlockModelContentTable",
        getInitialState: function getInitialState() {
            return { isRemoving: false };
        },
        removeRow: function removeRow(id, event) {
            var target = this;

            if (!target.state.isRemoving) {
                target.setState({ isRemoving: true });
                target.props.removeRow(id, function () {
                    target.setState({ isRemoving: false });
                });
            }
        },
        render: function render() {
            var target = this;

            return React.createElement(
                "table",
                { className: "table table-bordered table-striped table-responsive table-hover card" },
                React.createElement(
                    "tbody",
                    null,
                    React.createElement(DatabaseBlockModelContentTableHeader, { keys: target.props.headerKeys }),
                    target.props.records.map(function (record) {
                        return React.createElement(DatabaseBlockModelContentTableRow, { key: record.id,
                            record: record,
                            headerKeys: target.props.headerKeys,
                            removeRow: target.removeRow });
                    })
                )
            );
        }
    });

    // This represents the header of the table
    var DatabaseBlockModelContentTableHeader = React.createClass({
        displayName: "DatabaseBlockModelContentTableHeader",
        render: function render() {
            return React.createElement(
                "tr",
                null,
                this.props.keys.map(function (item) {
                    return React.createElement(
                        "th",
                        { key: "header" + item },
                        item
                    );
                })
            );
        }
    });

    // This represents one row of a the content of the Model
    var DatabaseBlockModelContentTableRow = React.createClass({
        displayName: "DatabaseBlockModelContentTableRow",
        getInitialState: function getInitialState() {
            return { isRemoving: false };
        },
        removeRow: function removeRow(event) {
            if (!this.state.isRemoving) {
                this.props.removeRow(this.props.record.id, event);
                this.setState({ isRemoving: true });
            }
        },
        render: function render() {
            var target = this;

            var style = {
                opacity: 1
            };

            if (this.state.isRemoving) {
                style.opacity = 0.3;
            }

            return React.createElement(
                "tr",
                { className: "modelContentRow", style: style },
                target.props.headerKeys.map(function (key) {
                    if (typeof target.props.record[key] != "undefined") {
                        if (target.props.record[key] != null) {
                            return React.createElement(
                                "td",
                                { key: "rowWithHeader" + key + target.props.record[key].toString() },
                                target.props.record[key].toString()
                            );
                        } else {
                            return React.createElement(
                                "td",
                                { key: "rowWithHeader" + key + "N/A" },
                                "N/A"
                            );
                        }
                    } else {
                        return React.createElement(
                            "td",
                            { key: "rowWithHeader" + key + "N/A" },
                            "N/A"
                        );
                    }
                }),
                React.createElement(
                    "td",
                    { className: "remove" },
                    React.createElement("i", { className: "fa fa-times", onClick: target.removeRow })
                )
            );
        }
    });

    var isAllowedThisSection = false;
    _.each(Synchronise.User.current().roles, function (row) {
        if (row.name == "superadmin" || row.name == "admin") {
            isAllowedThisSection = true;
        }
    });

    if (isAllowedThisSection) {
        ReactDOM.render(React.createElement(DatabaseBlock, null), document.getElementById("databaseBlock"));
    }
});