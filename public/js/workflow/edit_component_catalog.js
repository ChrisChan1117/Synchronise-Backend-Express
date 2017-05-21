var ComponentCatalog;

dependenciesLoader(["React", "ReactDOM", "_", "Loader"], function () {
    var Transition = React.addons.TransitionGroup;

    // Displays the list of component in the catalog
    // Props:
    // - (function)clickOnComponent: The callback to call when the component is added on the workflow
    // - (boolean)forking: Whether or not the Workflow is currently forking a component to be added
    ComponentCatalog = React.createClass({
        displayName: "ComponentCatalog",
        getInitialState: function () {
            return {
                loading: true,
                projects: [],
                projectsOriginal: [],
                domElement: "",
                searchTerm: ""
            };
        },
        componentDidMount: function () {
            var target = this;
            target.setState({ loading: true, domElement: $(ReactDOM.findDOMNode(target)) });

            $(window).bind("scroll", function () {
                target.resizeInterface();
            });

            $(window).resize(function () {
                target.resizeInterface();
            });

            Synchronise.Cloud.run("projectsListWithComponentsForWorkflow", { cacheFirst: true }, {
                success: function (data) {
                    var data = { projectsOriginal: data };
                    target.setState(data);
                    target.resizeInterface();
                    target.filterResultsForSearch();
                },
                always: function () {
                    target.setState({ loading: false });
                }
            });

            window.setTimeout(function () {
                target.resizeInterface();
            }, 1500);

            //$('body').tooltip({ selector: '[data-toggle=tooltip]' });
        },
        componentWillReceiveProps: function () {
            this.resizeInterface();
        },
        filterResultsForSearch: function (searchTerm) {
            var target = this;
            var matchingProjects = [];
            var search;
            if (typeof searchTerm != "undefined") {
                search = searchTerm;
            } else {
                search = target.state.searchTerm;
            }
            search = search.toLowerCase();

            for (var i = 0; i < target.state.projectsOriginal.length; i++) {
                var currentProject = target.state.projectsOriginal[i];
                var index = currentProject.name.toLowerCase().indexOf(search);

                if (index != -1 || !search.length) {
                    matchingProjects.push(currentProject);
                }
            }

            target.setState({ projects: matchingProjects });
        },
        resizeInterface: function () {
            var element = this.state.domElement;
            if (!element) {
                element = $(ReactDOM.findDOMNode(this));
            }

            if ($(window).width() > 1200) {
                if ($(window).scrollTop() <= 160) {
                    element.stop().css({
                        'marginTop': -$(window).scrollTop() + "px"
                    });

                    element.css("height", $(window).height() - element.position().top + 96);
                } else {
                    element.stop().animate({
                        'marginTop': "-160px"
                    }, 10);

                    element.css("height", $(window).height() - element.position().top + 160);
                }

                element.css("width", $(".leftSide").width());
            } else {
                if (this.state.projects.length) {
                    element.css("height", 200);
                } else {
                    element.css("height", "100%");
                }
                element.css("width", $(".inputContainer").width());
            }

            element.find('.searchContainer').width($('.componentCatalog').width() - 2);

            var widthForkMask = $(ReactDOM.findDOMNode(this)).width();
            var heightForkMask = $(ReactDOM.findDOMNode(this)).height();
            var forkingMask = $(ReactDOM.findDOMNode(this)).find('#forkingMask');
            forkingMask.width(widthForkMask + 20);
            forkingMask.height(heightForkMask + 20);
        },
        searchFieldChanged: function (event) {
            var target = this;
            target.setState({ searchTerm: event.target.value });
            target.filterResultsForSearch(event.target.value);
        },
        render: function () {
            var target = this;
            var content = "";

            if (this.state.loading) {
                content = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(Loader, null)
                );
            } else if (this.state.projects.length) {
                content = React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "searchContainer" },
                        React.createElement("input", { type: "search", className: "form-control", placeholder: "Search by name", onChange: this.searchFieldChanged }),
                        React.createElement("i", { className: "fa fa-search", style: { position: "absolute", right: "15px", marginTop: "-25px" } })
                    ),
                    React.createElement(
                        "div",
                        { className: "listOfProjects row" },
                        React.createElement(
                            Transition,
                            null,
                            this.state.projects.map(function (row) {
                                return React.createElement(ComponentCatalogProject, { id_project: row.id,
                                    clickOnComponent: target.props.clickOnComponent,
                                    key: "project" + row.id });
                            })
                        )
                    )
                );
            } else if (target.state.searchTerm.length) {
                content = React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "searchContainer" },
                        React.createElement("input", { type: "search", className: "form-control", placeholder: "Search by name", onChange: this.searchFieldChanged })
                    ),
                    React.createElement(
                        "div",
                        { className: "row-fluid", style: { textAlign: "center", padding: "5px", margin: "5px", paddingTop: "40px" } },
                        "No results, try a different name."
                    )
                );
            } else {
                content = React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "searchContainer" },
                        React.createElement("input", { type: "search", className: "form-control", placeholder: "Search by name", onChange: this.searchFieldChanged })
                    ),
                    React.createElement(
                        "div",
                        { className: "row-fluid", style: { textAlign: "center", padding: "5px", margin: "5px", paddingTop: "40px" } },
                        "No components available. ",
                        React.createElement("br", null),
                        React.createElement(
                            "a",
                            { href: "/component?displayModalCreate=true&backuri=" + encodeURIComponent("/workflow/edit?id=" + urlH.getParam("id")) + "&backlabel=" + encodeURIComponent("Back to Workflow"), className: "btn btn-primary btn-xs" },
                            "Create a new component"
                        )
                    )
                );
            }

            var displayForForking = "none";
            if (this.props.forking) {
                displayForForking = "block";
            }

            var forking = React.createElement(
                "div",
                { id: "forkingMask", style: { display: displayForForking, position: "fixed", background: "rgba(255,255,255,0.95)", marginTop: "-10px", marginLeft: "-10px", zIndex: 11, fontWeight: "bold", fontFamily: "monospace", fontSize: "2em", textAlign: "center" } },
                React.createElement(Loader, null)
            );

            return React.createElement(
                "div",
                { className: "card componentCatalog",
                    "data-toggle": "tooltip",
                    "data-placement": "right",
                    "data-trigger": "hover",
                    "data-container": "body",
                    "data-delay": "300",
                    title: "This is the catalog of components you can add in your workflow. Click on the name of a project to display all its components. The catalog will display by default all your personal projects. Go on our market place to discover more projects.",
                    style: { paddingLeft: "15px", paddingRight: "15px" } },
                forking,
                React.createElement(
                    "div",
                    { className: "row" },
                    content
                )
            );
        }
    });

    // Display one project in the catalog
    // Props:
    // - (string)id_project: The id of the project to display in the catalog
    // - (function)clickOnComponent: The callback to call when the component is added on the workflow
    var ComponentCatalogProject = React.createClass({
        displayName: "ComponentCatalogProject",
        getInitialState: function () {
            return {
                loading: true,
                listOfComponentsOpened: false,
                icon: "", // Logo of the project
                name: "", // Name of the project
                bg_color: "", // The background color of the project
                txt_color: "", // The text color of the project
                icon_flts: "", // The filter for the image of the icon
                classForProject: "displayed"
            };
        },
        toggleListOfComponents: function () {
            var target = this;
            if (target.isMounted()) {
                this.setState({ listOfComponentsOpened: !this.state.listOfComponentsOpened });
            }
        },
        componentWillAppear: function (callback) {
            var target = this;
            $(ReactDOM.findDOMNode(this)).addClass('displayed');
            window.setTimeout(callback, 300);
        },
        componentWillLeave: function (callback) {
            $(ReactDOM.findDOMNode(this)).removeClass("displayed");
            window.setTimeout(callback, 300);
        },
        componentDidMount: function () {
            var target = this;

            $(ReactDOM.findDOMNode(target)).find('.logo').load(function () {
                $(this).animate({ opacity: 1 });
            });

            // Not uncategorised components
            if (this.props.id_project) {
                target.setState({ loading: true });

                Synchronise.Cloud.run("getProject", { id_project: this.props.id_project, cacheFirst: true }, {
                    success: function (data) {
                        var params = {
                            name: data.name,
                            bg_color: data.bg_color,
                            txt_color: data.txt_color,
                            icon_flts: data.icon_flts
                        };
                        if (data.icon) {
                            params.icon = data.icon;
                        } else {
                            params.icon = "/images/defaultProjectIcon.png";
                        }

                        if (target.isMounted()) {
                            target.setState(params);
                        }
                    },
                    always: function () {
                        if (target.isMounted()) {
                            target.setState({ loading: false });
                        }
                    }
                });
            } else {
                if (target.isMounted()) {
                    target.setState({
                        name: "Uncategorised components",
                        bg_color: "white",
                        txt_color: "black",
                        icon_flts: "",
                        icon: "/images/defaultProjectIcon.png",
                        loading: false
                    });
                }
            }
        },
        render: function () {
            var loader = "";
            if (this.state.loading) {
                loader = React.createElement(Loader, null);
            }

            return React.createElement(
                "div",
                { className: "col-lg-6 col-sm-6 col-xs-12 project " + this.state.classForProject, style: { paddingLeft: "5px", paddingRight: "5px" } },
                loader,
                React.createElement(
                    "div",
                    { className: "card title", onClick: this.toggleListOfComponents, style: { background: this.state.bg_color } },
                    React.createElement(
                        "div",
                        { className: "content" },
                        React.createElement("img", { className: "logo", src: this.state.icon, style: { filter: this.state.icon_flts, borderRadius: "5px" } }),
                        React.createElement(
                            "span",
                            { style: { color: this.state.txt_color } },
                            this.state.name
                        )
                    )
                ),
                React.createElement(ComponentCatalogProjectContent, { opened: this.state.listOfComponentsOpened,
                    clickOnComponent: this.props.clickOnComponent,
                    bg_color: this.state.bg_color,
                    id_project: this.props.id_project })
            );
        }
    });

    // Displays the list of components in a project
    // Props :
    // - (string)id_project : The id of the Project
    // - (boolean)opened    : Whether or not the list of components should be displayed
    // - (function)clickOnComponent: The callback to call when the component is added on the workflow
    // - (string)bg_color : The background color of the project, will be used as the color of the border
    var ComponentCatalogProjectContent = React.createClass({
        displayName: "ComponentCatalogProjectContent",
        getInitialState: function () {
            return {
                components: []
            };
        },
        componentDidMount: function () {
            var target = this;
            if (target.isMounted()) {
                target.setState({ loading: true });
            }

            Synchronise.Cloud.run("getComponentsForProjectForWorkflow", { id: this.props.id_project, realtime: true }, {
                success: function (data) {
                    if (data) {
                        if (target.isMounted()) {
                            target.setState({ components: data });
                        }
                    }
                },
                always: function () {
                    if (target.isMounted()) {
                        target.setState({ loading: false });
                    }
                }
            });
        },
        render: function () {
            var target = this;
            var classForListOfComponents = "";
            var data = "";
            var content = React.createElement("div", null);

            if (this.props.opened) {
                classForListOfComponents = "displayed";
                content = React.createElement(
                    "div",
                    { className: "card listOfComponents " + classForListOfComponents, style: { border: "1px solid " + this.props.bg_color } },
                    this.state.components.map(function (row, index) {
                        return React.createElement(ComponentCatalogProjectComponent, { data: row,
                            clickOnComponent: target.props.clickOnComponent,
                            key: "componentCatalog" + row.id + target.props.index + index });
                    })
                );
            }

            return content;
        }
    });

    // Displays one component of a project in the catalog
    // Props:
    // - (object)data : The data object of the component coming from the server
    // - (function)clickOnComponent: The callback to call when the component is added on the workflow
    var ComponentCatalogProjectComponent = React.createClass({
        displayName: "ComponentCatalogProjectComponent",
        addToWorkflow: function () {
            this.props.clickOnComponent(this.props.data.id);
        },
        render: function () {
            return React.createElement(
                "div",
                { className: "component" },
                React.createElement(
                    "div",
                    { className: "addToWorkflowContainer toDisplayOnHover" },
                    React.createElement(
                        "button",
                        { className: "button", onClick: this.addToWorkflow },
                        "Add to workflow"
                    )
                ),
                React.createElement(
                    "b",
                    { className: "toHideOnHover" },
                    this.props.data.name
                ),
                React.createElement("br", null),
                React.createElement(
                    "small",
                    { className: "toHideOnHover" },
                    this.props.data.description
                )
            );
        }
    });
});