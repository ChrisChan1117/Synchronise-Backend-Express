dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "TimeAgo", "ProjectsList", "ProjectPicker"], function () {
    var isCreatingWorkflow = false;
    var projectsForPicker = [];
    var projectListLoading = true;

    Synchronise.Cloud.run("projectList", {}, {
        success: function (data) {
            projectsForPicker = _.map(data, function (row) {
                return row.id;
            });
            projectListLoading = false;
        },
        error: function (err) {
            new ModalErrorParse(err);
            projectListLoading = false;
        }
    });

    function createWorkflow(id_project) {
        if (!isCreatingWorkflow) {
            function callback(id_project) {
                window.setTimeout(function () {
                    new ModalAskInput("How do you want to call your new Workflow?", function (name) {
                        if (name) {
                            isCreatingWorkflow = true;

                            var params = { name: name };
                            params.id_project = id_project;

                            Synchronise.Cloud.run("createWorkflow", params, {
                                success: function (component) {
                                    document.location.href = "/workflow/edit?id=" + component.id;
                                },
                                error: function (err) {
                                    console.log(err);
                                    new ModalErrorParse(err);
                                }
                            });
                        }
                    }, "Crop a picture and send it by email, signup a user, process a payment...");
                }, 600);
            }

            if (typeof id_project != "string") {
                var interval = window.setInterval(function () {
                    if (!projectListLoading) {
                        window.clearInterval(interval);
                        if (projectsForPicker.length) {
                            ReactDOM.render(React.createElement(ProjectPicker, { projects: projectsForPicker, idMount: "ProjectPicker", onClickProject: callback }), document.getElementById("ProjectPicker"));
                        } else {
                            new ModalConfirm("A Workflow must be stored in a project. Do you want to create a new project?", function (confirm) {
                                if (confirm) {
                                    document.location.href = "/project?displayModalCreate=true&backuri=" + encodeURIComponent("/workflow?displayModalCreate=true") + "&backlabel=" + encodeURIComponent("Back to Workflow");
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

    var Workflows = React.createClass({
        getInitialState: function () {
            return {
                loading: false,
                removing: false,
                workflows: [],
                IDsProjectsWithWorkflows: []
            };
        },
        componentDidMount: function () {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("listOfWorkflows", { realtime: true, cacheFirst: true }, {
                success: function (data) {
                    var IDsProjectsWithWorkflows = [];
                    for (var i = 0; i < data.length; i++) {
                        var workflow = data[i];
                        if (IDsProjectsWithWorkflows.indexOf(workflow.id_project) == -1) {
                            IDsProjectsWithWorkflows.push(workflow.id_project);
                        }
                    }

                    target.setState({
                        workflows: data,
                        IDsProjectsWithWorkflows: IDsProjectsWithWorkflows
                    });
                },
                error: function (err) {
                    new ModalErrorParse(err);
                },
                always: function () {
                    target.setState({ loading: false });
                }
            });

            if (urlH.getParam("displayModalCreate")) {
                createWorkflow();
            }
        },
        clickOnProjectItem: function (id) {
            document.location.href = "/workflow/edit?id=" + id;
        },
        onClickRemove: function (id) {
            var target = this;
            if (!this.state.removing) {
                ModalConfirm("You are about to remove this workflow. Are you sure you want to continue?", function (confirm) {
                    if (confirm) {
                        target.setState({ removing: true });
                        Synchronise.Cloud.run("removeWorkflow", { id: id }, {
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
        onCreate: function (id_project) {
            createWorkflow(id_project);
        },
        shouldDisplayProject: function (item) {
            return this.state.IDsProjectsWithWorkflows.indexOf(item.id) != -1;
        },
        render: function () {
            var target = this;
            var content = "";

            if (this.state.loading) {
                // Loading
                content = React.createElement(Loader, null);
            } else if (this.state.workflows.length) {
                // Components found
                var amountOfUncategorizedWorkflows = _.filter(this.state.workflows, function (row) {
                    return !row.id_project;
                }).length;
                var uncategorizedWorkflows = "";
                if (amountOfUncategorizedWorkflows) {
                    uncategorizedWorkflows = React.createElement(
                        "div",
                        { className: "card" },
                        React.createElement(
                            "legend",
                            null,
                            "Uncategorised workflows"
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
                                this.state.workflows.map(function (row, index) {
                                    if (!row.id_project) {
                                        return React.createElement(ProjectItem, { key: "workflow" + row.id + index,
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
                        items: this.state.workflows }),
                    uncategorizedWorkflows
                );
            } else {
                // Not loading and no components found
                content = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    "No workflow found. Create a workflow now!",
                    React.createElement("br", null),
                    React.createElement("br", null),
                    React.createElement(
                        "button",
                        { className: "btn btn-primary", onClick: createWorkflow.bind(null, null) },
                        "Create workflow"
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
                        { className: "btn btn-primary btn-xs", onClick: createWorkflow },
                        "Create workflow"
                    )
                );
            }

            return React.createElement(
                "h1",
                { className: "page-header" },
                "Workflow",
                createButton
            );
        }
    });

    ReactDOM.render(React.createElement(Header, null), document.getElementById('Header'));
    ReactDOM.render(React.createElement(Workflows, null), document.getElementById("workflows"));
});