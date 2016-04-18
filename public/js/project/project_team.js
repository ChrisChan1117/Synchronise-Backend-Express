"use strict";

var ProjectModalTeam;
dependenciesLoader(["React", "ReactDOM", "_", "Loader"], function () {
    ProjectModalTeam = React.createClass({
        displayName: "ProjectModalTeam",

        getInitialState: function getInitialState() {
            return {
                teamMembers: [],
                listOfKnownPeople: [],
                loading: true,
                addingMember: false,
                addMemberPermission: 'view',
                valueInputAddMember: '',
                leaving: false
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            // Load the list of members allowed to access this project
            if (this.props.id_project) {
                Synchronise.Cloud.run("teamMembersForProject", { id_project: this.props.id_project, realtime: true }, {
                    success: function success(members) {
                        if (target.isMounted()) {
                            target.setState({
                                teamMembers: members,
                                loading: false
                            });
                        }
                    },
                    error: function error() {
                        if (target.isMounted()) {
                            target.setState({
                                loading: false
                            });
                        }
                    }
                });
            }

            this.setState({
                listOfKnownPeople: this.props.knownUsers
            });
        },
        memberSelected: function memberSelected(item) {
            var target = this;

            if (!this.state.addingMember) {
                target.setState({
                    addingMember: true
                });

                var string = "";
                if (typeof item == "string") {
                    string = item;
                } else {
                    string = item.item.email;
                }
                var permissions = {
                    view: false,
                    edit: false,
                    own: false
                };

                if (typeof permissions[this.state.addMemberPermission] != "undefined") {
                    permissions[this.state.addMemberPermission] = true;
                }
                Synchronise.Cloud.run("addMemberToProject", { searchString: string, permissions: permissions, id_project: this.props.id_project }, {
                    always: function always() {
                        target.setState({
                            addingMember: false,
                            valueInputAddMember: ''
                        });
                    },
                    error: function error(err) {
                        console.log(err);
                        function validateEmail(email) {
                            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            return re.test(email);
                        }

                        // The user we are trying to associate is not registered
                        if (err.error == "undefinedUser") {
                            if (validateEmail(string)) {
                                new ModalConfirm("The user your are trying to add is not registered yet. Would you like to invite that person ?", function (confirm) {
                                    if (confirm) {}
                                });
                            } else {
                                new ModalErrorParse("You are trying to add an incorrect user. Please type the email address of a user or type a name to get suggestions.");
                            }
                        } else {
                            new ModalErrorParse(err);
                        }
                    },
                    success: function success() {}
                });
            }
        },
        selectAddMemberPermissionChange: function selectAddMemberPermissionChange(e) {
            var target = this;
            var value = e.target.value;
            if (value == "own") {
                new ModalConfirm("You are about to give the owner permission to that user. You will no longer have the right to administrate this project if you continue. Are you sure you want to do this ?", function (confirm) {
                    if (confirm) {
                        target.setState({
                            addMemberPermission: value
                        });
                    } else {
                        target.setState({
                            addMemberPermission: 'view'
                        });
                    }
                });
            } else {
                this.setState({
                    addMemberPermission: value
                });
            }
        },
        closeModal: function closeModal() {
            this.props.closeModal();
        },
        leaveProject: function leaveProject() {
            var target = this;
            this.setState({
                leaving: true
            });

            Synchronise.Cloud.run("leaveProject", { id_project: this.props.id_project }, {
                success: function success() {
                    target.closeModal();
                },
                error: function error(err) {
                    new ModalErrorParse(err);
                },
                always: function always() {
                    if (target.isMounted()) {
                        target.setState({
                            leaving: false
                        });
                    }
                }
            });
        },
        render: function render() {
            var target = this;
            var labelForLeaveButton;
            var addMember;
            var membersContent = "";
            var leaveProjectButton;
            var addingMemberLoader = "";
            if (this.state.leaving) {
                labelForLeaveButton = "Leaving Project...";
            } else {
                labelForLeaveButton = "Leave Project";
            }

            if (this.state.teamMembers.length) {
                membersContent = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "col-xs-12" },
                        React.createElement(
                            "table",
                            { className: "table table-striped" },
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
                                        "Email"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "Permission"
                                    )
                                )
                            ),
                            React.createElement(
                                "tbody",
                                null,
                                this.state.teamMembers.map(function (item) {
                                    return React.createElement(ProjectModalTeamMember, { item: item,
                                        id_project: target.props.id_project,
                                        id_user: item.id,
                                        key: "member" + item.id,
                                        permissions: target.props.permissions,
                                        closeModal: target.props.closeModal });
                                })
                            )
                        )
                    )
                );
            }

            /* If the current user is the owner he can add new users to the project but can't quit. */
            if (this.props.permissions.own) {
                addMember = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "col-xs-12" },
                        React.createElement(
                            "div",
                            { className: "col-lg-10" },
                            React.createElement(Typeahead, { type: "text",
                                className: "form-control input-lg",
                                placeholder: "Type an email address or the name of someone you already know",
                                value: this.state.valueInputAddMember,
                                options: this.state.listOfKnownPeople,
                                onSelected: this.memberSelected,
                                /*onChange={this.inputAddMemberChange}*/
                                ref: "addMemberInput" }),
                            addingMemberLoader
                        ),
                        React.createElement(
                            "div",
                            { className: "col-lg-2" },
                            React.createElement(
                                "select",
                                { className: "form-control input-lg", style: { lineHeight: '30px' }, onChange: this.selectAddMemberPermissionChange, defaultValue: "view" },
                                React.createElement(
                                    "option",
                                    { value: "view" },
                                    "View"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "edit" },
                                    "Modify"
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "col-xs-12" },
                        React.createElement("hr", null)
                    )
                );
                leaveProjectButton = "";
            } else {
                addMember = "";
                leaveProjectButton = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "center",
                        null,
                        React.createElement(
                            "button",
                            { className: "btn btn-warning cbutton cbutton--effect-novak", disabled: this.state.leaving, onClick: this.leaveProject },
                            labelForLeaveButton
                        )
                    )
                );
            }

            if (this.state.loading) {
                membersContent = React.createElement(Loader, null);
            }

            if (this.state.addingMember) {
                addingMemberLoader = React.createElement(InfiniteLoader, null);
            }

            return React.createElement(
                "div",
                { role: "tabpanel", className: "tab-pane fade in team " + this.props.state, id: "team" },
                addMember,
                membersContent,
                leaveProjectButton
            );
        }
    });

    var ProjectModalTeamMember = React.createClass({
        displayName: "ProjectModalTeamMember",

        getInitialState: function getInitialState() {
            return {
                loading: false
            };
        },
        changeMemberPermission: function changeMemberPermission(e) {
            var target = this;
            var valueForSelect = "";
            var select = e.target;
            var newPermissions = e.target.value;
            var permissions = {
                view: false,
                edit: false,
                own: false
            };
            switch (newPermissions) {
                case "own":
                    permissions.view = true;
                    permissions.edit = true;
                    permissions.own = true;
                    break;
                case "edit":
                    permissions.view = true;
                    permissions.edit = true;
                    break;
                case "view":
                    permissions.view = true;
                    break;
            }

            if (newPermissions == "own") {
                new ModalConfirm("You are about to give the owner permission to that user. You will no longer have the right to administrate this project if you continue. Are you sure you want to do this ?", function (confirm) {
                    if (confirm) {
                        Synchronise.Cloud.run("changeMemberPermissionsForProject", { id_project: target.props.id_project, id_team_member: target.props.id_user, permissions: permissions }, {
                            success: function success() {
                                target.closeModal();
                            },
                            error: function error(err) {},
                            always: function always(permissions) {}
                        });
                    } else {
                        _.each(Object.keys(target.props.item.permissions), function (current) {
                            if (target.props.item.permissions[current]) {
                                valueForSelect = current;
                            }
                        });
                        select.value = valueForSelect;
                    }
                });
            } else {
                Synchronise.Cloud.run("changeMemberPermissionsForProject", { id_project: this.props.id_project, id_team_member: this.props.id_user, permissions: permissions }, {
                    success: function success() {},
                    error: function error(err) {},
                    always: function always(permissions) {}
                });
            }
        },
        closeModal: function closeModal() {
            this.props.closeModal();
        },
        removeMember: function removeMember() {
            var target = this;

            if (!target.state.loading) {
                target.setState({
                    loading: true
                });
                var element = $(ReactDOM.findDOMNode(target));
                element.animate({
                    opacity: 0.3
                }, 300);
                Synchronise.Cloud.run("removeTeamMemberFromProject", { id_project: this.props.id_project, id_team_member: this.props.id_user }, {
                    success: function success() {
                        element.slideUp();
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                        element.animate({
                            opacity: 1
                        }, 300);
                    },
                    always: function always() {
                        target.setState({
                            loading: false
                        });
                    }
                });
            }
        },
        render: function render() {
            var target = this;
            var selectContent = "";
            var valueForSelect = "";
            var removeContent = "";
            _.each(Object.keys(target.props.item.permissions), function (current) {
                if (target.props.item.permissions[current]) {
                    valueForSelect = current;
                }
            });

            // If the current member display is not already the owner of the project, we can display the option 'owner'
            if (!target.props.item.permissions.own) {
                /* If the active user is the project owner then display the delete button, otherwise nothing.
                Also display a select to set the permissions.*/
                if (this.props.permissions.own) {
                    removeContent = React.createElement("i", { className: "fa fa-trash-o", onClick: target.removeMember, style: { fontSize: '20px' } });
                    selectContent = React.createElement(
                        "select",
                        { className: "form-control", defaultValue: valueForSelect, onChange: this.changeMemberPermission },
                        React.createElement(
                            "option",
                            { value: "view" },
                            "View"
                        ),
                        React.createElement(
                            "option",
                            { value: "edit" },
                            "Edit"
                        ),
                        React.createElement(
                            "option",
                            { value: "own" },
                            "Owner"
                        )
                    );
                } else {
                    removeContent = "";
                    selectContent = React.createElement(
                        "span",
                        { style: { textTransform: "capitalize" } },
                        valueForSelect
                    );
                }
            } else {
                selectContent = "Owner";
                removeContent = "";
            }

            return React.createElement(
                "tr",
                { className: "member" },
                React.createElement(
                    "td",
                    null,
                    target.props.item.name
                ),
                React.createElement(
                    "td",
                    null,
                    target.props.item.email
                ),
                React.createElement(
                    "td",
                    null,
                    selectContent
                ),
                React.createElement(
                    "td",
                    { style: { textAlign: 'center' }, className: "delete" },
                    removeContent
                )
            );
        }
    });
});