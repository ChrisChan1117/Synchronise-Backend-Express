"use strict";

(function () {
    dependenciesLoader(["$", "React", "ReactDOM", "Loader", "TimeAgo", "_"], function () {
        // DISPLAY ITEMS FOR THE DIFFERENT TYPES OF QUERY WE CAN CREATE
        var items = [{ name: "item1", target: "insert" }, { name: "item2", target: "retrieve" }, { name: "item3", target: "update" }, { name: "item4", target: "delete" }];

        // Animate the buttons on click on the "Create query button"
        $(document).on('click', '.createQuery', function () {
            _.each(items, function (row) {
                $('#createQuery .' + row.name + ', #createFirstQuery .' + row.name).addClass('move' + row.name);
            });

            window.setTimeout(function () {
                $('#createQuery .item, #createFirstQuery .item').addClass('moveitemHide');

                window.setTimeout(function () {
                    _.each(items, function (row) {
                        $('#createQuery .' + row.name + ', #createFirstQuery .' + row.name).removeClass('move' + row.name);
                    });

                    $('#createQuery .item, #createFirstQuery .item').removeClass('moveitemHide');
                }, 300);
            }, 5000);
        });

        // Register clicks and actions on the buttons
        _.each(items, function (row) {
            $(document).on('click', '#createQuery .' + row.name + ', #createFirstQuery .' + row.name, function () {
                document.location.href = "/query/" + row.target + "?id=" + projectId;
            });
        });

        // Set the sizes of the buttons
        // Returns the size of the widest item, we are gonna use that as the size for every others
        var maxWidthOfItems = _.max(items, function (row) {
            // There is potentially multiple items
            var items = $('#createQuery .' + row.name + ', #createFirstQuery .' + row.name);
            var sizes = _.map(items, function (item) {
                console.log($(item).css('width'));
                console.log($(item).width());
                return $(item).width();
            });
            return Math.max(sizes);
        });

        $('#createQuery .item, #createFirstQuery .item').css("width", maxWidthOfItems + "px");
        $('#createQuery .item, #createFirstQuery .item').css("width", maxWidthOfItems + "px");

        // ----------------------------------------------------------------------------------------------- //
        // Displays the list of queries
        var QueryList = React.createClass({
            displayName: "QueryList",

            getInitialState: function getInitialState() {
                return {
                    queries: [],
                    loading: false,
                    ordering: { // Default ordering
                        ordering: "modified_at",
                        order: "desc"
                    },
                    orderableFields: ["modified_at", "created_at", "name", "total_execution"]
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;

                target.setState({ loading: true });

                Synchronise.Cloud.run("getQueriesForProject", { realtime: true, id_project: window.projectId }, {
                    success: function success(data) {
                        target.setState({
                            queries: data.queries,
                            ordering: data.ordering
                        });
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    always: function always() {
                        target.setState({ loading: false });
                    }
                });
            },
            goToProjects: function goToProjects() {
                document.location.href = '/query';
            },
            changeOrdering: function changeOrdering(field) {
                var target = this;
                var ordering = this.state.ordering;

                if (ordering.ordering == field) {
                    if (ordering.order == "desc") {
                        ordering.order = "asc";
                    } else {
                        ordering.order = "desc";
                    }
                } else {
                    ordering.ordering = field;
                    ordering.order = "desc";
                }

                target.setState({ loading: true });
                Synchronise.Cloud.run("changeOrderingForQueriesInProject", { id_project: window.projectId, ordering: ordering });
            },
            render: function render() {
                var target = this;
                var Loading = "";
                if (this.state.loading) {
                    Loading = React.createElement(
                        "div",
                        null,
                        React.createElement("hr", null),
                        React.createElement(Loader, null)
                    );
                }

                var needToCreateQueryBlock = "";
                if (!this.state.queries.length) {
                    needToCreateQueryBlock = React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "div",
                                { className: "col-xs-12", style: { textAlign: "center" } },
                                React.createElement(
                                    "p",
                                    null,
                                    "You did not create a query for this project yet. Start by creating a query!"
                                ),
                                React.createElement(
                                    "button",
                                    { className: "btn btn-primary createQuery cbutton cbutton--effect-novak" },
                                    "Create query"
                                ),
                                React.createElement(
                                    "div",
                                    { id: "createFirstQuery" },
                                    React.createElement(
                                        "div",
                                        { className: "item1 item inactive" },
                                        React.createElement("i", { className: "fa fa-plus-circle" }),
                                        React.createElement("br", null),
                                        "Insert"
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "item2 item" },
                                        React.createElement("i", { className: "fa fa-search" }),
                                        React.createElement("br", null),
                                        "Retrieve"
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "item3 item inactive" },
                                        React.createElement("i", { className: "fa fa-pencil-square-o" }),
                                        React.createElement("br", null),
                                        "Update"
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "item4 item inactive" },
                                        React.createElement("i", { className: "fa fa-trash-o" }),
                                        React.createElement("br", null),
                                        "Delete"
                                    )
                                )
                            )
                        )
                    );
                }

                var content = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "row" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement(
                                "button",
                                { className: "btn btn-default pull-left cbutton cbutton--effect-novak",
                                    onClick: this.goToProjects },
                                "Back to projects"
                            )
                        )
                    ),
                    needToCreateQueryBlock,
                    Loading
                );

                var orderableValueContent = {};

                _.each(target.state.orderableFields, function (field) {
                    if (target.state.ordering.ordering == field) {
                        orderableValueContent[field] = React.createElement("i", { className: "fa fa-sort-" + target.state.ordering.order });
                    } else {
                        orderableValueContent[field] = "";
                    }
                });

                if (this.state.queries.length && !this.state.loading) {
                    content = React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "div",
                                { className: "col-xs-12", style: { textAlign: "center" } },
                                React.createElement(
                                    "a",
                                    { className: "btn btn-default pull-left", href: "/query" },
                                    "Back to projects"
                                ),
                                React.createElement(
                                    "div",
                                    { id: "createQuery" },
                                    React.createElement(
                                        "button",
                                        { className: "btn btn-primary pull-right createQuery cbutton" },
                                        "Create query"
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "item1 item inactive" },
                                        React.createElement("i", { className: "fa fa-plus-circle" }),
                                        React.createElement("br", null),
                                        "Insert"
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "item2 item" },
                                        React.createElement("i", { className: "fa fa-search" }),
                                        React.createElement("br", null),
                                        "Retrieve"
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "item3 item inactive" },
                                        React.createElement("i", { className: "fa fa-pencil-square-o" }),
                                        React.createElement("br", null),
                                        "Update"
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "item4 item inactive" },
                                        React.createElement("i", { className: "fa fa-trash-o" }),
                                        React.createElement("br", null),
                                        "Delete"
                                    )
                                )
                            ),
                            React.createElement(
                                "div",
                                { className: "col-xs-12" },
                                React.createElement("hr", null)
                            )
                        ),
                        React.createElement(
                            "table",
                            { className: "table table-striped table-responsive" },
                            React.createElement(
                                "thead",
                                null,
                                React.createElement(
                                    "tr",
                                    null,
                                    React.createElement(
                                        "th",
                                        { className: "sort",
                                            onClick: target.changeOrdering.bind(null, "name"),
                                            "data-field": "name" },
                                        "Query name ",
                                        orderableValueContent["name"]
                                    ),
                                    React.createElement(
                                        "th",
                                        { className: "sort",
                                            onClick: target.changeOrdering.bind(null, "created_at"),
                                            "data-field": "createdAt" },
                                        "Created ",
                                        orderableValueContent["created_at"]
                                    ),
                                    React.createElement(
                                        "th",
                                        { className: "sort",
                                            onClick: target.changeOrdering.bind(null, "modified_at"),
                                            "data-field": "updatedAt" },
                                        "Last modification ",
                                        orderableValueContent["modified_at"]
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "Total execution ",
                                        orderableValueContent["total_execution"]
                                    ),
                                    React.createElement("th", null)
                                )
                            ),
                            React.createElement(
                                "tbody",
                                null,
                                target.state.queries.map(function (query, key) {
                                    return React.createElement(QueryListItem, { id: query.id,
                                        key: query.id,
                                        type: query.type,
                                        uniqueID: query.uniqueIdentifier,
                                        name: query.name,
                                        creationDate: query.created_at,
                                        lastExecDate: null,
                                        lastUpdateDate: query.modified_at });
                                })
                            )
                        )
                    );
                }

                return React.createElement(
                    "div",
                    null,
                    content
                );
            }
        });

        var QueryListItem = React.createClass({
            displayName: "QueryListItem",

            getInitialState: function getInitialState() {
                return {
                    style: {
                        opacity: 1
                    }
                };
            },
            goToQuery: function goToQuery() {
                document.location.href = "/query/" + this.props.type + "?id=" + window.projectId + "&query=" + this.props.id + "&block=dataSources";
            },
            deleteQuery: function deleteQuery() {
                this.setState({
                    style: {
                        opacity: 0.5
                    }
                });

                Synchronise.Cloud.run("deleteQuery", { id_query: this.props.id }, {
                    error: function error(err) {
                        new ModalErrorParse(err);

                        this.setState({
                            style: {
                                opacity: 1
                            }
                        });
                    }
                });
            },
            render: function render() {
                return React.createElement(
                    "tr",
                    { style: this.state.style, "data-id": this.props.id, "data-type": this.props.type, "data-identifier": this.props.uniqueID, className: "query" },
                    React.createElement(
                        "td",
                        { className: "goToQuery", onClick: this.goToQuery },
                        this.props.name
                    ),
                    React.createElement(
                        "td",
                        { className: "goToQuery", onClick: this.goToQuery },
                        React.createElement(TimeAgo, { date: new Date(this.props.creationDate) })
                    ),
                    React.createElement(
                        "td",
                        { className: "goToQuery", onClick: this.goToQuery },
                        React.createElement(TimeAgo, { date: new Date(this.props.lastUpdateDate) })
                    ),
                    React.createElement(
                        "td",
                        { className: "goToQuery", onClick: this.goToQuery },
                        "Never"
                    ),
                    React.createElement(
                        "td",
                        null,
                        React.createElement(
                            "span",
                            { className: "remove", onClick: this.deleteQuery },
                            React.createElement("i", { className: "fa fa-times" })
                        )
                    )
                );
            }
        });

        ReactDOM.render(React.createElement(QueryList, null), document.getElementById("queryList"));
    });
})();