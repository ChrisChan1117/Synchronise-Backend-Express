"use strict";

var WorkflowInputValues;
dependenciesLoader(["React", "ReactDOM", "$", "_"], function () {
    // Props
    // - (function)inputValueChanged: Callback to trigger when the value of an input changes
    // - (array)inputs: The list of inputs expected by the workflow
    // - (object)inputsStatus:  The status of each inputs (error, success, pending...). This is used to display a red line underneath if the value given is incorrect for example
    // - (object)inputsValues: The actual values of the inputs given by the user.
    WorkflowInputValues = React.createClass({
        displayName: "WorkflowInputValues",

        getInitialState: function getInitialState() {
            return {};
        },
        componentDidMount: function componentDidMount() {},
        render: function render() {
            var target = this;
            var noContent = "";
            var content = "";
            if (target.props.inputs.length) {
                content = React.createElement(
                    "div",
                    { className: "card col-xs-12" },
                    target.props.inputs.map(function (row) {
                        return React.createElement(
                            "div",
                            { className: "form-group input-xs col-lg-4 col-xs-12", key: "inputsForRightBar" + row.name },
                            React.createElement(
                                "label",
                                { style: { marginBottom: "0px" } },
                                row.name
                            ),
                            React.createElement("input", { type: "text",
                                value: target.props.inputsValues[row.name],
                                style: { height: "initial" },
                                onChange: target.props.inputValueChanged.bind(null, row.name),
                                className: "form-control" })
                        );
                    })
                );
            }

            return React.createElement(
                "div",
                { id: "inputsValues", className: "row-fluid" },
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    noContent,
                    content
                )
            );
        }
    });
});