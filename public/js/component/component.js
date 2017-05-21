dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "TimeAgo", "ProjectsList", "ProjectItem", "ProjectPicker"], function () {
    var isCreatingComponent = false;
    var projectListLoaded = false;
    var projectsForPicker = [];

    Synchronise.Cloud.run("projectList", {}, {
        success: function (data) {
            projectsForPicker = _.map(data, function (row) {
                return row.id;
            });
            projectListLoaded = true;
        },
        error: function (err) {
            new ModalErrorParse(err);
            projectListLoaded = true;
        }
    });

    function createComponent(id_project) {
        if (!isCreatingComponent) {
            function callback(id_project) {
                window.setTimeout(function () {
                    new ModalAskInput("How do you want to call your new Component?", function (name) {
                        if (name) {
                            isCreatingComponent = true;

                            var params = { code: "/* THIS IS WHERE YOU TYPE YOUR CODE*/\n// Use this to end the execution with success\nsuccess('message');\n// Use this to end the execution with an error and a code\nerror('Error message', 201);\n// Use this to seng a log message in the debug console\nconsole.log('');\n\n/* SNIPPETS\n   The editor comes with some useful snippets.\n   For example to make an HTTP request simply type request.\n   There is also some third party libraries you can use such as Mailgun or Stripe.\n   Try it by typing st for stripe\n\n   INPUTS\n   Your component can sometimes require some information to execute like\n   an API KEY or the email address of a user.\n   You can allow your component to receive an Input by declaring it\n   on the block 'Input' above\n\n   OUTPUTS\n   Your component can return some information when it is executed\n   For example you could return a list of pictures of cats you just found\n   Ok maybe not cats but something more useful.\n   To return an output you can either declare it in the block bellow\n   or you can simply provide it\n   as an answer to the function*/\nsuccess({'myOutputName': 'myOutputValue'});\n/*   Alternatively you can also set the value of an Output like this */\nOutput.outputName = 'value';\nsuccess();", name: name };
                            params.id_project = id_project;

                            Synchronise.Cloud.run("createComponent", params, {
                                success: function (component) {
                                    document.location.href = "/component/edit?id=" + component.id;
                                },
                                error: function (err) {
                                    console.log(err);
                                    new ModalErrorParse(err);
                                }
                            });
                        }
                    }, "Sending an email, Send a push notification, charge a credit card...");
                }, 600);
            }

            if (typeof id_project != "string") {
                var interval = window.setInterval(function () {
                    if (projectListLoaded) {
                        window.clearInterval(interval);
                        if (projectsForPicker.length) {
                            ReactDOM.render(React.createElement(ProjectPicker, { projects: projectsForPicker, idMount: "ProjectPicker", onClickProject: callback }), document.getElementById("ProjectPicker"));
                        } else {
                            new ModalConfirm("A Component must be stored in a project. Do you want to create a new project?", function (confirm) {
                                if (confirm) {
                                    document.location.href = "/project?displayModalCreate=true&backuri=" + encodeURIComponent("/component?displayModalCreate=true") + "&backlabel=" + encodeURIComponent("Back to Component");
                                }
                            });
                        }
                    }
                }, 1);
            } else {
                callback(id_project);
            }
        }
    }

    // Displays the entire page of components
    var Components = React.createClass({
        displayName: "Component",
        getInitialState: function () {
            return {
                loading: false,
                removing: false,
                components: [],
                IDsProjectsWithComponents: []
            };
        },
        componentDidMount: function () {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("listOfComponents", { code: false, cacheFirst: true, realtime: { ignore: ["code"] } }, {
                success: function (data) {
                    var IDsProjectsWithComponents = [];
                    _.each(data, function (comp) {
                        if (IDsProjectsWithComponents.indexOf(comp.id_project) == -1 && !comp.is_forked) {
                            IDsProjectsWithComponents.push(comp.id_project);
                        }
                    });
                    target.setState({ components: _.filter(data, function (row) {
                            return !row.is_forked;
                        }), IDsProjectsWithComponents: IDsProjectsWithComponents });
                },
                error: function (err) {
                    new ModalErrorParse(err);
                },
                always: function () {
                    target.setState({ loading: false });
                }
            });

            var needToCreateJS = false;
            if (!Synchronise.User.current().public_key) {
                needToCreateJS = true;
            }

            if (needToCreateJS) {
                Synchronise.Cloud.run("createPublicKey", { "type": "javascript" }, {
                    success: function (key) {
                        Synchronise.User.fetchCurrent(function () {
                            // Refresh local data
                            Synchronise.init(Synchronise.User.current().public_key);
                        });
                    }
                });
            }

            // Auto open the create component modal
            if (urlH.getParam('displayModalCreate')) {
                createComponent();
            }
        },
        clickOnProjectItem: function (id) {
            document.location.href = "/component/edit?id=" + id;
        },
        onCreate: function (id_project) {
            createComponent(id_project);
        },
        onClickRemove: function (id) {
            var target = this;
            if (!this.state.removing) {
                ModalConfirm("You are about to remove the component. Are you sure you want to continue?", function (confirm) {
                    if (confirm) {
                        target.setState({ removing: true });
                        Synchronise.Cloud.run("removeComponent", { id: id }, {
                            error: function (err) {
                                new ModalErrorParse(err);
                            },
                            always: function () {
                                target.setState({ removing: false });
                            }
                        });
                    }
                });
            }
        },
        shouldDisplayProject: function (item) {
            return this.state.IDsProjectsWithComponents.indexOf(item.id) != -1 || item.published;
        },
        render: function () {
            var target = this;
            var content = "";

            var amountOfUncategorizedComponents = _.filter(this.state.components, function (row) {
                return !row.id_project;
            }).length;

            if (this.state.loading) {
                // Loading
                content = React.createElement(Loader, null);
            } else if (this.state.components.length) {
                // Components found
                var uncategorizedComponents = "";
                if (amountOfUncategorizedComponents) {
                    uncategorizedComponents = React.createElement(
                        "div",
                        { className: "card" },
                        React.createElement(
                            "legend",
                            null,
                            "Uncategorised components"
                        ),
                        React.createElement(
                            "table",
                            { className: "table table-responsive" },
                            React.createElement(
                                "thead",
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
                                        "Created"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "Last updated"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "Identifier"
                                    )
                                )
                            ),
                            React.createElement(
                                "tbody",
                                null,
                                this.state.components.map(function (row) {
                                    if (!row.id_project) {
                                        return React.createElement(ProjectItem, { key: "component" + row.id,
                                            id: row.id,
                                            name: row.name,
                                            created: row.created_at,
                                            identifier: row.identifier || row.id,
                                            targetOnClick: target.clickOnProjectItem.bind(null, row.id),
                                            targetOnRemove: target.onClickRemove.bind(null, row.id),
                                            lastUpdate: row.modified_at });
                                    }
                                })
                            )
                        )
                    );
                }

                content = React.createElement(
                    "div",
                    null,
                    React.createElement(ProjectsList, { targetOnClick: target.clickOnProjectItem,
                        targetOnRemove: target.onClickRemove,
                        targetOnCreate: target.onCreate,
                        shouldDisplayProject: target.shouldDisplayProject,
                        items: this.state.components }),
                    uncategorizedComponents
                );
            } else {
                // Not loading and no components found
                content = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    "No components found. Create a component now!",
                    React.createElement("br", null),
                    React.createElement("br", null),
                    React.createElement(
                        "button",
                        { className: "btn btn-primary", onClick: createComponent.bind(null, null) },
                        "Create component"
                    )
                );
            }

            return React.createElement(
                "div",
                { className: "col-xs-12" },
                content
            );
        }
    });

    var Header = React.createClass({
        displayName: "Header",
        getInitialState: function () {
            return { loading: false, amount: 0 };
        },
        componentDidMount: function () {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("countComponent", { realtime: true }, {
                success: function (results) {
                    target.setState({ amount: results.count });
                },
                always: function () {
                    target.setState({ loading: false });
                }
            });
        },
        render: function () {
            var createButton = "";
            if (this.state.amount) {
                createButton = React.createElement(
                    "span",
                    { className: "pull-right" },
                    React.createElement(
                        "button",
                        { className: "btn btn-primary btn-xs", onClick: createComponent },
                        "Create Component"
                    )
                );
            }

            return React.createElement(
                "h1",
                { className: "page-header" },
                "Components",
                createButton
            );
        }
    });

    ReactDOM.render(React.createElement(Header, null), document.getElementById('Header'));
    ReactDOM.render(React.createElement(Components, null), document.getElementById('Components'));
});