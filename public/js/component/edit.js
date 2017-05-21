dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "TimeAgo", "CodeMirror", "urlH", "LeftBar", "RightBar"], function () {
    // Displays the entire page of components
    var Component = React.createClass({
        getInitialState: function () {
            return {
                component: false,
                loading: false
            };
        },
        componentDidMount: function () {
            var target = this;
            var time = new Date().getTime();
            var session = Synchronise.User.current().id + time;
            var firstRequest = true;

            target.setState({ loading: true });

            var query = Synchronise.Cloud.run("loadComponent", { id: urlH.getParam("id"), sessionQuery: session, realtime: { ignore: ["session"] } }, {
                success: function (data) {
                    var canContinue = false;
                    if (firstRequest) {
                        canContinue = true;
                    } else if (data.id_request != session) {
                        canContinue = true;
                    }

                    if (!data) {
                        document.location.href = "/component";
                    } else if (canContinue) {
                        firstRequest = false;
                        target.setState({ component: data.component });
                    }
                },
                always: function () {
                    target.setState({ loading: false });
                }
            });
        },
        addInput: function (fieldName) {
            var component = this.state.component;

            if (component) {
                var alreadyExists = false;
                _.each(component.inputs, function (row) {
                    if (row.name == fieldName) {
                        alreadyExists = true;
                    }
                });

                if (!alreadyExists) {
                    component.inputs.push({ name: fieldName, type: ["text", "text"], is_optional: false });
                    this.setState({ component: component });

                    Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { inputs: component.inputs } }, {
                        success: function () {}
                    });
                }
            }
        },
        typeChangedForInput: function (newType, field) {
            var component = this.state.component;

            if (component) {
                _.each(component.inputs, function (row, index) {
                    if (row.name == field) {
                        component.inputs[index].type = newType;
                    }
                });

                this.setState({ component: component });

                Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { inputs: component.inputs } }, {
                    success: function () {}
                });
            }
        },
        removeInput: function (field) {
            var component = this.state.component;

            _.each(component.inputs, function (row, index) {
                if (row) {
                    if (row.name == field) {
                        component.inputs.splice(index, 1);
                    }
                }
            });

            this.setState({ component: component });

            Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { inputs: component.inputs } }, {
                success: function () {}
            });
        },
        addOutput: function (fieldName) {
            var component = this.state.component;

            if (component) {
                var alreadyExists = false;
                _.each(component.outputs, function (row) {
                    if (row.name == fieldName) {
                        alreadyExists = true;
                    }
                });

                if (!alreadyExists) {
                    component.outputs.push({ name: fieldName, type: ["text", "text"] });
                    this.setState({ component: component });

                    Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { outputs: component.outputs } }, {
                        success: function () {}
                    });
                }
            }
        },
        typeChangedForOutput: function (newType, field) {
            var component = this.state.component;

            if (component) {
                _.each(component.outputs, function (row, index) {
                    if (row.name == field) {
                        component.outputs[index].type = newType;
                    }
                });

                this.setState({ component: component });

                Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { outputs: component.outputs } }, {
                    success: function () {}
                });
            }
        },
        removeOutput: function (field) {
            var component = this.state.component;

            var indexToRemove = -1;
            _.each(component.outputs, function (row, index) {
                if (row.name == field) {
                    indexToRemove = index;
                }
            });
            if (indexToRemove != -1) {
                component.outputs.splice(indexToRemove, 1);
            }

            this.setState({ component: component });

            Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { outputs: component.outputs } }, {
                success: function () {}
            });
        },
        changeValueIs_optional: function (field, event) {
            var component = this.state.component;

            if (component) {
                _.each(component.inputs, function (row, index) {
                    if (row.name == field.name) {
                        component.inputs[index].is_optional = event.target.checked;
                    }
                });

                this.setState({ component: component });

                Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { inputs: component.inputs } }, {
                    success: function () {}
                });
            }
        },
        addTag: function (tag) {
            var component = this.state.component;

            if (component) {
                var alreadyExists = component.tags.indexOf(tag) != -1;

                if (!alreadyExists) {
                    component.tags.push(tag);
                    this.setState({ component: component });

                    Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { tags: component.tags } }, {
                        success: function () {}
                    });
                }
            }
        },
        removeTag: function (tag) {
            console.log("in there");
            console.log(tag);
            var component = this.state.component;

            var indexToRemove = -1;
            _.each(component.tags, function (row, index) {
                if (row == tag) {
                    indexToRemove = index;
                }
            });
            if (indexToRemove != -1) {
                component.tags.splice(indexToRemove, 1);
            }

            this.setState({ component: component });

            Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { tags: component.tags } }, {
                success: function () {}
            });
        },
        render: function () {
            var contentForLeftBar = "";
            var contentForRightBar = "";

            if (this.state.loading) {
                contentForLeftBar = React.createElement(Loader, null);
                contentForRightBar = React.createElement(Loader, null);
            } else {
                contentForLeftBar = React.createElement(LeftBar, { component: this.state.component,
                    addInput: this.addInput,
                    typeChangedForInput: this.typeChangedForInput,
                    removeInput: this.removeInput,
                    addOutput: this.addOutput,
                    typeChangedForOutput: this.typeChangedForOutput,
                    changeValueIs_optional: this.changeValueIs_optional,
                    removeOutput: this.removeOutput,
                    addTag: this.addTag,
                    removeTag: this.removeTag,
                    loading: this.state.loading });

                contentForRightBar = React.createElement(RightBar, { component: this.state.component,
                    loading: this.state.loading });
            }

            var leftBar = "";
            var classForRightBar = "col-lg-3 col-md-3 col-sm-12 col-xs-12";

            if (this.state.component.is_forked) {
                //// VIEW MODE
                leftBar = React.createElement(
                    "div",
                    { className: "col-lg-9 col-md-9 col-sm-12 col-xs-12" },
                    contentForLeftBar
                );
            } else {
                // EDIT MODE
                leftBar = React.createElement(
                    "div",
                    { className: "col-lg-9 col-xs-12" },
                    contentForLeftBar
                );
                classForRightBar = "col-lg-3 col-xs-12";
            }

            // This helps developers communicate with each others about their code
            var commentBox = "";
            if (this.state.component.published == true) {
                // Loads disqus
                var disqus_config = function () {
                    this.page.url = document.location.hostname + "/component/edit?id=" + urlH.getParam('id');
                    this.page.identifier = "component" + urlH.getParam('id');
                };
                (function () {
                    var d = document,
                        s = d.createElement('script');s.src = '//synchronise.disqus.com/embed.js';s.setAttribute('data-timestamp', +new Date());(d.head || d.body).appendChild(s);
                })();

                var titleCommentBox = "";
                if (this.state.component.user_id != Synchronise.User.current().id) {
                    // Not owner
                    titleCommentBox = "You can ask questions to other developers about this code bellow";
                } else {
                    // Owner
                    titleCommentBox = "Other developers can ask you questions about your code bellow";
                }

                commentBox = React.createElement(
                    "div",
                    { className: "card" },
                    React.createElement(
                        "legend",
                        null,
                        titleCommentBox
                    ),
                    React.createElement("div", { id: "disqus_thread" })
                );
            }

            var content;
            if (this.state.component.is_forked) {
                // VIEW MODE
                content = React.createElement(
                    "div",
                    { className: "row" },
                    React.createElement(
                        "div",
                        { className: classForRightBar },
                        contentForRightBar
                    ),
                    leftBar
                );
            } else if (this.state.component.user_id != Synchronise.User.current().id && this.state.loading == false) {
                // VIEW FROM SHARED PROJECT
                content = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "row" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement(
                                "div",
                                { className: "alert alert-info", style: { textAlign: "center" } },
                                "You are in view mode only. The purpose of this page, is to help you learn how other developers are building components. The changes you make on this interface will no be saved."
                            )
                        ),
                        leftBar,
                        React.createElement(
                            "div",
                            { className: classForRightBar },
                            contentForRightBar
                        )
                    ),
                    commentBox
                );
            } else {
                // EDIT MODE
                content = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "row" },
                        leftBar,
                        React.createElement(
                            "div",
                            { className: classForRightBar },
                            contentForRightBar
                        )
                    ),
                    commentBox
                );
            }

            return content;
        }
    });

    ReactDOM.render(React.createElement(Component, null), document.getElementById('Component'));
});