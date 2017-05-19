"use strict";

(function () {
    dependenciesLoader(["React", "ReactDOM", "Synchronise", "Typeahead", "Loader", "ProjectModalInfo", "ProjectModalTeam", "ProjectModalStore"], function () {
        // Display the list of projects
        var ProjectsList = React.createClass({
            displayName: "ProjectsList",

            getInitialState: function getInitialState() {
                return {
                    projects: [],
                    loading: true
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;

                Synchronise.Cloud.run("projectList", { realtime: true, cacheFirst: true }, {
                    success: function success(projects) {
                        var projectsNew = _.each(projects, function (item) {
                            if (!item.icon) {
                                item.icon = "/images/defaultProjectIcon.png";
                            }
                        });

                        target.setState({
                            projects: projectsNew,
                            loading: false
                        });

                        Intercom('update');
                    }
                });

                // Loads the list of known relationship with the current user.
                // This includes all the people he/she has already talked to, worked with in a common project, or invited
                Synchronise.Cloud.run("getUserConnections", { realtime: true, user_object: true }, {
                    success: function success(members) {
                        _.each(members, function (member) {
                            member.text = member.name + " (" + member.email + ")";
                            member.value = member.email;
                        });
                        if (target.isMounted()) {
                            target.setState({
                                listOfKnownPeople: members
                            });
                        }
                    }
                });

                // We should display the modal for new project already
                if (urlH.getParam('displayModalCreate')) {
                    collectInputForProjectAndReturn(false);
                }
            },
            createProject: function createProject() {
                collectInputForProjectAndReturn(false);
            },
            render: function render() {
                var target = this;
                var loading = "";
                if (this.state.loading) {
                    loading = React.createElement(Loader, null);
                }

                var separator = "";
                if (this.state.projects.length || this.state.loading) {
                    separator = React.createElement(
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
                                    "All the components and workflows you create on Synchronise can be stored in a ",
                                    React.createElement(
                                        "b",
                                        null,
                                        "project"
                                    ),
                                    ". You can add your colleagues to a project to give them access to the components and worflows you created."
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
                    separator,
                    React.createElement(
                        "div",
                        { className: "" },
                        React.createElement(
                            "div",
                            { className: "row projectsList", align: "center" },
                            loading,
                            this.state.projects.map(function (item) {
                                return React.createElement(ProjectBlock, { id_project: item.id,
                                    description: item.description,
                                    icon: item.icon,
                                    url: item.url,
                                    name: item.name,
                                    permissions: item.permissions,
                                    key: "project" + item.id,
                                    bg_color: item.bg_color,
                                    txt_color: item.txt_color,
                                    flt_color: item.flt_color,
                                    knownUsers: target.state.listOfKnownPeople });
                            })
                        )
                    )
                );
            }
        });

        // Display a project block on the interface
        // Props :
        // - (string)id_project  : The unique ID of the project
        // - (object)permissions : The permissions of the current user in regards to the project
        // - (object)knownUsers  : The list of users that the current user has been interacting with already in the past
        // - (string)description : The description of the project
        // - (string)url         : The url of the project
        // - (string)icon        : The icon of the project
        // - (string)name        : The name of the project
        // - (string)bg_color    : The background color of the project
        // - (string)txt_color   : The text color of the project
        // - (string)flt_color   : The filter to apply to the project
        var ProjectBlock = React.createClass({
            displayName: "ProjectBlock",

            getInitialState: function getInitialState() {
                return {
                    contentClassName: ""
                };
            },
            settings: function settings() {
                collectInputForProjectAndReturn(this.props.id_project, "info", this.props.permissions, this.props.knownUsers);
            },
            team: function team() {
                collectInputForProjectAndReturn(this.props.id_project, "team", this.props.permissions, this.props.knownUsers);
            },
            "delete": function _delete() {
                var target = this;
                var DOMElement = $(ReactDOM.findDOMNode(target));

                new ModalConfirm("You are about to delete this project. This include all the Components and Workflows attached to it and any other material that you have created. Are you sure you want to do this ?", function (confirm) {
                    if (confirm) {
                        DOMElement.animate({
                            opacity: 0.5
                        }, 300);

                        Synchronise.Cloud.run("removeProject", { id_project: target.props.id_project }, {
                            success: function success() {
                                DOMElement.animate({
                                    width: "0px",
                                    opacity: 0
                                }, 300);
                            },
                            error: function error(_error) {
                                DOMElement.animate({
                                    opacity: 1
                                }, 300);
                                new ModalErrorParse(_error).title('Removing project');
                            }
                        });
                    }
                });
            },
            componentDidMount: function componentDidMount() {
                this.setState({ contentClassName: "display" });

                var icon = $(ReactDOM.findDOMNode(this)).find('.icon');
                icon.css('opacity', '0');

                $(icon).load(function () {
                    $(this).animate({
                        opacity: 1
                    }, 500);
                });
            },
            openProjectUrl: function openProjectUrl() {
                var url = this.props.url;
                if (url.indexOf("http://") == -1 && url.indexOf("https://") == -1) {
                    url = "http://" + url;
                }
                window.open(url, '_blank');
            },
            render: function render() {
                var description = "";
                if (this.props.description) {
                    description = React.createElement(
                        "small",
                        { className: "hidden-xs", style: { color: this.props.txt_color + "!important" } },
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
                            { onClick: this.openProjectUrl, target: "_blank", style: { color: this.props.txt_color + "!important", cursor: "pointer" } },
                            this.props.url
                        )
                    );
                }

                var deleteContent = "";
                var sharedRibbon = "";
                var infoButton = "";
                if (this.props.permissions.own) {
                    infoButton = React.createElement(
                        "div",
                        { className: "settings", onClick: this.settings },
                        React.createElement("i", { className: "fa fa-cog" })
                    );
                    deleteContent = React.createElement(
                        "div",
                        { className: "delete", onClick: this["delete"] },
                        React.createElement("i", { className: "fa fa-trash" })
                    );
                } else {
                    sharedRibbon = React.createElement("div", { className: "isSharedRibbon" });
                }

                return React.createElement(
                    "div",
                    { className: "col-lg-3 col-md-4 col-sm-6 col-xs-12 project", align: "center" },
                    React.createElement(
                        "div",
                        { className: "content card " + this.state.contentClassName, style: { backgroundColor: this.props.bg_color, color: this.props.txt_color } },
                        infoButton,
                        deleteContent,
                        React.createElement(
                            "div",
                            { className: "team", onClick: this.team },
                            React.createElement("i", { className: "fa fa-users" })
                        ),
                        React.createElement("img", { className: "icon", src: this.props.icon }),
                        React.createElement(
                            "h3",
                            { style: { color: this.props.txt_color } },
                            this.props.name
                        ),
                        description,
                        React.createElement(
                            "span",
                            { style: { color: this.props.txt_color } },
                            url
                        ),
                        sharedRibbon
                    )
                );
            }
        });

        // Display a ProjectModal and uses callbacks once completed or aborted
        function collectInputForProjectAndReturn(idProject, tab, permissions, knownUsers) {
            var tabsState = {
                info: "",
                team: "",
                store: ""
            };

            /* if there is no permission passed a new project is being created, so the user will have the owner permissions */
            permissions = permissions || {
                view: true,
                edit: true,
                own: true
            };

            if (permissions.own) {
                tabsState.info = "active";
            } else {
                tabsState.team = "active";
            }

            if (typeof tab != "undefined") {
                _.each(Object.keys(tabsState), function (item) {
                    tabsState[item] = "";
                });

                tabsState[tab] = "active";
            }

            ReactDOM.render(React.createElement(ProjectModal, { id_project: idProject,
                title: "Project",
                tabsState: tabsState,
                permissions: permissions,
                knownUsers: knownUsers }), document.getElementById("projectModal"));
        }

        var ProjectModal = React.createClass({
            displayName: "ProjectModal",

            getInitialState: function getInitialState() {
                return {
                    componentDisplayed: false
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;
                // Close modal on click on the dark background around it

                $(ReactDOM.findDOMNode(target).parentNode).bind("click touchstart", function (e) {
                    if (e.target.id == "projectModal") {
                        target.closeModal();
                    }
                });
                // Close modal on esc
                KeyEventController.subscribeComponent("collectInputForProjectAndReturn", function (key) {
                    if (key == 27) {
                        target.closeModal();
                    }
                });

                $(ReactDOM.findDOMNode(target).parentNode).addClass('fadeInBackground');

                var item = window.setTimeout(function () {
                    $(ReactDOM.findDOMNode(target)).addClass('slideInProject');
                    /*if(target.isMounted()){
                        target.setState({
                            componentDisplayed : true
                        });
                     }*/
                    window.clearTimeout(item);
                }, 300);
            },
            closeModal: function closeModal() {
                var target = this;
                if (target.isMounted()) {
                    $(ReactDOM.findDOMNode(target)).addClass('slideOutProject');
                    window.setTimeout(function () {
                        $(ReactDOM.findDOMNode(target).parentNode).addClass('fadeOutBackground');
                        window.setTimeout(function () {
                            $(ReactDOM.findDOMNode(target).parentNode).removeClass('fadeOutBackground fadeInBackground');
                            ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(target).parentNode);
                        }, 500);
                    }, 300);
                    // Unsubscribe to the esc key event
                    KeyEventController.unsubscribeComponent("collectInputForProjectAndReturn");
                }
            },
            render: function render() {

                var tabs = "";
                if (this.props.id_project) {
                    tabs = React.createElement(TabsForProjectModal, { tabsState: this.props.tabsState, permissions: this.props.permissions });
                }

                var projectInfo = "";
                var projectMarketPlace = "";
                if (this.props.permissions.own == true) {
                    projectInfo = React.createElement(ProjectModalInfo, { state: this.props.tabsState.info,
                        id_project: this.props.id_project,
                        closeModal: this.closeModal,
                        permissions: this.props.permissions,
                        validateButtonLabel: "Save",
                        validateButtonLabelActive: "Saving ..." });

                    projectMarketPlace = React.createElement(ProjectModalStore, { state: this.props.tabsState.store,
                        permissions: this.props.permissions,
                        id_project: this.props.id_project,
                        closeModal: this.closeModal });
                }

                var tabsContent = React.createElement(
                    "div",
                    { className: "tab-content" },
                    projectInfo,
                    React.createElement(ProjectModalTeam, { state: this.props.tabsState.team,
                        permissions: this.props.permissions,
                        id_project: this.props.id_project,
                        closeModal: this.closeModal,
                        knownUsers: this.props.knownUsers }),
                    projectMarketPlace
                );

                return React.createElement(
                    "div",
                    { className: "content", ref: "projectModal" },
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement("i", { className: "fa fa-times pull-right", onClick: this.closeModal })
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement(
                                "legend",
                                null,
                                this.props.title
                            )
                        )
                    ),
                    tabs,
                    " ",
                    tabsContent
                );
            }
        });

        // Display a modal to create or update the data of a project
        // - (object)permissions: permissions of the user for the current object
        var TabsForProjectModal = React.createClass({
            displayName: "TabsForProjectModal",

            render: function render() {
                var classNameInfo = this.props.tabsState.info;
                var classNameTeam = this.props.tabsState.team;
                var classNameStore = this.props.tabsState.store;

                var infoTab = "";
                var marketplaceTab = "";
                if (this.props.permissions.own == true) {
                    infoTab = React.createElement(
                        "li",
                        { style: { float: "none", display: "inline-block" }, role: "projectModal", className: classNameInfo },
                        React.createElement(
                            "a",
                            { href: "#info", "aria-controls": "info", role: "tab", "data-toggle": "tab" },
                            "Info"
                        )
                    );
                    marketplaceTab = React.createElement(
                        "li",
                        { style: { float: "none", display: "inline-block" }, role: "projectModal", className: classNameStore },
                        React.createElement(
                            "a",
                            { href: "#store", "aria-controls": "store", role: "tab", "data-toggle": "tab" },
                            "Marketplace"
                        )
                    );
                }

                return React.createElement(
                    "div",
                    { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 tabsModal" },
                    React.createElement(
                        "ul",
                        { className: "nav nav-tabs", role: "tablist", style: { textAlign: "center" } },
                        infoTab,
                        React.createElement(
                            "li",
                            { style: { float: "none", display: "inline-block" }, role: "projectModal", className: classNameTeam },
                            React.createElement(
                                "a",
                                { href: "#team", "aria-controls": "team", role: "tab", "data-toggle": "tab" },
                                "Team"
                            )
                        ),
                        marketplaceTab
                    )
                );
            }
        });

        ReactDOM.render(React.createElement(ProjectsList, null), document.getElementById("projectsList"));
    });
})();