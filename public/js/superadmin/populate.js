"use strict";

dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function () {
    // This creates and populates a fake database for development purposes
    var RecordsPopulate = React.createClass({
        displayName: "RecordsPopulate",
        getInitialState: function getInitialState() {
            return {
                loading: false,
                loadingWL: false,
                emailField: "",
                emailFieldWL: "",
                emailForPermission: "",
                searchingForPermissions: false,
                permissionsForUser: [],
                permissionToAdd: "",
                savingPermission: false,
                changingPlanForUser: false,
                emailForPlan: "",
                planToSet: ""
            };
        },
        emailFieldChange: function emailFieldChange(name, e) {
            if (!this.state.loading) {
                var data = {};
                data[name] = e.target.value;
                this.setState(data);
            }
        },
        populate: function populate() {
            var target = this;

            if (!target.state.loading) {
                target.setState({ loading: true });

                Synchronise.Cloud.run("superadminPopulateDatabase", { email: target.state.emailField }, {
                    success: function success() {
                        target.setState({ emailField: "" });
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    progress: function progress(_progress, message) {
                        console.log("Progress : " + JSON.stringify(_progress) + " - Message : " + JSON.stringify(message));
                    },
                    always: function always() {
                        target.setState({ loading: false });
                    }
                });
            }
        },
        populateWL: function populateWL() {
            var target = this;

            if (!target.state.loadingWL) {
                target.setState({ loadingWL: true });

                Synchronise.Cloud.run("superadminPopulateWhiteList", { email: target.state.emailFieldWL }, {
                    success: function success() {
                        target.setState({ emailFieldWL: "" });
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    progress: function progress(_progress2, message) {
                        console.log("Progress : " + JSON.stringify(_progress2) + " - Message : " + JSON.stringify(message));
                    },
                    always: function always() {
                        target.setState({ loadingWL: false });
                    }
                });
            }
        },
        findPermissionsForUser: function findPermissionsForUser() {
            if (!this.state.searchingForPermissions) {
                var target = this;
                target.setState({ searchingForPermissions: true });

                Synchronise.Cloud.run("userObject", { user_id: target.state.emailForPermission }, {
                    success: function success(user) {
                        target.setState({ permissionsForUser: user.roles });
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    always: function always() {
                        target.setState({ searchingForPermissions: false });
                    }
                });
            }
        },
        // Save the email field for permission finder
        emailForPermissionChanged: function emailForPermissionChanged(event) {
            var target = this;
            target.setState({ emailForPermission: event.target.value });
        },
        removePermissionForUser: function removePermissionForUser(permissionObject) {
            if (!this.state.searchingForPermissions) {
                var target = this;
                target.setState({ searchingForPermissions: true });

                Synchronise.Cloud.run("superadminRemovePermissionForUser", { id_role: permissionObject.id, id_user: target.state.emailForPermission }, {
                    success: function success() {
                        target.findPermissionsForUser();
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    always: function always() {
                        target.setState({ searchingForPermissions: true });
                    }
                });
            }
        },
        addPermissionForUser: function addPermissionForUser() {
            if (!this.state.savingPermission) {
                var target = this;
                target.setState({ savingPermission: true });

                if (target.state.emailForPermission.length && target.state.permissionToAdd.length) {
                    Synchronise.Cloud.run("superadminAddPermissionForUser", { role_name: target.state.permissionToAdd, id_user: target.state.emailForPermission }, {
                        success: function success() {
                            target.findPermissionsForUser();
                        },
                        error: function error(err) {
                            new ModalErrorParse(err);
                        },
                        always: function always() {
                            target.setState({ savingPermission: false });
                        }
                    });
                }
            }
        },
        permissionToAddChange: function permissionToAddChange(event) {
            var target = this;
            target.setState({ permissionToAdd: event.target.value });
        },
        emailForPlanChanged: function emailForPlanChanged(event) {
            var target = this;
            target.setState({ emailForPlan: event.target.value });
        },
        changePlanForUser: function changePlanForUser() {
            var target = this;
            if (!target.state.changingPlanForUser) {
                target.setState({ changingPlanForUser: true });

                Synchronise.Cloud.run("superadminChangePlanForUser", { email_user: target.state.emailForPlan, plan: target.state.planToSet }, {
                    success: function success() {
                        target.setState({ emailForPlan: "", planToSet: "" });
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    always: function always() {
                        target.setState({ changingPlanForUser: false });
                    }
                });
            }
        },
        planToSetChanged: function planToSetChanged(event) {
            var target = this;
            target.setState({ planToSet: event.target.value });
        },
        render: function render() {
            var target = this;

            var populateButtonLabel = "Populate";
            if (this.state.loading) {
                populateButtonLabel = "Populating ...";
            }

            var populateButtonLabelWL = "Populate";
            if (this.state.loadingWL) {
                populateButtonLabelWL = "Populating ...";
            }

            var findPermissionsButtonLabel = "Find permissions for user";
            if (this.state.searchingForPermissions) {
                findPermissionsButtonLabel = "Searching...";
            }

            var addPermissionsButtonLabel = "Add new permission";
            var changePlanButtonLabel = "Change plan";

            if (this.state.changingPlanForUser) {
                changePlanButtonLabel = "Saving...";
            }

            return React.createElement(
                "div",
                { className: "row-fluid" },
                React.createElement(
                    "div",
                    { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 card" },
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-lg-8 col-md-8 col-sm-12 col-xs-12" },
                            React.createElement(
                                "form",
                                { className: "form-horizontal" },
                                React.createElement(
                                    "div",
                                    { className: "form-group" },
                                    React.createElement(
                                        "label",
                                        { htmlFor: "emailField" },
                                        "Users permissions"
                                    ),
                                    React.createElement("input", { id: "emailField",
                                        type: "text",
                                        placeholder: "Email address of the user",
                                        className: "form-control",
                                        value: this.state.emailForPermission,
                                        onChange: this.emailForPermissionChanged }),
                                    this.state.permissionsForUser.map(function (permission) {
                                        return React.createElement(
                                            "label",
                                            { className: "label label-primary", style: { marginLeft: "5px" } },
                                            permission.name,
                                            " ",
                                            React.createElement("i", { className: "fa fa-times", onClick: target.removePermissionForUser.bind(null, permission) })
                                        );
                                    })
                                )
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
                                style: { textAlign: "center" } },
                            React.createElement(
                                "button",
                                { className: "btn btn-primary cbutton cbutton--effect-novak",
                                    onClick: this.findPermissionsForUser },
                                React.createElement("i", { className: "fa fa-refresh hidden fa-spin" }),
                                " ",
                                React.createElement(
                                    "span",
                                    { className: "label" },
                                    findPermissionsButtonLabel
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-lg-8 col-md-8 col-sm-12 col-xs-12" },
                            React.createElement(
                                "form",
                                { className: "form-horizontal" },
                                React.createElement(
                                    "div",
                                    { className: "form-group" },
                                    React.createElement("input", { id: "emailField",
                                        type: "text",
                                        placeholder: "Permission to add",
                                        className: "form-control",
                                        value: this.state.permissionToAdd,
                                        onChange: this.permissionToAddChange })
                                )
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
                                style: { textAlign: "center" } },
                            React.createElement(
                                "button",
                                { className: "btn btn-primary cbutton cbutton--effect-novak",
                                    onClick: this.addPermissionForUser },
                                React.createElement("i", { className: "fa fa-refresh hidden fa-spin" }),
                                " ",
                                React.createElement(
                                    "span",
                                    { className: "label" },
                                    addPermissionsButtonLabel
                                )
                            )
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 card" },
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-lg-8 col-md-8 col-sm-12 col-xs-12" },
                            React.createElement(
                                "form",
                                { className: "form-horizontal" },
                                React.createElement(
                                    "div",
                                    { className: "form-group" },
                                    React.createElement(
                                        "label",
                                        { htmlFor: "emailField" },
                                        "User plan"
                                    ),
                                    React.createElement("input", { id: "emailField",
                                        type: "text",
                                        placeholder: "Email address of the user",
                                        className: "form-control",
                                        value: this.state.emailForPlan,
                                        onChange: this.emailForPlanChanged })
                                )
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
                                style: { textAlign: "center" } },
                            React.createElement(
                                "button",
                                { className: "btn btn-primary cbutton cbutton--effect-novak",
                                    onClick: this.changePlanForUser },
                                React.createElement("i", { className: "fa fa-refresh hidden fa-spin" }),
                                " ",
                                React.createElement(
                                    "span",
                                    { className: "label" },
                                    changePlanButtonLabel
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-lg-8 col-md-8 col-sm-12 col-xs-12" },
                            React.createElement(
                                "form",
                                { className: "form-horizontal" },
                                React.createElement(
                                    "div",
                                    { className: "form-group" },
                                    React.createElement("input", { id: "emailField",
                                        type: "text",
                                        placeholder: "Plan to set",
                                        className: "form-control",
                                        value: this.state.planToSet,
                                        onChange: this.planToSetChanged })
                                )
                            )
                        )
                    )
                )
            );
        }
    });

    var isAllowedThisSection;
    _.each(Synchronise.User.current().roles, function (row) {
        if (row.name == "superadmin" || row.name == "admin") {
            isAllowedThisSection = true;
        }
    });

    if (isAllowedThisSection) {
        ReactDOM.render(React.createElement(RecordsPopulate, null), document.getElementById("recordsPopulate"));
    }
});