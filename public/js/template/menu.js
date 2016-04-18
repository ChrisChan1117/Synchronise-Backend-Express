"use strict";

(function () {
    dependenciesLoader(["React", "ReactDOM", "Synchronise", "Skype"], function () {
        ///// TOP MENU /////
        var NavBarRight = React.createClass({
            displayName: "NavBarRight",

            getInitialState: function getInitialState() {
                return {
                    loaded: false
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;
                Synchronise.User.fetchCurrent(function (user) {
                    target.setState({ loaded: true });
                });
            },
            render: function render() {
                var content = "";

                if (this.state.loaded) {
                    if (Synchronise.User.current()) {
                        content = React.createElement(NavBarRightConnected, null);
                    } else {
                        content = React.createElement(NavBarRightOffline, null);
                    }
                }

                return React.createElement(
                    "div",
                    null,
                    content
                );
            }
        });

        var NavBarRightOffline = React.createClass({
            displayName: "NavBarRightOffline",

            render: function render() {
                return React.createElement(
                    "ul",
                    { className: "nav navbar-nav navbar-right" },
                    React.createElement(
                        "li",
                        null,
                        React.createElement(
                            "a",
                            { href: "#", id: "loginSignup", className: "loginSignup" },
                            React.createElement(
                                "u",
                                null,
                                "L"
                            ),
                            "ogin/Signup"
                        )
                    )
                );
            }
        });

        var NavBarRightConnected = React.createClass({
            displayName: "NavBarRightConnected",

            componentDidMount: function componentDidMount() {
                $('[data-toggle=tooltip]').tooltip();
            },
            render: function render() {
                return React.createElement(
                    "ul",
                    { className: "nav navbar-nav navbar-right" },
                    React.createElement(
                        "li",
                        null,
                        React.createElement(
                            "a",
                            { type: "button", "data-toggle": "tooltip", "data-placement": "bottom", href: "#", title: "To trigger a shortcut press ctrl (cmd on mac) + the letter of the shortcut. For example ctrl + u will send you to the Query page. All the letters underscored on the interface are shortcuts you can trigger." },
                            React.createElement("i", { className: "fa fa-question-circle" }),
                            " Shortcuts"
                        )
                    ),
                    React.createElement(
                        "li",
                        { className: "dropdown" },
                        React.createElement(MenuUserLabel, null),
                        React.createElement(
                            "ul",
                            { className: "dropdown-menu", role: "menu" },
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { href: "#" },
                                    "Account"
                                )
                            ),
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { href: "#" },
                                    "Settings"
                                )
                            ),
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { href: "#" },
                                    "Billing"
                                )
                            ),
                            React.createElement("li", { className: "divider" }),
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { href: "#", className: "logout" },
                                    "Logout"
                                )
                            )
                        )
                    )
                );
            }
        });

        var MenuUserLabel = React.createClass({
            displayName: "MenuUserLabel",

            getInitialState: function getInitialState() {
                if (Synchronise.User.current().isAdmin()) {
                    return { username: Synchronise.User.current().name + " (Admin)" };
                } else {
                    return { username: Synchronise.User.current().name };
                }
            },
            render: function render() {
                return React.createElement(
                    "a",
                    { href: "#", className: "dropdown-toggle", "data-toggle": "dropdown" },
                    "Welcome ",
                    this.state.username,
                    " ",
                    React.createElement("span", { className: "caret" })
                );
            }
        });

        ReactDOM.render(React.createElement(NavBarRight, null), document.getElementById("navBarRight"));

        // CONNECTION LOST MESSAGE
        var ConnectionLostBanner = React.createClass({
            displayName: "ConnectionLostBanner",

            getInitialState: function getInitialState() {
                return {
                    disconnected: true,
                    style: { marginTop: "-25px" }
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;

                Synchronise.Connection.Lost(function (reason) {
                    target.setState({ disconnected: true });
                });

                Synchronise.Connection.Connected(function () {
                    target.setState({
                        disconnected: false,
                        style: { marginTop: "0px" }
                    });
                });
            },
            render: function render() {
                var content = React.createElement("div", null);
                if (this.state.disconnected) {
                    content = React.createElement(
                        "div",
                        { id: "connectionLostBanner", style: this.state.style },
                        React.createElement(
                            "div",
                            { className: "content" },
                            "Oops, sounds like we have lost the connection with the server. Reconnecting ..."
                        )
                    );
                }

                return React.createElement(
                    "div",
                    null,
                    content
                );
            }
        });

        ReactDOM.render(React.createElement(ConnectionLostBanner, null), document.getElementById("ConnectionLostBanner"));

        ///// SIDE MENU /////
        var Backbutton = React.createClass({
            displayName: "Backbutton",

            render: function render() {
                return React.createElement(
                    "li",
                    { className: "back_button" },
                    React.createElement(
                        "a",
                        { href: this.props.url },
                        React.createElement("i", { className: "fa fa-chevron-left" }),
                        " ",
                        this.props.label
                    )
                );
            }
        });

        var SuperAdminBlock = React.createClass({
            displayName: "SuperAdminBlock",

            render: function render() {
                return React.createElement(
                    "li",
                    { className: "<%= navbarButtonsState.superadmin %>" },
                    React.createElement(
                        "a",
                        { href: "/superadmin" },
                        React.createElement("i", { className: "fa fa-fw fa-cog" }),
                        " SuperAdmin"
                    )
                );
            }
        });

        var SideMenu = React.createClass({
            displayName: "SideMenu",

            componentDidMount: function componentDidMount() {
                var target = this;

                Skype.ui({
                    "name": "chat",
                    "element": "SkypeButton_Call_synchroniseio_1",
                    "participants": ["synchroniseio"],
                    "imageSize": 24
                });

                target.resizeMenu();

                $(window).resize(function () {
                    target.resizeMenu();
                });
            },
            resizeMenu: function resizeMenu() {
                var target = this;

                var windowHeight = $(window).height();
                var navbarHeight = $('.navbar').height();
                var suggestionBlock = $(ReactDOM.findDOMNode(this)).find('.suggestionBlock').height();
                var margin = 10;
                var maxHeight = windowHeight - (navbarHeight + suggestionBlock + 10);

                $(ReactDOM.findDOMNode(this)).find('.side-nav').css('maxHeight', maxHeight + 'px');
            },
            render: function render() {
                var backButton = "";
                if (urlH.getParam('backuri')) {
                    backButton = React.createElement(Backbutton, { url: decodeURIComponent(urlH.getParam('backuri')), label: decodeURIComponent(urlH.getParam('backlabel')) });
                }

                var superAdminBlock = "";
                if (Synchronise.User.current().isAdmin()) {
                    superAdminBlock = React.createElement(SuperAdminBlock, null);
                }

                return React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "collapse navbar-collapse navbar-ex1-collapse hidden-xs" },
                        React.createElement(
                            "ul",
                            { className: "nav navbar-nav side-nav" },
                            backButton,
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.subdashboard },
                                React.createElement(
                                    "a",
                                    { href: "/dashboard" },
                                    React.createElement("i", { className: "fa fa-fw fa-dashboard" }),
                                    " ",
                                    React.createElement(
                                        "u",
                                        null,
                                        "D"
                                    ),
                                    "ashboard"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.query },
                                React.createElement(
                                    "a",
                                    { href: "/query" },
                                    React.createElement("i", { className: "fa fa-fw fa-random" }),
                                    " Q",
                                    React.createElement(
                                        "u",
                                        null,
                                        "u"
                                    ),
                                    "eries"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.project },
                                React.createElement(
                                    "a",
                                    { href: "/project" },
                                    React.createElement("i", { className: "fa fa fa-cubes" }),
                                    " ",
                                    React.createElement(
                                        "u",
                                        null,
                                        "P"
                                    ),
                                    "rojects"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.component },
                                React.createElement(
                                    "a",
                                    { href: "/component" },
                                    React.createElement("i", { className: "fa fa-puzzle-piece" }),
                                    " C",
                                    React.createElement(
                                        "u",
                                        null,
                                        "o"
                                    ),
                                    "mponents"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.database },
                                React.createElement(
                                    "a",
                                    { href: "/database" },
                                    React.createElement("i", { className: "fa fa-fw fa-database" }),
                                    " Data",
                                    React.createElement(
                                        "u",
                                        null,
                                        "b"
                                    ),
                                    "ases"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.analytics },
                                React.createElement(
                                    "a",
                                    { href: "/analytics" },
                                    React.createElement("i", { className: "fa fa-fw fa-line-chart" }),
                                    " ",
                                    React.createElement(
                                        "u",
                                        null,
                                        "A"
                                    ),
                                    "nalytics"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.api },
                                React.createElement(
                                    "a",
                                    { href: "/api" },
                                    React.createElement("i", { className: "fa fa-fw fa-key" }),
                                    " API ",
                                    React.createElement(
                                        "u",
                                        null,
                                        "k"
                                    ),
                                    "eys"
                                )
                            ),
                            superAdminBlock
                        ),
                        React.createElement(
                            "div",
                            { className: "suggestionBlock" },
                            React.createElement(
                                "div",
                                { className: "content" },
                                React.createElement(
                                    "h3",
                                    null,
                                    "Customer feedback"
                                ),
                                React.createElement(
                                    "h5",
                                    null,
                                    "Have a suggestion ? Encounter an evil bug ? We want to improve that. Let us know what we can do."
                                ),
                                React.createElement(
                                    "div",
                                    { className: "row" },
                                    React.createElement(
                                        "div",
                                        { className: "col-lg-6", style: { textAlign: "center" } },
                                        React.createElement(
                                            "button",
                                            { className: "btn btn-primary btn-xs" },
                                            "Feedback"
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "col-lg-6", style: { textAlign: "center" } },
                                        React.createElement("div", { id: "SkypeButton_Call_synchroniseio_1", style: { textAlign: "center" } })
                                    )
                                )
                            )
                        ),
                        React.createElement("div", { id: "SkypeButton_Call_synchroniseio_1", style: { textAlign: "center", position: "absolute", bottom: "40px", width: "100%" } })
                    ),
                    React.createElement(
                        "div",
                        { id: "mobile_dashboard_side_nav", className: "visible-xs" },
                        React.createElement(
                            "ul",
                            { className: "list-inline" },
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.subdashboard },
                                React.createElement(
                                    "a",
                                    { href: "/dashboard" },
                                    React.createElement("i", { className: "fa fa-fw fa-dashboard" }),
                                    " Dashboard"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.query },
                                React.createElement(
                                    "a",
                                    { href: "/query" },
                                    React.createElement("i", { className: "fa fa-fw fa-random" }),
                                    " Queries"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.project },
                                React.createElement(
                                    "a",
                                    { href: "/project" },
                                    React.createElement("i", { className: "fa fa fa-cubes" }),
                                    " Projects"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.component },
                                React.createElement(
                                    "a",
                                    { href: "/component" },
                                    React.createElement("i", { className: "fa fa-puzzle-piece" }),
                                    " Components"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.database },
                                React.createElement(
                                    "a",
                                    { href: "/database" },
                                    React.createElement("i", { className: "fa fa-fw fa-database" }),
                                    " Databases"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.analytics },
                                React.createElement(
                                    "a",
                                    { href: "/analytics" },
                                    React.createElement("i", { className: "fa fa-fw fa-line-chart" }),
                                    " Analytics"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.api },
                                React.createElement(
                                    "a",
                                    { href: "/api" },
                                    React.createElement("i", { className: "fa fa-fw fa-key" }),
                                    " API keys"
                                )
                            ),
                            superAdminBlock
                        ),
                        React.createElement("hr", null)
                    )
                );
            }
        });

        // navbarButtonsState is only available when we are on the dashboard
        if (typeof navbarButtonsState != "undefined") {
            ReactDOM.render(React.createElement(SideMenu, { buttonsStates: navbarButtonsState }), document.getElementById("SideMenu"));
        } else {
            ReactDOM.render(React.createElement(SideMenu, null), document.getElementById("SideMenu"));
        }
    });
})();