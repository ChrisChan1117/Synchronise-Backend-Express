"use strict";

var ProjectsList;
var ProjectItem;

dependenciesLoader(["React", "ReactDOM", "$", "Loader"], function () {
    // Display the list of projects
    // Props :
    // - (object)items                  : The list of items created by the user
    // - (object)targetOnCreate         : The callback to trigger when the user want to create a new item for the current project
    // - (function)targetOnClick        : The callback to trigger when an item is clicked
    // - (function)targetOnRemove       : The callback to trigger when an item is attempted to be removed
    // - (boolean)shouldCreate          : Wether or not to display and trigger the callback when the create button is clicked
    // - (boolean)shouldRemove          : Wether or not to display and trigger the callback when the delete an item of project
    // - (boolean)shouldClick           : Wether or not to trigger the callback when when we click on an item of project
    // - (function)shouldDisplayProject : Callback to determine if a project should be displayed or not. The callback receives a project object and should simply return true or false
    ProjectsList = React.createClass({
        displayName: "ProjectsList",
        getInitialState: function getInitialState() {
            return {
                projects: Array(),
                loading: true,
                openedBlock: ""
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;

            Synchronise.Cloud.run("projectList", { realtime: true, cacheFirst: true }, {
                success: function success(projects) {
                    if (target.isMounted()) {
                        target.setState({
                            projects: projects,
                            loading: false
                        });
                    }

                    if (urlH.getParam("projectOpened")) {
                        target.open(urlH.getParam("projectOpened"));
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
        createProject: function createProject() {
            document.location.href = "/project?backuri=" + encodeURIComponent("/query") + "&backlabel=" + encodeURIComponent("Back to query") + "&displayModalCreate=true";
        },
        open: function open(id) {
            var target = this;
            target.setState({ openedBlock: id });

            KeyEventController.subscribeComponent("projectOpened", function (key) {
                if (key == 27) {
                    target.setState({ openedBlock: "" });
                    urlH.insertParam("projectOpened", "");
                    KeyEventController.unsubscribeComponent("projectOpened");
                }
            });

            window.requestAnimationFrame(function () {
                if ($('[id="' + id + '"]').offset()) {
                    $("html, body").animate({ scrollTop: $('[id="' + id + '"]').offset().top - 100 }, 300);
                    urlH.insertParam("projectOpened", id);
                }
            });
        },
        close: function close() {
            var target = this;
            target.setState({ openedBlock: "" });
            KeyEventController.unsubscribeComponent("projectOpened");

            urlH.insertParam("projectOpened", "");
        },
        onCreateItem: function onCreateItem(data) {
            if (this.props.shouldCreate || typeof this.props.shouldCreate == "undefined") {
                this.props.targetOnCreate(data);
            }
        },
        onClickItem: function onClickItem(data) {
            if (this.props.shouldClick || typeof this.props.shouldClick == "undefined") {
                this.props.targetOnClick(data);
            }
        },
        onRemoveItem: function onRemoveItem(data) {
            if (this.props.shouldRemove || typeof this.props.shouldRemove == "undefined") {
                this.props.targetOnRemove(data);
            }
        },
        render: function render() {
            var target = this;

            var loading = "";
            if (this.state.loading) {
                loading = React.createElement(Loader, null);
            }

            return React.createElement(
                "div",
                null,
                loading,
                React.createElement(
                    "div",
                    { className: "row projectsList", align: "center" },
                    this.state.projects.map(function (item) {
                        var shouldDisplayProject = true;

                        if (typeof target.props.shouldDisplayProject != "undefined") {
                            shouldDisplayProject = target.props.shouldDisplayProject(item);
                        }

                        if (shouldDisplayProject) {
                            return React.createElement(ProjectBlock, { id: item.id,
                                description: item.description,
                                icon: item.icon,
                                url: item.url,
                                name: item.name,
                                permissions: item.permissions,
                                bg_color: item.bg_color,
                                txt_color: item.txt_color,
                                flt_color: item.flt_color,
                                wantsToOpen: target.open,
                                close: target.close,
                                opened: target.state.openedBlock == item.id,
                                items: _.filter(target.props.items, function (row) {
                                    return row.id_project == item.id;
                                }),
                                targetOnCreate: target.onCreateItem.bind(null, item.id),
                                targetOnClick: target.onClickItem,
                                targetOnRemove: target.onRemoveItem,
                                shouldCreate: target.props.shouldCreate,
                                shouldClick: target.props.shouldClick,
                                shouldRemove: target.props.shouldRemove,
                                key: "project" + item.id });
                        }
                    })
                )
            );
        }
    });

    // Display a project block on the interface
    // Props
    // - (string)icon             : The icon of the project
    // - (string)id               : The ID of the project
    // - (string)name             : The name of the project
    // - (string)description      : The Description of the project
    // - (string)url              : The URL of the project
    // - (object)permissions      : The permissions of the project in regards to the current user
    // - (boolean)opened          : Whether the project is currently opened on the screen or not
    // - (object)items            : The list of components associated to this project
    // - (function)wantsToOpen    : Notifies the parent React component that the current project wants to be opened on the screen
    // - (function)close          : Notifies the parent React component that the current project wants to be closed
    // - (function)targetOnClick  : The callback to trigger when an item is clicked
    // - (function)targetOnRemove : The callback to trigger when an item is attempted to be removed
    // - (boolean)shouldCreate    : Wether or not to display and trigger the callback when the create button is clicked
    // - (boolean)shouldRemove    : Wether or not to display and trigger the callback when the delete an item of project
    // - (boolean)shouldClick     : Wether or not to trigger the callback when when we click on an item of project
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
            var target = this;
            this.props.wantsToOpen(this.props.id);
        },
        componentDidMount: function componentDidMount() {
            this.setState({ contentClassName: "display" });

            $(ReactDOM.findDOMNode(this)).find('.icon').load(function () {
                $(this).animate({ opacity: 1 });
            });
        },
        createComponent: (function (_createComponent) {
            function createComponent() {
                return _createComponent.apply(this, arguments);
            }

            createComponent.toString = function () {
                return _createComponent.toString();
            };

            return createComponent;
        })(function () {
            createComponent(this.props.id);
        }),
        render: function render() {
            var target = this;

            var description = "";
            if (this.props.description) {
                description = React.createElement(
                    "small",
                    { className: "hidden-xs", style: { color: this.props.txt_color } },
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
                        { href: this.props.url, target: "_blank", style: { color: this.props.txt_color } },
                        this.props.url
                    )
                );
            }

            var sharedRibbon = "";
            if (!this.props.permissions.own) {
                sharedRibbon = React.createElement("div", { className: "isSharedRibbon" });
            }

            var openedClass = "";
            if (this.props.opened) {
                openedClass = "openedProject";
            }

            // Project closed
            var content = React.createElement(
                "div",
                null,
                React.createElement("img", { className: "icon", src: this.state.iconUrl }),
                React.createElement(
                    "h3",
                    { style: { color: this.props.txt_color } },
                    this.props.name
                ),
                description,
                url,
                sharedRibbon,
                React.createElement(
                    "div",
                    { className: "open", onClick: this.open, style: { color: this.props.txt_color, borderColor: this.props.txt_color } },
                    "Open"
                ),
                React.createElement(
                    "span",
                    { className: "amountOfItems", style: { borderColor: this.props.txt_color, color: this.props.txt_color } },
                    this.props.items.length,
                    " ",
                    React.createElement("i", { className: "fa fa-puzzle-piece" })
                )
            );

            // Project opened
            if (this.props.opened) {
                // Remove the open button
                var componentsList = React.createElement(
                    "div",
                    { className: "table-responsive" },
                    React.createElement(
                        "table",
                        { className: "table", style: { background: "white" } },
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
                                    "Last update"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Identifier"
                                ),
                                React.createElement(
                                    "th",
                                    { style: { textAlign: "center" } },
                                    "Status"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Owned"
                                )
                            )
                        ),
                        React.createElement(
                            "tbody",
                            null,
                            this.props.items.map(function (row) {
                                var statusPublication = 0;
                                if (row.published) {
                                    if (row.approved) {
                                        statusPublication = 2; // Published
                                    } else {
                                            if (!row.rejected) {
                                                statusPublication = 1; // Pending
                                            } else {
                                                    statusPublication = 3; // Rejected
                                                }
                                        }
                                }

                                return React.createElement(ProjectItem, { id: row.id,
                                    owned: row.user_id == Synchronise.User.current().id,
                                    key: row.id + target.props.id,
                                    created: row.created_at,
                                    lastUpdate: row.modified_at,
                                    identifier: row.id,
                                    statusPublication: statusPublication,
                                    targetOnClick: target.props.targetOnClick.bind(null, row.id),
                                    targetOnRemove: target.props.targetOnRemove.bind(null, row.id),
                                    shouldClick: target.props.shouldClick,
                                    shouldRemove: target.props.shouldRemove,
                                    name: row.name });
                            })
                        )
                    )
                );

                var createContent = "";
                if (this.props.shouldCreate || typeof this.props.shouldCreate == "undefined") {
                    createContent = React.createElement(
                        "div",
                        { className: "hidden-xs", style: { textAlign: "center", position: "absolute", left: "55px", top: "13px" } },
                        React.createElement(
                            "button",
                            { className: "btn btn-primary btn-sm", onClick: target.props.targetOnCreate },
                            "Create new"
                        )
                    );
                }

                content = React.createElement(
                    "div",
                    { className: "container-fluid" },
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement("img", { className: "icon", src: this.state.iconUrl }),
                            React.createElement(
                                "h3",
                                { style: { color: this.props.txt_color } },
                                this.props.name
                            ),
                            description,
                            url,
                            sharedRibbon,
                            React.createElement(
                                "center",
                                null,
                                React.createElement(
                                    "button",
                                    { className: "btn btn-primary btn-sm visible-xs", onClick: target.props.targetOnCreate },
                                    "Create new"
                                )
                            ),
                            componentsList,
                            createContent,
                            React.createElement(
                                "span",
                                { className: "close", onClick: this.props.close, style: { color: this.props.txt_color } },
                                React.createElement("i", { className: "fa fa-times" })
                            ),
                            React.createElement(
                                "span",
                                { className: "amountOfItems", style: { color: this.props.txt_color, borderColor: this.props.txt_color } },
                                this.props.items.length,
                                " ",
                                React.createElement("i", { className: "fa fa-puzzle-piece" })
                            )
                        )
                    )
                );
            }

            return React.createElement(
                "div",
                { className: "col-lg-3 col-md-4 col-sm-6 col-xs-12 project " + openedClass, align: "center", id: this.props.id },
                React.createElement(
                    "div",
                    { className: "content card " + this.state.contentClassName, style: { backgroundColor: this.props.bg_color, color: this.props.txt_color } },
                    content
                )
            );
        }
    });

    // Displays a row for a Project in the table of component
    // Params :
    // - (string)id               : Id of the component
    // - (string)name             : The name of the component
    // - (string)created          : The date when the component was created
    // - (string)lastUpdate       : The date when the component was last updated
    // - (string)identifier       : The unique identifier of the component
    // - (integer)statusPublication: The status of the publication of the element on the market place
    // - (function)targetOnClick  : The callback to trigger when the item is clicked
    // - (function)targetOnRemove : The callback to trigger when an item is attempted to be removed
    // - (boolean)shouldRemove    : Wether or not to display and trigger the callback when the delete an item of project
    // - (boolean)shouldClick     : Wether or not to trigger the callback when when we click on an item of project
    ProjectItem = React.createClass({
        displayName: "ProjectItem",
        getInitialState: function getInitialState() {
            return { removing: false };
        },
        selectAllIdentifier: function selectAllIdentifier() {
            $(ReactDOM.findDOMNode(this)).find('input').select();
        },
        targetOnClick: function targetOnClick(data, event) {
            if (this.props.shouldClick || typeof this.props.shouldClick == "undefined") {
                this.props.targetOnClick(data, event);
            }
        },
        render: function render() {
            var style = {};
            if (this.state.removing) {
                style.opacity = 0.3;
            }

            var removeContent = React.createElement("td", null);
            if ((this.props.shouldRemove || typeof this.props.shouldRemove == "undefined") && this.props.owned) {
                removeContent = React.createElement(
                    "td",
                    { style: { textAlign: "center" }, onClick: this.props.targetOnRemove },
                    React.createElement("i", { className: "fa fa-times" })
                );
            }

            var labelForMarketPlace = "";
            switch (this.props.statusPublication) {
                case 0:
                    // Not published
                    labelForMarketPlace = React.createElement(
                        "label",
                        { className: "label label-default" },
                        "Not published"
                    );
                    break;

                case 1:
                    // Pending approval
                    labelForMarketPlace = React.createElement(
                        "label",
                        { className: "label label-primary" },
                        "Pending approval"
                    );
                    break;

                case 2:
                    // Published
                    labelForMarketPlace = React.createElement(
                        "label",
                        { className: "label label-success" },
                        "Published"
                    );
                    break;

                case 3:
                    // Rejected
                    labelForMarketPlace = React.createElement(
                        "label",
                        { className: "label label-danger" },
                        "Reject"
                    );
                    break;

                case 4:
                    // Deploying
                    labelForMarketPlace = React.createElement(
                        "label",
                        { className: "label label-warning" },
                        "Deploying"
                    );
                    break;

                default:
                    // Not published
                    labelForMarketPlace = React.createElement(
                        "label",
                        { className: "label label-default" },
                        "Not published"
                    );
                    break;
            }

            var ownedLabel = "";
            if (this.props.owned) {
                ownedLabel = React.createElement(
                    "span",
                    { style: { color: "green" } },
                    "yes"
                );
            } else {
                ownedLabel = React.createElement(
                    "span",
                    { style: { color: "red" } },
                    "no"
                );
            }

            return React.createElement(
                "tr",
                { className: "itemRow", style: style },
                React.createElement(
                    "td",
                    { onClick: this.targetOnClick, style: { textAlign: "left" } },
                    this.props.name
                ),
                React.createElement(
                    "td",
                    { onClick: this.targetOnClick, style: { textAlign: "left" } },
                    React.createElement(TimeAgo, { date: new Date(this.props.created) })
                ),
                React.createElement(
                    "td",
                    { onClick: this.targetOnClick, style: { textAlign: "left" } },
                    React.createElement(TimeAgo, { date: new Date(this.props.lastUpdate) })
                ),
                React.createElement(
                    "td",
                    { onClick: this.selectAllIdentifier, style: { textAlign: "left" } },
                    React.createElement("input", { type: "text",
                        defaultValue: this.props.identifier,
                        readOnly: true,
                        className: "form-control input-xs",
                        style: {
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: "15px",
                            height: "20px"
                        } })
                ),
                React.createElement(
                    "td",
                    { style: { textAlign: "center" } },
                    labelForMarketPlace
                ),
                React.createElement(
                    "td",
                    null,
                    ownedLabel
                ),
                removeContent
            );
        }
    });
});