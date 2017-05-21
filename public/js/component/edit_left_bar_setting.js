var Setting;

dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "urlH"], function () {
    // Displays the tab set the setting of a component
    Setting = React.createClass({
        getInitialState: function () {
            return {
                public_key: "",
                loading_key: false,
                publishing: false,
                cancellingSubmission: false,
                name: "",
                description: "",
                published: false,
                approved: false,
                stateButtonAddTags: "",
                tagFieldValue: ""
            };
        },
        componentDidMount: function () {
            var target = this;

            // This part cannot be realtime updated because it causes collisions with the user typing in the input for the name
            Synchronise.Cloud.run("loadComponent", { id: urlH.getParam("id") }, {
                success: function (data) {
                    if (target.isMounted()) {
                        target.setState({ name: data.component.name, description: data.component.description });
                    }
                    document.title = data.component.name;
                }
            });

            // This part needs to be realtime updated
            Synchronise.Cloud.run("loadComponent", { id: urlH.getParam("id"), realtime: true }, {
                success: function (data) {
                    if (target.isMounted()) {
                        target.setState({
                            published: data.component.published,
                            approved: data.component.approved,
                            isForked: data.component.isForked,
                            publishing: false,
                            cancellingSubmission: false
                        });
                    }
                }
            });
        },
        nameChanged: function (event) {
            var target = this;
            target.setState({ name: event.target.value });
            document.title = event.target.value;

            Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { name: event.target.value } }, {
                success: function () {
                    target.setState({ error: false });
                }
            });
        },
        descriptionChanged: function (event) {
            var target = this;
            target.setState({ description: event.target.value });

            Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { description: event.target.value } }, {
                success: function () {
                    target.setState({ error: false });
                }
            });
        },
        publishComponent: function () {
            var target = this;
            target.setState({ publishing: true });

            Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { published: true } }, {});
        },
        cancelSubmission: function () {
            var target = this;
            target.setState({ cancellingSubmission: true });

            Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { published: false } }, {
                always: function () {
                    target.setState({ cancellingSubmission: false });
                }
            });
        },
        addTagsButton: function (event) {
            var target = this;
            if (target.state.stateButtonAddTags == "active") {
                target.setState({ stateButtonAddTags: "" });
            } else {
                target.setState({ stateButtonAddTags: "active" });
                $("#addTags").focus();
            }
        },
        tagFieldKeyDown: function (event) {
            var target = this;
            if (event.key == "Enter") {
                if (target.state.tagFieldValue.length) {
                    var value = target.state.tagFieldValue;
                    target.props.addTag(value);
                    target.setState({ tagFieldValue: "", stateButtonAddTags: "" });
                    $("#addTag").blur();
                }
            }
        },
        tagFieldOnChange: function (event) {
            var target = this;
            target.setState({ tagFieldValue: event.target.value });
        },
        render: function () {
            var target = this;

            var compName = React.createElement(Loader, null);
            if (!this.state.loading) {
                compName = React.createElement(
                    "div",
                    { className: "col-lg-6 col-md-6 col-sm-12 col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "label",
                            null,
                            "Component name"
                        ),
                        React.createElement("input", { type: "text",
                            onChange: this.nameChanged,
                            value: this.state.name,
                            className: "form-control input-lg",
                            placeholder: "Sending an email, sending a push notification..." })
                    )
                );
            }

            var compDescription = React.createElement(Loader, null);
            if (!this.state.loading) {
                compDescription = React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "label",
                            null,
                            "Component description"
                        ),
                        React.createElement("textarea", { type: "text",
                            onChange: this.descriptionChanged,
                            value: this.state.description,
                            className: "form-control input-lg",
                            placeholder: "This component allows you to do this and that. You can send it some parameters to do this thing or that thing." })
                    )
                );
            }

            var compIdentifier = "";
            if (!this.state.loading) {
                compIdentifier = React.createElement(
                    "div",
                    { className: "col-lg-6 col-md-6 col-sm-12 col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "label",
                            null,
                            "Identifier"
                        ),
                        React.createElement("input", { className: "form-control input-lg",
                            type: "text",
                            value: this.props.component.id,
                            onFocus: this.onFocusIdentifier,
                            readOnly: true,
                            placeholder: "Identifier" })
                    )
                );
            }

            var contentForMarketplace = "";
            if (!this.state.published && !this.state.approved) {
                var button = React.createElement(
                    "button",
                    { className: "btn btn-primary", onClick: this.publishComponent },
                    "Publish component"
                );
                if (this.state.publishing) {
                    button = React.createElement(
                        "button",
                        { className: "btn btn-primary", disabled: "disabled" },
                        "Publishing"
                    );
                }

                contentForMarketplace = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "p",
                        null,
                        "If you think your component could be beneficial to other developers you can publish it on our marketplace."
                    ),
                    button
                );
            } else if (this.state.published && !this.state.approved) {
                var button = React.createElement(
                    "button",
                    { className: "btn btn-danger", onClick: this.cancelSubmission },
                    "Cancel submission"
                );

                if (this.state.cancellingSubmission) {
                    button = React.createElement(
                        "button",
                        { className: "btn btn-danger", disabled: "disabled" },
                        "Cancel submission"
                    );
                }

                contentForMarketplace = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "label",
                        { className: "label label-primary" },
                        "Waiting for validation"
                    ),
                    React.createElement(
                        "p",
                        null,
                        "Your component is currently being examined by our team. We verify every component individually to ensure that other developers will not have any issues using it. We might need to contact you if we need further information"
                    ),
                    React.createElement("hr", null),
                    button
                );
            } else {
                contentForMarketplace = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "label",
                        { className: "label label-success" },
                        "Your component is live"
                    ),
                    React.createElement(
                        "p",
                        null,
                        "Your component has been approved and is now live on our marketplace"
                    ),
                    React.createElement(
                        "a",
                        { className: "btn btn-success", href: "/marketplace/project/" + this.props.component.id_project },
                        "See on marketplace"
                    )
                );

                /*
                <hr/>
                <div className="col-xs-4 col-xs-offset-2">
                    <a className="btn btn-block btn-social btn-facebook" style={{display: "inline-block"}}>
                       <span className="fa fa-facebook"></span> Share on Facebook
                    </a>
                </div>
                 <div className="col-xs-4">
                    <a className="btn btn-block btn-social btn-twitter" style={{display: "inline-block"}}>
                       <span className="fa fa-twitter"></span> Tweet
                    </a>
                </div>
                */
            }

            var contentForTags = "";
            if (this.state.loading) {
                contentForTags = React.createElement(Loader, null);
            } else {
                if (this.props.component) {
                    contentForTags = React.createElement(
                        "div",
                        { id: "tags" },
                        React.createElement(
                            "p",
                            null,
                            "Sometimes it becomes difficult to find a component because there are too many in a project. Worry no more we have you covered."
                        ),
                        React.createElement(
                            "div",
                            null,
                            this.props.component.tags.map(function (row, index) {
                                return React.createElement(
                                    "span",
                                    { className: "input", key: "tag" + row + index },
                                    React.createElement(
                                        "span",
                                        { className: "label label-primary name" },
                                        row
                                    ),
                                    React.createElement(
                                        "span",
                                        { className: "remove" },
                                        React.createElement("i", { className: "fa fa-times", style: { cursor: "pointer" }, onClick: target.props.removeTag.bind(null, row) })
                                    )
                                );
                            }),
                            React.createElement(
                                "div",
                                { id: "addTagsButton", className: this.state.stateButtonAddTags, onClick: this.addTagsButton },
                                React.createElement(
                                    "i",
                                    { className: "fa fa-plus " + this.state.stateButtonAddTags },
                                    " Add a tag"
                                )
                            ),
                            React.createElement("input", { type: "text",
                                id: "addTags",
                                placeholder: "Type tag name then press return",
                                value: this.state.tagFieldValue,
                                className: "form-control " + this.state.stateButtonAddTags,
                                onKeyDown: this.tagFieldKeyDown,
                                onChange: this.tagFieldOnChange })
                        )
                    );
                }
            }

            return React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12 card" },
                            compName,
                            compIdentifier,
                            compDescription
                        ),
                        React.createElement(
                            "div",
                            { className: "col-xs-12 card", style: { textAlign: "center" } },
                            React.createElement(
                                "legend",
                                null,
                                "Marketplace"
                            ),
                            contentForMarketplace
                        ),
                        React.createElement(
                            "div",
                            { className: "col-xs-12 card", style: { textAlign: "center" } },
                            React.createElement(
                                "legend",
                                null,
                                "Tags"
                            ),
                            contentForTags
                        )
                    )
                )
            );
        }
    });
});