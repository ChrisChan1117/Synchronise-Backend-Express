"use strict";

(function () {
    dependenciesLoader(["$", "Mousetrap", "React", "ReactDOM", "Loader"], function () {
        // Display the list of projects
        var ProjectsList = React.createClass({
            displayName: "ProjectsList",

            getInitialState: function getInitialState() {
                return {
                    projects: Array(),
                    loading: true
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;
                Synchronise.Cloud.run("projectList", { realtime: true }, {
                    success: function success(projects) {
                        target.setState({
                            projects: projects,
                            loading: false
                        });
                    },
                    error: function error() {
                        target.setState({
                            loading: false
                        });
                    }
                });
            },
            createProject: function createProject() {
                document.location.href = "/project?backuri=" + encodeURIComponent("/query") + "&backlabel=" + encodeURIComponent("Back to query") + "&displayModalCreate=true";
            },
            render: function render() {
                var loading = "";
                if (this.state.loading) {
                    loading = React.createElement(Loader, null);
                }

                var bottomSeparator = "";
                if (this.state.projects.length) {
                    bottomSeparator = React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement("hr", null),
                            React.createElement("br", null)
                        )
                    );
                }

                return React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement(
                                "center",
                                null,
                                React.createElement(
                                    "p",
                                    null,
                                    "All the queries you create on Synchronise.IO are stored in a ",
                                    React.createElement(
                                        "b",
                                        null,
                                        "project"
                                    ),
                                    ". This allows you to arrange your queries into their specific context. Projects have their own settings which you can change in order to match your needs."
                                )
                            ),
                            React.createElement("br", null),
                            React.createElement(
                                "center",
                                null,
                                React.createElement(
                                    "button",
                                    { className: "btn btn-primary cbutton cbutton--effect-novak", onClick: this.createProject },
                                    "Create new project"
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement("hr", null),
                            React.createElement("br", null)
                        )
                    ),
                    loading,
                    React.createElement(
                        "div",
                        { className: "row projectsList", align: "center" },
                        this.state.projects.map(function (item) {
                            return React.createElement(ProjectBlock, { id: item.id,
                                description: item.description,
                                icon: item.icon,
                                url: item.url,
                                name: item.name,
                                permissions: item.permissions,
                                key: "project" + item.id });
                        })
                    ),
                    bottomSeparator
                );
            }
        });

        // Display a project block on the interface
        var ProjectBlock = React.createClass({
            displayName: "ProjectBlock",

            getInitialState: function getInitialState() {
                var icon = "https://images.synchronise.io/defaultProjectIcon.png";
                if (this.props.icon) {
                    icon = this.props.icon;
                }

                return {
                    iconUrl: icon,
                    contentClassName: ""
                };
            },
            open: function open() {
                document.location.href = "/query/project?id=" + this.props.id;
            },
            componentDidMount: function componentDidMount() {
                this.setState({ contentClassName: "display" });
            },
            render: function render() {
                var description = "";
                if (this.props.description) {
                    description = React.createElement(
                        "small",
                        { className: "hidden-xs" },
                        this.props.description
                    );
                }

                var url = "";
                if (this.props.url) {
                    url = React.createElement(
                        "small",
                        { className: "hidden-xs" },
                        React.createElement(
                            "a",
                            { href: this.props.url, target: "_blank" },
                            this.props.url
                        )
                    );
                }

                var sharedRibbon = "";
                if (!this.props.permissions.own) {
                    sharedRibbon = React.createElement("div", { className: "isSharedRibbon" });
                }

                return React.createElement(
                    "div",
                    { className: "col-lg-3 col-md-4 col-sm-6 col-xs-12 project", align: "center" },
                    React.createElement(
                        "div",
                        { className: "content " + this.state.contentClassName },
                        React.createElement("img", { className: "icon", src: this.state.iconUrl }),
                        React.createElement(
                            "h3",
                            null,
                            this.props.name
                        ),
                        description,
                        url,
                        sharedRibbon,
                        React.createElement(
                            "div",
                            { className: "open", onClick: this.open },
                            "Open"
                        )
                    )
                );
            }
        });

        ReactDOM.render(React.createElement(ProjectsList, null), document.getElementById("projectsList"));
    });
})();