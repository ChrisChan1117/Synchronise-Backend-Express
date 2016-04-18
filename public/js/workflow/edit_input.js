"use strict";

var WorkflowInput;
dependenciesLoader(["ReactDOM", "React", "_", "Loader", "$", "InputType"], function () {
    // Props:
    // - (array)inputs: The list of inputs of the current workflow
    // - (function)removeInputWorkflow: Callback to trigger when removing an Input from the workflow
    WorkflowInput = React.createClass({
        displayName: "WorkflowInput",

        getInitialState: function getInitialState() {
            return {
                domElements: {
                    inputContainer: null,
                    maskForOverflow: null
                },
                stateAddButton: "",
                fieldValue: ""
            };
        },
        addButton: function addButton() {
            var target = this;
            if (target.state.stateAddButton == "active") {
                target.setState({ stateAddButton: "" });
            } else {
                target.setState({ stateAddButton: "active" });
                $("#addInput").focus();
            }
        },
        inputChange: function inputChange(event) {
            var target = this;
            target.setState({ fieldValue: event.target.value });
        },
        inputKeyDown: function inputKeyDown(event) {
            var target = this;
            if (event.key == "Enter") {
                if (target.state.fieldValue.length) {
                    var value = target.state.fieldValue.replace(/[^A-Z0-9]+/ig, "_");
                    target.props.addInputWorkflow(value);
                    target.setState({ fieldValue: "" });
                }
            }
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            target.setState({
                domElements: {
                    inputContainer: $(ReactDOM.findDOMNode(target)).find('.inputContainer'),
                    maskForOverflow: $(ReactDOM.findDOMNode(target)).find('.maskForOverflow')
                }
            });

            $(window).bind("scroll", function () {
                target.resizeInterface();
            });

            $(window).resize(function () {
                target.resizeInterface();
            });

            $(".rightSide").resize(function () {
                target.resizeInterface();
            });

            $(document).on({
                mouseenter: function mouseenter() {
                    window.setTimeout(function () {
                        target.resizeInterface();
                    }, 301);
                },
                mouseleave: function mouseleave() {
                    window.setTimeout(function () {
                        target.resizeInterface();
                    }, 301);
                }
            }, '.leftSide');

            target.resizeInterface();

            $(ReactDOM.findDOMNode(this)).tooltip({ selector: '[data-toggle=tooltip]' });
        },
        resizeInterface: function resizeInterface() {
            var domElements = this.state.domElements;
            if (!domElements.inputContainer || !domElements.maskForOverflow) {
                domElements.inputContainer = $(ReactDOM.findDOMNode(this)).find('.inputContainer');
                domElements.maskForOverflow = $(ReactDOM.findDOMNode(this)).find('.maskForOverflow');
            }
            domElements.inputContainer.stop();

            // Animate first time
            domElements.inputContainer.closest('.inputContainer').animate({
                opacity: 1
            }, 300);

            if ($(window).width() > 1200) {
                if ($(window).scrollTop() <= 60) {
                    domElements.inputContainer.css({
                        marginTop: -$(window).scrollTop() + "px",
                        width: $("#workflow #outputs").width(),
                        left: $("#workflow #outputs").offset().left
                    });
                    domElements.maskForOverflow.css('opacity', 0);
                } else {
                    domElements.inputContainer.css({
                        marginTop: "-60px",
                        width: $("#workflow #outputs").width(),
                        left: $("#workflow #outputs").offset().left
                    }, 10);
                    domElements.maskForOverflow.css('opacity', 1);
                }
            } else {
                domElements.inputContainer.css({
                    width: "100%",
                    left: "0"
                });
            }
        },
        typeChangedForInput: function typeChangedForInput() {},
        render: function render() {
            var target = this;

            var tipsText = "Some Components need Inputs in order to work. This block allows you to declare Inputs that will be passed down to the Components at execution time. For example if one of the components needs an email, you can declare it here and associate it to one of the component&#39;s Inputs";

            return React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "row" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement("div", { className: "maskForOverflow" }),
                            React.createElement(
                                "div",
                                { id: "inputContainer",
                                    "data-toggle": "tooltip",
                                    "data-placement": "bottom",
                                    title: tipsText,
                                    "data-delay": "300",
                                    "data-container": "body",
                                    "data-trigger": "hover",
                                    className: "card inputContainer",
                                    style: { opacity: 0, marginBottom: "0px", paddingTop: "0px", background: "rgba(255,255,255,0.95)" } },
                                React.createElement(
                                    "div",
                                    { className: "title" },
                                    "Input of the workflow"
                                ),
                                this.props.inputs.map(function (row, index) {
                                    return React.createElement(InputType, { inputName: row.name,
                                        inputType: row.type,
                                        editable: false,
                                        nameInputChanged: target.props.nameInputChanged,
                                        typeChangedForField: target.props.typeChangedForField.bind(null, row.name),
                                        remove: target.props.removeInputWorkflow.bind(null, row.name),
                                        key: "input" + row.name + index });
                                }),
                                React.createElement(
                                    "div",
                                    { style: { textAlign: "center", marginTop: "5px" } },
                                    React.createElement(
                                        "div",
                                        { id: "addInputButton", className: this.state.stateAddButton, onClick: target.addButton },
                                        React.createElement(
                                            "i",
                                            { className: "fa fa-plus " + this.state.stateAddButton },
                                            " ",
                                            React.createElement(
                                                "div",
                                                { style: { display: "inline-block" } },
                                                "Add workflow input"
                                            )
                                        )
                                    ),
                                    React.createElement("input", { type: "text",
                                        id: "addInput",
                                        value: this.state.fieldValue,
                                        className: "form-control " + this.state.stateAddButton,
                                        onKeyDown: this.inputKeyDown,
                                        typeChangedForField: target.typeChangedForInput,
                                        onChange: this.inputChange })
                                )
                            )
                        )
                    )
                )
            );
        }
    });
});