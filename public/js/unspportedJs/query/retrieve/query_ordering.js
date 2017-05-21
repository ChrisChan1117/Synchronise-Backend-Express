var QueryOrdering;
(function () {
    dependenciesLoader(["$", "Mousetrap", "React", "ReactDOM", "Loader", "Synchronise", "Typeahead", "QueryResultPreview", "panelFlow" /* Instance of the flow */], function () {
        QueryOrdering = React.createClass({
            getInitialState: function () {
                return {
                    loadingRules: false,
                    loadingListFieldsAvailable: false,
                    saving: false,
                    query_id: "",
                    orderings: Array(),
                    listFieldsAvailable: Array()
                };
            },
            componentDidMount: function () {
                var target = this;

                $("#blocks").on('panelWillAppear', function (e, block) {
                    if (block.blockId() == "ordering") {
                        $("#titleBlock h1 small").text("Define ordering");
                    }
                });

                target.setState({
                    loadingRules: true,
                    query_id: urlH.getParam("query"),
                    loadingListFieldsAvailable: true
                });

                Synchronise.Cloud.run("orderingRules", { id_query: urlH.getParam("query"), realtime: true }, {
                    success: function (result) {
                        target.setState({ orderings: result });
                    },
                    error: function (err) {
                        new ModalErrorParse(err);
                    },
                    always: function () {
                        target.setState({ loadingRules: false });
                    }
                });

                Synchronise.Cloud.run("fieldsAvailableForOrderingInQuery", { id_query: urlH.getParam("query"), realtime: true }, {
                    success: function (fields) {
                        fields.forEach(function (item, i, fields) {
                            fields[i].text = item.tableName + " > " + item.fieldName;
                        });
                        target.setState({ listFieldsAvailable: fields });
                    },
                    always: function () {
                        target.setState({ loadingListFieldsAvailable: false });
                    }
                });
            },
            fieldSelected: function (itemSelected) {
                var target = this;
                if (!this.state.saving) {
                    target.setState({ saving: true });

                    Synchronise.Cloud.run("createOrderingRule", { id_query: this.state.query_id, id_field: itemSelected.item.displayedFieldId }, {
                        always: function () {
                            target.setState({ saving: false });
                        },
                        error: function (err) {
                            new ModalErrorParse(err);
                        }
                    });
                }
            },
            goToFieldsSelection: function () {
                panelFlow.scrollToBlock("fields");
            },
            render: function () {
                var target = this;

                // No fields selected to be displayed on the query
                var noFieldsWarning = "";
                if (!this.state.loadingListFieldsAvailable && !this.state.loadingRules) {
                    if (!this.state.listFieldsAvailable.length && !this.state.orderings.length) {
                        noFieldsWarning = React.createElement(
                            "div",
                            { className: "row-fluid col-lg-12 col-md-12 col-sm-12 col-xs-12" },
                            React.createElement(
                                "div",
                                { className: "alert alert-warning",
                                    role: "alert",
                                    style: { textShadow: "0.5px 0.5px white", color: "black" } },
                                "You haven't selected any fields. It's okay we forgive you. ",
                                React.createElement(
                                    "a",
                                    { onClick: target.goToFieldsSelection },
                                    "Click here"
                                ),
                                " to go and select some super awesome fields."
                            )
                        );
                    }
                }

                // Displays the list of fields that are selectable
                var selectableFields = "";
                var dataForSelectableFields = "";
                if (!this.state.loadingListFieldsAvailable && this.state.listFieldsAvailable.length) {
                    dataForSelectableFields = React.createElement(
                        "div",
                        null,
                        React.createElement(Typeahead, { options: this.state.listFieldsAvailable,
                            onSelected: this.fieldSelected,
                            typeContent: "text",
                            className: "form-control input-lg",
                            placeholder: "Type the name of a field that you have previously selected to display" }),
                        target.state.listFieldsAvailable.map(function (item) {
                            return React.createElement(QueryOrderingAvailableField, { data: item,
                                itemClicked: target.fieldSelected,
                                saving: target.state.saving,
                                key: "queryorderingavailable" + item.displayedFieldId });
                        })
                    );
                } else if (this.state.loadingListFieldsAvailable) {
                    dataForSelectableFields = React.createElement(Loader, null);
                } else if (!this.state.listFieldsAvailable.length) {
                    dataForSelectableFields = React.createElement(
                        "p",
                        { className: "col-xs-12", style: { textAlign: "center" } },
                        "You have already selected all of the available fields for ordering for this query"
                    );
                }

                selectableFields = React.createElement(
                    "div",
                    { className: "form row-fluid" },
                    React.createElement(
                        "div",
                        { className: "form-group searchField" },
                        React.createElement(
                            "div",
                            { className: "col-lg-4 col-md-4 col-sm-12 col-xs-12" },
                            React.createElement(
                                "legend",
                                null,
                                "Selectable fields"
                            ),
                            dataForSelectableFields
                        )
                    )
                );

                var selectedFields = "";
                var fields = "";
                // If ordering rules available
                if (this.state.orderings.length) {
                    fields = React.createElement(
                        "div",
                        null,
                        target.state.orderings.map(function (item) {
                            return React.createElement(OrderingRule, { type: item.type,
                                tableName: item.tableName,
                                fieldName: item.fieldName,
                                ordering: item.ordering,
                                id: item.id,
                                id_query: urlH.getParam("query"),
                                key: "ordering" + item.id });
                        })
                    );
                } else if (!this.state.loadingRules) {
                    // If not loading and no rules defined, displays an informational message
                    fields = React.createElement(
                        "div",
                        { className: "col-xs-12", style: { textAlign: "center" } },
                        "There is no fields selected for ordering at the moment"
                    );
                }

                // If loading the list of ordering rules displays a loader
                if (this.state.loadingRules) {
                    fields = React.createElement(
                        "div",
                        { className: "col-xs-12", style: { textAlign: "center" } },
                        React.createElement(Loader, null)
                    );
                }

                // Displays the list of fields that have been selected
                selectedFields = React.createElement(
                    "div",
                    { className: "col-lg-4 col-md-4 col-sm-12 col-xs-12" },
                    React.createElement(
                        "legend",
                        null,
                        "Selected fields"
                    ),
                    fields
                );

                var resultPreview = React.createElement(
                    "div",
                    { className: "col-lg-4 col-md-4 col-sm-12 col-xs-12" },
                    React.createElement(
                        "legend",
                        { style: { marginBottom: "10px" } },
                        "Results"
                    ),
                    React.createElement(QueryResultPreview, { id_query: urlH.getParam("query") })
                );

                return React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "p",
                        { style: { textAlign: "center" } },
                        "In some cases your queries will return multiple results. You can reorder the list of results by applying ordering rules"
                    ),
                    React.createElement("hr", null),
                    noFieldsWarning,
                    React.createElement(
                        "div",
                        { className: "col-xs-12" },
                        selectableFields,
                        selectedFields,
                        resultPreview
                    )
                );
            }
        });

        var QueryOrderingAvailableField = React.createClass({
            getInitialState: function () {
                return { adding: false };
            },
            selected: function (e) {
                if (!this.state.adding && !this.props.saving) {
                    this.setState({ adding: true });
                    this.props.itemClicked({ item: this.props.data });
                    $(ReactDOM.findDOMNode(this)).animate({
                        opacity: 0.3
                    });
                } else {
                    $(ReactDOM.findDOMNode(this)).effect("highlight");
                }
            },
            render: function () {
                return React.createElement(
                    "div",
                    { className: "orderingAvailableField", onClick: this.selected },
                    React.createElement(
                        "div",
                        { className: "content" },
                        React.createElement(
                            "span",
                            { className: "type" },
                            this.props.data.type
                        ),
                        React.createElement(
                            "span",
                            { className: "table" },
                            this.props.data.tableName
                        ),
                        React.createElement(
                            "span",
                            { className: "field" },
                            this.props.data.fieldName
                        )
                    )
                );
            }
        });

        // Displays a row of ordering rule
        // Props :
        // - type : the type of data (number, string, date ...)
        // - tableName : the name of the table that own of the field
        // - fieldName : the name of the field concerned by the ordering
        // - ordering : the actual ordering (asc|desc)
        var OrderingRule = React.createClass({
            getInitialState: function () {
                return {
                    ordering: null,
                    removing: false
                };
            },
            componentDidMount: function () {
                this.setState({
                    ordering: this.props.ordering
                });
            },
            changeAscDesc: function (ev) {
                console.log(ev.target.value);
                this.setState({
                    ordering: ev.target.value
                });
            },
            remove: function () {
                var target = this;

                if (!target.state.removing) {
                    target.setState({ removing: true });

                    $(ReactDOM.findDOMNode(target)).animate({
                        opacity: 0.3
                    });

                    Synchronise.Cloud.run("removeOrderingRule", { id_rule: this.props.id, id_query: this.props.id_query }, {
                        error: function (err) {
                            new ModalErrorParse(err);
                        },
                        always: function () {
                            target.setState({ removing: false });
                        }
                    });
                }
            },
            render: function () {
                return React.createElement(
                    "div",
                    { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 orderingRow sortable",
                        style: { position: "relative" } },
                    React.createElement("i", { className: "fa fa-arrows-v moveOrderingIcon" }),
                    React.createElement(
                        "div",
                        { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 content" },
                        React.createElement(
                            "div",
                            { className: "row-fluid" },
                            React.createElement(
                                "div",
                                { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 field" },
                                React.createElement(
                                    "span",
                                    { className: "dataType" },
                                    this.props.type
                                ),
                                React.createElement(
                                    "span",
                                    { className: "tableName" },
                                    this.props.tableName
                                ),
                                React.createElement(
                                    "span",
                                    { className: "fieldName" },
                                    this.props.fieldName
                                )
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "row-fluid" },
                            React.createElement(
                                "div",
                                { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rule" },
                                React.createElement(
                                    "select",
                                    { className: "form-control ascDescValue", value: this.state.ordering, onChange: this.changeAscDesc },
                                    React.createElement(
                                        "option",
                                        { value: "asc" },
                                        "Ascending"
                                    ),
                                    React.createElement(
                                        "option",
                                        { value: "desc" },
                                        "Descending"
                                    )
                                )
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "col-md-12 col-sm-12 col-xs-12 hidden-lg remove", style: { textAlign: "center" } },
                            React.createElement(
                                "button",
                                { className: "btn btn-xs btn-default cbutton cbutton--effect-novak" },
                                "Remove"
                            )
                        )
                    ),
                    React.createElement("i", { className: "fa fa-times removeOrderingIcon", onClick: this.remove })
                );
            }
        });

        ReactDOM.render(React.createElement(QueryOrdering, null), document.getElementById("ordering"));
    });
})();