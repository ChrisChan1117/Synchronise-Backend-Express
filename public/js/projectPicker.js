"use strict";

var ProjectPicker;
dependenciesLoader(["React", "ReactDOM", "$", "_", "Loader"], function () {
    // - (string)idMount: Id of the node where the component has been mounted
    // - (function)onClick: Callback to trigger when a project is clicked
    // - (array)projects: An array of IDs of projects
    ProjectPicker = React.createClass({
        displayName: "ProjectPicker",
        componentDidMount: function componentDidMount() {
            var target = this;

            KeyEventController.subscribeComponent("projectPicker", function (key) {
                if (key == 27) {
                    target.hide();
                }
            });

            if (this.props.projects.length == 1) {
                this.clickOnProject(this.props.projects[0]);
            } else {
                $(ReactDOM.findDOMNode(this)).animate({
                    opacity: 1
                }, 300, function () {
                    $(this).find('.card').animate({ opacity: 1 }, 300);
                });
            }
        },
        hide: function hide() {
            var target = this;
            $(ReactDOM.findDOMNode(this)).find('.card').animate({ opacity: 0 }, 300, function () {
                $(ReactDOM.findDOMNode(this)).animate({ opacity: 0 }, 300, function () {
                    ReactDOM.unmountComponentAtNode(document.getElementById(target.props.idMount));
                });
            });

            KeyEventController.unsubscribeComponent("projectPicker");
        },
        clickOnProject: function clickOnProject(id_project) {
            this.props.onClickProject(id_project);
            this.hide();
        },
        render: function render() {
            var target = this;
            return React.createElement(
                "div",
                { style: { position: "fixed", width: "100%", height: "100%", zIndex: 999, left: "0px", top: "0px", background: "rgba(0,0,0,0.8)", overflowY: "auto", opacity: 0 } },
                React.createElement(
                    "div",
                    { className: "col-xs-12", style: { marginTop: "70px" } },
                    React.createElement("div", { className: "col-lg-2 col-md-1 hidden-sm hidden-xs" }),
                    React.createElement(
                        "div",
                        { className: "col-lg-8 col-md-8 col-sm-12 col-xs-12" },
                        React.createElement(
                            "h3",
                            { style: { textAlign: "center", color: "white" } },
                            "Select a project"
                        ),
                        React.createElement(
                            "div",
                            { className: "card", style: { borderRadius: "3px", background: "rgba(255, 255, 255, 0.9)", opacity: 0 } },
                            React.createElement(
                                "div",
                                { className: "row", style: { marginTop: "35px" } },
                                this.props.projects.map(function (row) {
                                    return React.createElement(ProjectPickerItem, { id: row, key: "ProjectPickerProject" + row, onClickProject: target.clickOnProject.bind(null, row) });
                                })
                            )
                        )
                    ),
                    React.createElement("div", { className: "col-lg-2 col-md-1 hidden-sm hidden-xs" })
                )
            );
        }
    });

    // Props:
    // - (string)id: The id of the project
    // - (function)onClickProject: Callback to trigger when a project is clicked
    var ProjectPickerItem = React.createClass({
        displayName: "ProjectPickerItem",
        getInitialState: function getInitialState() {
            return {
                loading: false,
                project: undefined
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("getProject", { id_project: this.props.id, cacheFirst: true }, {
                success: function success(data) {
                    if (target.isMounted()) {
                        target.setState({ project: data });
                    }
                },
                error: function error(err) {
                    new ModalErrorParse(err);
                },
                always: function always() {
                    if (target.isMounted()) {
                        target.setState({ loading: false });
                    }
                }
            });
        },
        render: function render() {
            var content = "";
            if (!this.state.loading && typeof this.state.project != "undefined") {
                var icon = "https://images.synchronise.io/defaultProjectIcon.png";
                if (this.state.project.icon) {
                    icon = this.state.project.icon;
                }
                content = React.createElement(
                    "div",
                    { className: "panel", onClick: this.props.onClickProject.bind(null, this.props.id), style: { cursor: "pointer", background: this.state.project.bg_color, borderRadius: "5px" } },
                    React.createElement(
                        "div",
                        { style: { position: "absolute", width: "100%", left: "0px", top: "-30px", textAlign: "center" } },
                        React.createElement("img", { src: icon, style: { width: "50px", height: "50px", borderRadius: "5px" } })
                    ),
                    React.createElement(
                        "div",
                        { className: "panel-body" },
                        React.createElement(
                            "h3",
                            { style: { color: this.state.project.txt_color, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
                            this.state.project.name
                        )
                    )
                );
            }

            if (this.state.loading) {
                content = React.createElement(Loader, null);
            }

            return React.createElement(
                "div",
                { className: "col-lg-4 col-md-6 col-sm-12 col-xs-12", style: { marginTop: "15px" } },
                content
            );
        }
    });
});