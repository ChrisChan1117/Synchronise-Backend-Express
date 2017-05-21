dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function () {
    var Realtime = React.createClass({
        displayName: "Realtime",
        getInitialState: function () {
            return {
                subscriptions: [],
                loading: false,
                saving: false,
                isExportingToJSON: false,
                isImportingFromJSON: false,
                fieldsForNew: [],
                roomForNew: "",
                subForNew: ""
            };
        },
        componentDidMount: function () {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("listOfRealtimeSubscriptions", { realtime: true }, {
                success: function (data) {
                    target.setState({ subscriptions: _.sortBy(data, function (row) {
                            return row.room;
                        }) });
                },
                error: function (err) {
                    new ModalErrorParse(err);
                },
                always: function () {
                    target.setState({ loading: false });
                }
            });
        },
        fieldChange: function (fieldName, event) {
            var data = {};
            data[fieldName] = event.target.value;

            this.setState(data);
        },
        addNewField: function (fieldName, optionalValue) {
            var field = { name: fieldName };
            if (optionalValue) {
                field.value = optionalValue;
            }

            var currentFields = this.state.fieldsForNew;
            var alreadyExists = false;
            _.each(currentFields, function (cur, index) {
                if (cur.name == fieldName) {
                    alreadyExists = true;
                    currentFields[index] = field;
                }
            });

            if (!alreadyExists) {
                currentFields.push(field);
            }

            this.setState({ fieldsForNew: currentFields });
        },
        submitNewSubscription: function () {
            var target = this;

            if (!target.state.saving && target.state.roomForNew && target.state.fieldsForNew) {
                target.setState({ saving: true });

                Synchronise.Cloud.run("superadminSubscribeFunctionToRealTime", {
                    room: target.state.roomForNew,
                    "name": target.state.subForNew,
                    "parameters": target.state.fieldsForNew
                }, {
                    success: function () {
                        target.setState({
                            roomForNew: "",
                            subForNew: "",
                            fieldsForNew: []
                        });
                    },
                    error: function (err) {
                        new ModalErrorParse(err);
                    },
                    always: function () {
                        target.setState({ saving: false });
                    }
                });
            }
        },
        exportToJSON: function () {
            var target = this;
            if (!this.state.isExportingToJSON) {
                target.setState({ isExportingToJSON: true });
                Synchronise.Cloud.run("listOfRealtimeSubscriptions", {}, {
                    success: function (json) {
                        var modal = new Modal();
                        modal.title("Export to JSON");
                        modal.content('<textarea class="form-control">' + JSON.stringify({ data: json }) + '</textarea>');
                        modal.footer("", true);
                        modal.show();
                    },
                    error: function (err) {
                        new ModalErrorParse(err);
                    },
                    always: function () {
                        target.setState({ isExportingToJSON: false });
                    }
                });
            }
        },
        importFromJSON: function () {
            var target = this;
            if (!this.state.isImportingFromJSON) {
                target.setState({ isImportingFromJSON: true });

                new ModalAskInput("Import from JSON", function (data) {
                    var dataParsed = JSON.parse(data).data;
                    var promises = [];

                    _.each(dataParsed, function (object) {
                        promises.push(new Promise(function (resolve, reject) {
                            var promisesInternal = [];

                            _.each(object.subscriptions, function (sub) {
                                promisesInternal.push(new Promise(function (resolve1, reject1) {
                                    Synchronise.Cloud.run("superadminSubscribeFunctionToRealTime", {
                                        room: object.room,
                                        "name": sub.name,
                                        "parameters": sub.parameters
                                    }, {
                                        always: function () {
                                            resolve1();
                                        }
                                    });
                                }));
                            });

                            Promise.all(promisesInternal).then(function () {
                                resolve();
                            });
                        }));
                    });

                    Promise.all(promises).then(function () {
                        target.setState({ isImportingFromJSON: false });
                    });
                });
            }
        },
        render: function () {
            var contentExistingSubscriptions = React.createElement(Loader, null);
            var labelExportToJSONButton = "Export to JSON";
            if (this.state.isExportingToJSON) {
                labelExportToJSONButton = "Exporting...";
            }

            if (!this.state.loading) {
                contentExistingSubscriptions = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "center",
                        null,
                        React.createElement(
                            "button",
                            { style: { marginBottom: "10px" }, className: "btn btn-primary", onClick: this.exportToJSON },
                            labelExportToJSONButton
                        )
                    ),
                    React.createElement(
                        "table",
                        { className: "table table-striped table-bordered" },
                        React.createElement(
                            "tbody",
                            null,
                            React.createElement(
                                "tr",
                                null,
                                React.createElement(
                                    "th",
                                    null,
                                    "Room"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Target"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Parameters"
                                )
                            ),
                            this.state.subscriptions.map(function (row, index) {
                                return row.subscriptions.map(function (sub, index2) {
                                    if (index2 == 0) {
                                        return React.createElement(RealtimeItem, { room: row.room,
                                            subscription: sub,
                                            parameters: sub.parameters,
                                            key: row.id + sub.name });
                                    } else {
                                        return React.createElement(RealtimeItem, { room: row.name,
                                            subscription: sub,
                                            parameters: sub.parameters,
                                            key: row.id + sub.name });
                                    }
                                });
                            })
                        )
                    )
                );
            }

            var labelImportFromJSONButton = "Import from JSON";
            if (this.state.isImportingFromJSON) {
                labelImportFromJSONButton = "Importing...";
            }

            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 card" },
                    React.createElement(
                        "legend",
                        null,
                        "Add new subscription"
                    ),
                    React.createElement(
                        "div",
                        { className: "col-xs-12" },
                        React.createElement(
                            "center",
                            null,
                            React.createElement(
                                "button",
                                { style: { marginBottom: "10px" }, className: "btn btn-primary", onClick: this.importFromJSON },
                                labelImportFromJSONButton
                            )
                        ),
                        React.createElement(
                            "table",
                            { className: "table table-striped table-bordered" },
                            React.createElement(
                                "tbody",
                                null,
                                React.createElement(
                                    "tr",
                                    null,
                                    React.createElement(
                                        "th",
                                        null,
                                        "Room"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "Target"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "Parameters"
                                    )
                                ),
                                React.createElement(
                                    "tr",
                                    null,
                                    React.createElement(
                                        "td",
                                        { style: { fontFamily: '"Courier New", Courier, monospace', backgroundColor: "#5BAAEC" } },
                                        React.createElement("input", { type: "text",
                                            placeholder: "Room name",
                                            onChange: this.fieldChange.bind(null, "roomForNew"),
                                            value: this.state.roomForNew })
                                    ),
                                    React.createElement(
                                        "td",
                                        { style: { backgroundColor: "#87CA54" } },
                                        React.createElement(
                                            "div",
                                            { style: { fontFamily: '"Courier New", Courier, monospace' } },
                                            React.createElement("input", { type: "text",
                                                placeholder: "Subscription name",
                                                onChange: this.fieldChange.bind(null, "subForNew"),
                                                value: this.state.subForNew })
                                        )
                                    ),
                                    React.createElement(
                                        "td",
                                        null,
                                        this.state.fieldsForNew.map(function (field) {
                                            return React.createElement(
                                                "div",
                                                { key: "fieldsForNew" + field.name + field.value },
                                                React.createElement("input", { type: "text", defaultValue: field.name, className: "col-lg-5 col-md-5 col-sm-12 col-xs-12" }),
                                                React.createElement("input", { type: "text", defaultValue: field.value, className: "col-lg-5 col-md-5 col-sm-12 col-xs-12" }),
                                                React.createElement("i", { className: "fa fa-times col-lg-2 col-md-2 col-sm-12 col-xs-12" })
                                            );
                                        }),
                                        React.createElement(RealtimeNewFieldItem, { submit: this.addNewField })
                                    )
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "col-xs-12", style: { textAlign: "center" } },
                        React.createElement(
                            "button",
                            { className: "btn btn-primary", onClick: this.submitNewSubscription },
                            "Save subscription"
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement("hr", null)
                ),
                React.createElement(
                    "div",
                    { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 card" },
                    React.createElement(
                        "legend",
                        null,
                        "Existing subscriptions"
                    ),
                    React.createElement(
                        "div",
                        { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 table-responsive" },
                        contentExistingSubscriptions
                    )
                )
            );
        }
    });

    var RealtimeNewFieldItem = React.createClass({
        displayName: "RealtimeNewFieldItem",
        getInitialState: function () {
            return {
                fieldName: "",
                optionalValue: ""
            };
        },
        fieldChange: function (fieldName, event) {
            var data = {};
            data[fieldName] = event.target.value;

            this.setState(data);
        },
        submit: function () {
            if (this.state.fieldName.length) {
                this.props.submit(this.state.fieldName, this.state.optionalValue);
            }
        },
        render: function () {
            return React.createElement(
                "div",
                { style: { fontFamily: '"Courier New", Courier, monospace' } },
                React.createElement(
                    "div",
                    { className: "col-lg-5 col-md-5 col-sm-12 col-xs-12" },
                    React.createElement("input", { type: "text",
                        className: "form-control input-xs",
                        value: this.state.fieldName,
                        onChange: this.fieldChange.bind(null, "fieldName"),
                        placeholder: "Field name" })
                ),
                React.createElement(
                    "div",
                    { className: "col-lg-5 col-md-5 col-sm-12 col-xs-12" },
                    React.createElement("input", { type: "text",
                        className: "form-control input-xs",
                        value: this.state.optionalValue,
                        onChange: this.fieldChange.bind(null, "optionalValue"),
                        placeholder: "Optional value" })
                ),
                React.createElement(
                    "div",
                    { className: "col-lg-2 col-md-2 col-sm-12 col-xs-12" },
                    React.createElement(
                        "button",
                        { className: "btn btn-xs btn-primary", onClick: this.submit },
                        "Add"
                    )
                )
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
        render: function () {
            var target = this;

            var bgcolorForRoom = "transparent";
            var colorForRoom = "black";
            if (target.props.room) {
                bgcolorForRoom = "#5BAAEC";
                colorForRoom = "white";
            }

            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    { style: { fontFamily: '"Courier New", Courier, monospace', backgroundColor: bgcolorForRoom, color: colorForRoom } },
                    target.props.room
                ),
                React.createElement(
                    "td",
                    { style: { backgroundColor: "#87CA54", color: "white" } },
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "div",
                            { style: { fontFamily: '"Courier New", Courier, monospace' } },
                            target.props.subscription.name
                        )
                    )
                ),
                React.createElement(
                    "td",
                    null,
                    target.props.parameters.map(function (param, index) {
                        return React.createElement(
                            "div",
                            { key: target.props.room + param.name, style: { fontFamily: '"Courier New", Courier, monospace' } },
                            React.createElement(
                                "div",
                                { className: "col-lg-6 col-md-6 col-sm-12 col-xs-12" },
                                React.createElement("input", { type: "text", className: "form-control input-xs", placeholder: "Field name", defaultValue: param.name })
                            ),
                            React.createElement(
                                "div",
                                { className: "col-lg-6 col-md-6 col-sm-12 col-xs-12" },
                                React.createElement("input", { type: "text", className: "form-control input-xs", placeholder: "Optional value", defaultValue: param.value })
                            )
                        );
                    })
                )
            );
        }
    });

    var isAllowedThisSection;
    _.each(Synchronise.User.current().roles, function (row) {
        if (row.name == "superadmin" || row.name == "admin") {
            isAllowedThisSection = true;
        }
    });

    if (isAllowedThisSection) {
        ReactDOM.render(React.createElement(Realtime, null), document.getElementById("realtime"));
    }
});