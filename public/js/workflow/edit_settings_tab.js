"use strict";

var SettingsTab;
dependenciesLoader(["React", "ReactDOM", "$", "_", "Loader"], function () {
    // Props
    // - (string)identifier: The unique identifier of the workflow
    // - (string)name: The name of the Workflow
    // - (boolean)loading: Whether or not the workflow is still loading
    // - (function)changeName: Callback to trigger when the name of the Workflow changes
    SettingsTab = React.createClass({
        displayName: "SettingsTab",

        getInitialState: function getInitialState() {
            return {};
        },
        componentDidMount: function componentDidMount() {},
        render: function render() {
            var content = React.createElement(Loader, null);
            if (!this.props.loading) {
                content = React.createElement(
                    "div",
                    { className: "col-xs-12 card" },
                    React.createElement(
                        "div",
                        { className: "col-lg-6 col-md-6 col-sm-12 col-xs-12" },
                        React.createElement(
                            "div",
                            { className: "form-group" },
                            React.createElement(
                                "label",
                                null,
                                "Workflow name"
                            ),
                            React.createElement("input", { onChange: this.props.changeName, type: "text", className: "form-control input-lg", value: this.props.name, placeholder: "Be creative..." })
                        )
                    ),
                    React.createElement(
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
                            React.createElement("input", { defaultValue: this.props.identifer, className: "form-control input-lg", type: "text", readOnly: true, placeholder: "Identifier" })
                        )
                    )
                );
            }

            return React.createElement(
                "div",
                { role: "tabpanel", className: "tab-pane fade col-lg-12", id: "settingsTab" },
                content
            );
        }
    });
});