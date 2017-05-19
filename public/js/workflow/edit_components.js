"use strict";

var Components;
dependenciesLoader(["Component", "React", "ReactDOM", "$", "_"], function () {
    // Props:
    // - (object)inputs: The list of inputs of the workflow
    // - (object)associatedData: The associated data to the components of the workflow
    // - (function)addInputWorkflow: Callback to trigger when we want to add an input to the workflow, from a component
    // - (object)components: The list of components on the workflow
    // - (object)componentsData: The objects of the components coming from the database and contains the actual data
    // - (function)removeComponent: Callback to trigger when we remove a component
    // - (function)resizeInterface: Helps to resize the interface properly on changes
    // - (function)inputSelectedForComponent: Callback to trigger when an input is selected for the input of a component
    // - (function)inputRemovedForComponent: Callback to trigger when the value of an input of a component is removed
    Components = React.createClass({
        displayName: "Components",

        render: function render() {
            var target = this;

            var availableInputs = [];
            if (target.props.inputs.length) {
                availableInputs.push({
                    parent: "workflow",
                    inputs: target.props.inputs,
                    icon: "/images/defaultProjectIcon.png",
                    index: -1
                });
            }

            var toMap = _.filter(target.props.components, function (row) {
                var rowData = target.props.componentsData[row.id_component];
                return rowData.outputs.length;
            });

            var componentsWithOutputs = toMap.map(function (row) {
                if (!row.logo) {
                    row.logo = "/images/defaultProjectIcon.png";
                }
                return row;
            });

            return React.createElement(
                "ol",
                { id: "listOfComponentsInFlow" },
                target.props.components.map(function (row, index) {
                    if (target.props.componentsData[row.id_component]) {
                        // Compose the list of inputs the component has available to itself
                        // aka all inputs of the workflow plus all outputs of the previous components
                        var previousComponentsOutputs = [];

                        var componentsBeforeCurrent = componentsWithOutputs.slice(0, index);
                        for (var i = 0; i < componentsBeforeCurrent.length; i++) {
                            var comp = target.props.componentsData[componentsBeforeCurrent[i].id_component];

                            previousComponentsOutputs.push({
                                parent: comp.id,
                                inputs: comp.outputs,
                                icon: comp.logo,
                                index: i
                            });
                        }

                        var availableInputsForCurrent = availableInputs.concat(previousComponentsOutputs);

                        var selectedInputs = {};
                        var keysInputsCurrentComponent = Object.keys(row.inputs);
                        for (var i = 0; i < keysInputsCurrentComponent.length; i++) {
                            var currentInput = row.inputs[keysInputsCurrentComponent[i]];
                            if (currentInput.from.id_component != "workflow") {
                                currentInput.from.icon = target.props.componentsData[currentInput.from.id_component].logo;
                            }
                            selectedInputs[currentInput.to.name] = currentInput;
                        }

                        return React.createElement(Component, { data: row,
                            index: index,
                            associatedData: target.props.associatedData[index],
                            addInputWorkflow: target.props.addInputWorkflow,
                            removeFromWorkflow: target.props.removeComponent,
                            refreshFlow: target.props.resizeInterface,
                            availableInputs: availableInputsForCurrent,
                            inputSelected: target.props.inputSelectedForComponent,
                            removeAssociatedInput: target.props.inputRemovedForComponent,
                            inputs: selectedInputs,
                            key: row.id_component + row.timestamp });
                    } else {
                        return React.createElement(
                            "li",
                            { className: "liForComponent" },
                            React.createElement(
                                "div",
                                { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 component compAt" + index + " card displayed", style: { marginBottom: "20px", marginTop: "20px", zIndex: 500 - index } },
                                React.createElement(
                                    "div",
                                    { className: "header", style: { background: "white" } },
                                    React.createElement(
                                        "legend",
                                        { className: "title", style: { color: "black" } },
                                        React.createElement(
                                            "span",
                                            { className: "orderLabel", style: { borderColor: "black", color: "black" } },
                                            index + 1
                                        ),
                                        "Undefined"
                                    ),
                                    React.createElement("i", { className: "fa fa-times remove", style: { color: "black", cursor: "pointer" }, onClick: target.props.removeComponent.bind(null, index) })
                                ),
                                React.createElement(
                                    "div",
                                    { className: "settings", style: { background: "white", padding: "10px" } },
                                    "This component is no longer available. This means it either has been removed by its owner or it has been banned by our team. Please remove it and replace it with another one."
                                )
                            )
                        );
                    }
                })
            );
        }
    });
});