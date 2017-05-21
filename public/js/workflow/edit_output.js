var WorkflowOutput;
dependenciesLoader(["ReactDOM", "React", "_", "Loader", "$", "InputType"], function () {
    // Displays the list of output delivered by the Workflow
    WorkflowOutput = React.createClass({
        displayName: "WorkflowOutput",
        getInitialState: function () {
            return {
                stateAddButton: "",
                fieldValue: ""
            };
        },
        addButton: function () {
            var target = this;
            if (target.state.stateAddButton == "active") {
                target.setState({ stateAddButton: "" });
            } else {
                target.setState({ stateAddButton: "active" });
                $("#addOutput").focus();
            }
        },
        outputKeyDown: function (event) {
            var target = this;
            if (event.key == "Enter") {
                if (target.state.fieldValue.length) {
                    var value = target.state.fieldValue.replace(/[^A-Z0-9]+/ig, "_");
                    target.props.addOutputWorkflow(value);
                    target.setState({ fieldValue: "" });
                }
            }
        },
        outputChange: function (event) {
            var target = this;
            target.setState({ fieldValue: event.target.value });
        },
        componentDidMount: function () {
            $(ReactDOM.findDOMNode(this)).tooltip({ selector: '[data-toggle=tooltip]' });
        },
        render: function () {
            var target = this;

            var outputs = "";
            if (this.props.outputs) {
                outputs = React.createElement(
                    "div",
                    null,
                    this.props.outputs.map(function (row, index) {
                        var outputIsAssociated = false;
                        if (row.association) {
                            outputIsAssociated = true;
                        }

                        // The output is not associated to any variable at the moment
                        if (!outputIsAssociated) {
                            var inputsAvailable = [];
                            //inputsAvailable = [{text: "test", value: {id_component: index: -1, name: "test"}}];
                            // All of the component's outputs
                            // All of the workflow inputs
                            // Must match the type of the current output
                            for (var j = 0; j < target.props.components.length; j++) {
                                var currentParent = target.props.components[j];
                                for (var i = 0; i < target.props.componentsData[currentParent.id_component].outputs.length; i++) {
                                    var output = target.props.componentsData[currentParent.id_component].outputs[i];
                                    var icon;
                                    var parent_index = currentParent.order;
                                    if (parent_index != -1) {
                                        icon = target.props.componentsData[currentParent.id_component].logo;
                                    }

                                    var text = parent_index + 1 + ": " + output.name;
                                    if (parent_index == -1) {
                                        // workflow input
                                        text = "workflow : " + output.name;
                                    }

                                    inputsAvailable.push({
                                        value: {
                                            parent: currentParent.id_component,
                                            target_name: row.name,
                                            index_parent: parent_index,
                                            input_name: output.name
                                        },
                                        icon: icon,
                                        text: text
                                    });
                                }
                            }

                            return React.createElement(WorkflowOutputItem, { data: row,
                                zIndex: 500 - index,
                                inputSelected: target.props.inputSelectedForOutput,
                                inputsAvailable: inputsAvailable,
                                removeOutputWorkflow: target.props.removeOutputWorkflow,
                                typeChangedForOutput: target.props.typeChangedForOutput,
                                key: "outputWorkflow" + row.name + index });
                        } else {
                            // The output is associated to a variable
                            var data = row;
                            data.icon = target.props.componentsData[row.association.parent].logo;
                            return React.createElement(WorkflowOutputItemInputSelected, { data: data,
                                removeAssociatedOutput: target.props.removeAssociatedOutput,
                                typeChangedForOutput: target.props.typeChangedForOutput,
                                removeOutputWorkflow: target.props.removeOutputWorkflow,
                                key: "outputWorkflow" + row.name + index });
                        }
                    })
                );
            }

            var tipsText = "When a Component ends its execution it might return some outputs. If you need to use them in your app you will need to declare new outputs in this block. Associate outputs of a component to outputs of the workflow to make them available.";

            return React.createElement(
                "div",
                { className: "row-fluid" },
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "div",
                        { className: "row" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement(
                                "div",
                                { className: "card" },
                                React.createElement(
                                    "div",
                                    { id: "outputs",
                                        "data-toggle": "tooltip",
                                        "data-placement": "top",
                                        "data-container": "body",
                                        title: tipsText,
                                        "data-delay": "300",
                                        "data-trigger": "hover" },
                                    React.createElement(
                                        "div",
                                        { className: "title" },
                                        "Outputs of the workflow"
                                    ),
                                    outputs,
                                    React.createElement(
                                        "div",
                                        { style: { textAlign: "center" } },
                                        React.createElement(
                                            "div",
                                            { id: "addOutputButton", className: this.state.stateAddButton, onClick: target.addButton },
                                            React.createElement(
                                                "i",
                                                { className: "fa fa-plus " + this.state.stateAddButton },
                                                " ",
                                                React.createElement(
                                                    "div",
                                                    { style: { display: "inline-block" } },
                                                    "Add workflow output"
                                                )
                                            )
                                        ),
                                        React.createElement("input", { type: "text",
                                            id: "addOutput",
                                            value: this.state.fieldValue,
                                            className: "form-control " + this.state.stateAddButton,
                                            onKeyDown: this.outputKeyDown,
                                            onChange: this.outputChange })
                                    )
                                )
                            )
                        )
                    )
                )
            );
        }
    });

    // Props
    // - (object)data: Data of the current item
    // - (function)removeOutputWorkflow: Callback triggered when the output is removed
    // - (function)typeChangedForOutput: Callback triggered when the output type changes
    // - (integer)zIndex: zIndex to apply to the output block
    // - (array)inputsAvailable: An array of inputs available to associate to the output
    var WorkflowOutputItem = React.createClass({
        displayName: "WorkflowOutputItem",
        getInitialState: function () {
            return {};
        },
        componentDidMount: function () {},
        render: function () {
            var target = this;

            var contentColLeft = React.createElement(
                "div",
                { style: { paddingLeft: "5px", paddingRight: "5px", display: "inline-block", position: "relative", zIndex: this.props.zIndex } },
                React.createElement(Typeahead, { options: this.props.inputsAvailable,
                    onSelected: target.props.inputSelected.bind(null, target.props.data.name),
                    typeContent: "text",
                    className: "typeaheadForOutputInComponent form-control",
                    openedOnfocus: true,
                    placeholder: "Click to select variable" })
            );

            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { className: "col-xs-12", style: { textAlign: "center", marginBottom: "5px" } },
                    contentColLeft,
                    React.createElement(
                        "div",
                        { style: { display: "inline-block", marginRight: "10px" } },
                        React.createElement("i", { className: "fa fa-long-arrow-right" })
                    ),
                    React.createElement(
                        "div",
                        { className: "output" },
                        React.createElement(InputType, { inputName: target.props.data.name,
                            inputType: target.props.data.type,
                            typeChangedForField: target.props.typeChangedForOutput.bind(null, target.props.data.name),
                            remove: target.props.removeOutputWorkflow.bind(null, target.props.data.name),
                            key: "outputType" + target.props.data.name })
                    )
                )
            );
        }
    });

    // Props
    // - (object)data: Data of the current item
    // - (function)removeOutputWorkflow: Callback triggered when the output is removed
    // - (function)removeAssociatedOutput: Callback triggered when the output is dissociated
    // - (function)typeChangedForOutput: Callback triggered when the output type changes
    var WorkflowOutputItemInputSelected = React.createClass({
        displayName: "WorkflowOutputItemInputSelected",
        getInitialState: function () {
            return {};
        },
        componentDidMount: function () {},
        render: function () {
            var target = this;

            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { className: "col-xs-12", style: { textAlign: "center", marginBottom: "5px" } },
                    React.createElement(
                        "span",
                        { className: "outputItem" },
                        React.createElement("img", { src: target.props.data.icon, style: { width: "15px" } }),
                        " ",
                        React.createElement(
                            "span",
                            { className: "associatedBadgeIndex" },
                            target.props.data.association.index_parent + 1
                        ),
                        this.props.data.type.map(function (type, index) {
                            return React.createElement(
                                "span",
                                { className: "type", key: "workflowOutputs" + target.props.data.name + type + index + "associated" },
                                type
                            );
                        }),
                        React.createElement(
                            "span",
                            { className: "name label label-primary" },
                            target.props.data.association.input_name
                        ),
                        React.createElement(
                            "span",
                            { className: "remove", style: { display: "inline", marginLeft: "0px", cursor: "pointer", position: "relative", top: "-1px" }, onClick: target.props.removeAssociatedOutput.bind(null, target.props.data) },
                            React.createElement("i", { className: "fa fa-times" })
                        )
                    ),
                    React.createElement(
                        "div",
                        { style: { display: "inline-block", marginRight: "10px", marginLeft: "10px" } },
                        React.createElement("i", { className: "fa fa-long-arrow-right" })
                    ),
                    React.createElement(
                        "div",
                        { className: "output" },
                        React.createElement(InputType, { inputName: target.props.data.name,
                            inputType: target.props.data.type,
                            typeChangedForField: target.props.typeChangedForOutput.bind(null, target.props.data.name),
                            remove: target.props.removeOutputWorkflow.bind(null, target.props.data.name),
                            key: "outputType" + target.props.data.name })
                    )
                )
            );
        }
    });
});