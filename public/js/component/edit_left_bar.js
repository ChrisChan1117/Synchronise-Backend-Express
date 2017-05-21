var LeftBar;

dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "urlH", "Code", "Export", "Setting"], function () {
    // Displays the left bar (Component name, identifier, inputs, code, outputs)
    LeftBar = React.createClass({
        nameChanged: function (event) {
            var target = this;
            target.setState({ name: event.target.value });

            Synchronise.Cloud.run("updateComponent", { id: urlH.getParam("id"), data: { name: event.target.value } }, {});
        },
        componentDidMount: function () {
            var alreadyRefreshed = false;

            $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                if ($(e.relatedTarget).attr('aria-controls') != "code" && !alreadyRefreshed) {
                    alreadyRefreshed = true;
                    $('.CodeMirror').each(function (i, el) {
                        el.CodeMirror.refresh();
                    });
                }
            });
        },
        render: function () {
            var exportNotInTabPanel = "";
            var tabpanelContent = "";

            if (this.props.component.is_forked) {
                exportNotInTabPanel = React.createElement(
                    "div",
                    { id: "export" },
                    React.createElement(Export, { loading: this.props.loading,
                        component: this.props.component })
                );
            } else {
                tabpanelContent = React.createElement(
                    "div",
                    { className: "tab-content" },
                    React.createElement(
                        "div",
                        { role: "tabpanel", className: "tab-pane active", id: "code" },
                        React.createElement(Code, { loading: this.props.loading,
                            addInput: this.props.addInput,
                            typeChangedForInput: this.props.typeChangedForInput,
                            removeInput: this.props.removeInput,
                            addOutput: this.props.addOutput,
                            typeChangedForOutput: this.props.typeChangedForOutput,
                            changeValueIs_optional: this.props.changeValueIs_optional,
                            removeOutput: this.props.removeOutput,
                            component: this.props.component })
                    ),
                    React.createElement(
                        "div",
                        { role: "tabpanel", className: "tab-pane", id: "setting" },
                        React.createElement(Setting, { loading: this.props.loading,
                            addTag: this.props.addTag,
                            removeTag: this.props.removeTag,
                            component: this.props.component })
                    ),
                    React.createElement(
                        "div",
                        { role: "tabpanel", className: "tab-pane", id: "export" },
                        React.createElement(Export, { loading: this.props.loading,
                            component: this.props.component })
                    )
                );
            }

            return React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    tabpanelContent,
                    exportNotInTabPanel
                )
            );
        }
    });
});