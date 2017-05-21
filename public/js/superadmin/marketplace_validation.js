dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function () {
    var MarketplaceValidation = React.createClass({
        displayName: "MarketplaceValidation",
        getInitialState: function () {
            return {
                loading: false,
                loaded: false,
                data: {
                    components: [],
                    workflows: []
                }
            };
        },
        componentDidMount: function () {
            var target = this;

            $(ReactDOM.findDOMNode(this)).on('click', '#loadMarkplaceValidation', function () {
                target.loadData();
            });
        },
        loadData: function () {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("superadminLoadMarketplaceValidationData", { realtime: true }, {
                success: function (data) {
                    target.setState({ data: data });
                },
                error: function (err) {
                    new ModalErrorParse(err);
                },
                always: function () {
                    target.setState({ loading: false, loaded: true });
                }
            });
        },
        render: function () {
            var content = "";

            if (!this.state.loaded && !this.state.loading) {
                content = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(
                        "button",
                        { className: "btn btn-primary", onClick: this.loadData },
                        "Load data"
                    )
                );
            } else if (this.state.loading) {
                content = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(Loader, null)
                );
            } else {
                content = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "card" },
                        React.createElement(
                            "legend",
                            null,
                            "Components"
                        )
                    ),
                    this.state.data.components.map(function (row) {
                        return React.createElement(MarketplaceValidationComponentItem, { key: row.id + "componentItem", data: row });
                    }),
                    React.createElement(
                        "div",
                        { className: "card" },
                        React.createElement(
                            "legend",
                            null,
                            "Workflows"
                        )
                    )
                );
            }

            return content;
        }
    });

    var MarketplaceValidationComponentItem = React.createClass({
        displayName: "MarketplaceValidationComponentItem",
        getInitialState: function () {
            return {
                loading: false,
                loaded: false,
                opened: false,
                project: false,
                user: false
            };
        },
        componentDidMount: function () {
            var target = this;
        },
        toggleComponentDisplay: function () {
            var target = this;
            target.setState({ opened: !target.state.opened });

            target.loadData();
        },
        loadData: function () {
            var target = this;
            if (!target.state.loaded && !target.state.loading) {
                target.setState({ loading: true });

                Synchronise.Cloud.run("getProject", { id_project: this.props.data.id_project }, {
                    success: function (data) {
                        target.setState({ project: data });
                    },
                    error: function (err) {
                        new ModalErrorParse(err);
                    },
                    always: function () {
                        target.setState({ loaded: true, loading: false });
                    }
                });

                Synchronise.Cloud.run("userObject", { user_id: this.props.data.user_id }, {
                    success: function (data) {
                        target.setState({ user: data });
                    },
                    error: function (err) {
                        new ModalErrorParse(err);
                    },
                    always: function () {
                        target.setState({ loaded: true });
                    }
                });
            }
        },
        approveComponent: function () {
            var target = this;
            if (!this.state.approving) {
                target.setState({ approving: true });

                Synchronise.Cloud.run("superadminApproveComponent", { id: this.props.data.id }, {
                    error: function (err) {
                        new ModalErrorParse(err);
                    }
                });
            }
        },
        render: function () {
            var projectContent = "";
            if (this.state.project) {
                var urlProject = "";
                if (this.state.project.url) {
                    urlProject = React.createElement(
                        "a",
                        { href: this.state.project.url, style: { color: this.state.project.txt_color } },
                        this.state.project.url
                    );
                }

                var descriptionProject = "";
                if (this.state.project.url) {
                    descriptionProject = React.createElement(
                        "p",
                        { style: { color: this.state.project.txt_color } },
                        this.state.project.description
                    );
                }

                var descriptionComponent = "";
                if (this.props.data.description) {
                    descriptionComponent = React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "b",
                            null,
                            "Description"
                        ),
                        React.createElement(
                            "p",
                            null,
                            this.props.data.description
                        )
                    );
                }

                projectContent = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Project"
                    ),
                    React.createElement(
                        "div",
                        { className: "well", style: { background: this.state.project.bg_color, borderRadius: "5px" } },
                        React.createElement(
                            "legend",
                            { style: { color: this.state.project.txt_color } },
                            React.createElement("img", { src: this.state.project.icon, height: "25px", style: { borderRadius: "5px" } }),
                            " ",
                            this.state.project.name
                        ),
                        urlProject,
                        descriptionProject
                    )
                );
            }

            var userContent = "";
            if (this.state.user) {
                var avatar = "";
                if (this.state.user.avatar) {
                    avatar = React.createElement("img", { src: this.state.user.avatar, width: "50px", className: "img-circle" });
                }

                var formattedTotalRequests = this.state.user.requests_executed;
                if (formattedTotalRequests > 1000 && formattedTotalRequests < 1000000) {
                    formattedTotalRequests = Math.round(formattedTotalRequests / 1000) + "K";
                } else if (formattedTotalRequests > 1000000 && formattedTotalRequests < 1000000000) {
                    formattedTotalRequests = Math.round(formattedTotalRequests / 1000000) + "M";
                } else if (formattedTotalRequests > 1000000000) {
                    formattedTotalRequests = Math.round(formattedTotalRequests / 1000000000) + "B";
                }

                var formattedTotalBonusRequests = this.state.user.bonus_requests;
                if (formattedTotalBonusRequests > 1000 && formattedTotalBonusRequests < 1000000) {
                    formattedTotalBonusRequests = Math.round(formattedTotalBonusRequests / 1000) + "K";
                } else if (formattedTotalBonusRequests > 1000000 && formattedTotalBonusRequests < 1000000000) {
                    formattedTotalBonusRequests = Math.round(formattedTotalBonusRequests / 1000000) + "M";
                } else if (formattedTotalBonusRequests > 1000000000) {
                    formattedTotalBonusRequests = Math.round(formattedTotalBonusRequests / 1000000000) + "B";
                }

                var stripeContent = "";
                if (this.state.user.id_stripe) {
                    stripeContent = React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "b",
                            null,
                            "Stripe"
                        ),
                        React.createElement("br", null),
                        this.state.user.id_stripe,
                        React.createElement("br", null),
                        React.createElement(
                            "a",
                            { className: "btn btn-primary", href: "https://dashboard.stripe.com/customers/" + this.state.user.id_stripe, target: "_blank" },
                            "Open dashboard"
                        )
                    );
                }

                var referrerContent = "";
                if (this.state.user.referral) {
                    referrerContent = React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "b",
                            null,
                            "Referrer ID"
                        ),
                        React.createElement("br", null),
                        this.state.user.referral
                    );
                }

                userContent = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "User"
                    ),
                    React.createElement(
                        "div",
                        { className: "well" },
                        avatar,
                        React.createElement(
                            "h5",
                            null,
                            this.state.user.name
                        ),
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "b",
                                null,
                                "Email"
                            ),
                            React.createElement("br", null),
                            this.state.user.email
                        ),
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "b",
                                null,
                                "Username"
                            ),
                            React.createElement("br", null),
                            this.state.user.username
                        ),
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "b",
                                null,
                                "Total requests executed"
                            ),
                            React.createElement("br", null),
                            formattedTotalRequests
                        ),
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "b",
                                null,
                                "Bonus requests"
                            ),
                            React.createElement("br", null),
                            formattedTotalBonusRequests
                        ),
                        stripeContent,
                        referrerContent,
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "b",
                                null,
                                "Type login"
                            ),
                            React.createElement("br", null),
                            this.state.user.type_login
                        )
                    )
                );
            }

            var labelForApproveButton = "Approve component";
            if (this.state.approving) {
                labelForApproveButton = "Approving";
            }

            var content = React.createElement(
                "div",
                { className: "container-fluid" },
                React.createElement(
                    "div",
                    { className: "card" },
                    React.createElement(
                        "a",
                        { onClick: this.toggleComponentDisplay, role: "button", "data-toggle": "collapse", href: "#component" + this.props.data.id, "aria-expanded": "false", "aria-controls": "#component" + this.props.data.id },
                        this.props.data.name
                    ),
                    React.createElement(
                        "div",
                        { className: "collapse", id: "component" + this.props.data.id, style: { marginTop: "10px" } },
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "div",
                                { className: "col-xs-12" },
                                React.createElement(
                                    "div",
                                    { className: "col-xs-8" },
                                    React.createElement(
                                        "legend",
                                        null,
                                        "Component"
                                    ),
                                    React.createElement(
                                        "div",
                                        null,
                                        React.createElement(
                                            "b",
                                            null,
                                            "Title"
                                        ),
                                        React.createElement(
                                            "p",
                                            null,
                                            this.state.project.name
                                        )
                                    ),
                                    descriptionComponent,
                                    React.createElement(
                                        "div",
                                        { style: { textAlign: "center" } },
                                        React.createElement(
                                            "div",
                                            { className: "btn-group", style: { textAlign: "center" } },
                                            React.createElement(
                                                "a",
                                                { className: "btn btn-primary", target: "_blank", href: "/component/edit?id=" + this.props.data.id },
                                                "Explore component"
                                            ),
                                            React.createElement(
                                                "button",
                                                { className: "btn btn-success", onClick: this.approveComponent },
                                                labelForApproveButton
                                            )
                                        )
                                    )
                                ),
                                React.createElement(
                                    "div",
                                    { className: "col-xs-4" },
                                    projectContent,
                                    userContent
                                )
                            )
                        )
                    )
                )
            );

            return content;
        }
    });

    var isAllowedThisSection;
    _.each(Synchronise.User.current().roles, function (row) {
        if (row.name == "superadmin" || row.name == "admin" || row.name == "marketplaceValidation") {
            isAllowedThisSection = true;
        }
    });

    if (isAllowedThisSection) {
        ReactDOM.render(React.createElement(MarketplaceValidation, null), document.getElementById("MarketplaceValidation"));
    }
});