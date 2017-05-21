var ExportTab;
dependenciesLoader(["React", "ReactDOM", "$", "_", "Loader", "Export"], function () {
    // Displays the export block of a workflow
    // Props:
    // - (string)id
    // - (boolean)loading
    // - (object)inputs
    ExportTab = React.createClass({
        getInitialState: function () {
            return {};
        },
        componentDidMount: function () {},
        render: function () {
            var content = React.createElement(Loader, null);
            if (!this.props.loading) {
                content = React.createElement(
                    "div",
                    { className: "col-xs-12 card", id: "export" },
                    React.createElement(Export, { id: this.props.id, loading: this.props.loading, inputs: this.props.inputs })
                );
            }

            return React.createElement(
                "div",
                { role: "tabpanel", className: "tab-pane fade col-lg-12", id: "exportTab" },
                content
            );
        }
    });
});