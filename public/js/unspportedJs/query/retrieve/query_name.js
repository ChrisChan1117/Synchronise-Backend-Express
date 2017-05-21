var QueryName;
(function () {
    dependenciesLoader(["$", "React", "Loader", "PanelFlow", "panelFlow" /* Instance of the flow */], function () {
        QueryName = React.createClass({
            getInitialState: function () {
                return { name: "", error: false };
            },
            componentDidMount: function () {
                var target = this;
                var query_id = urlH.getParam("query");
                if (query_id) {
                    Synchronise.Cloud.run("getQuery", { id_query: query_id, realtime: false }, {
                        success: function (query) {
                            target.setState({
                                name: query.name
                            });
                        }
                    });
                }

                $("#blocks").on('panelWillAppear', function (e, block) {
                    if (block.blockId() == "name") {
                        KeyEventController.subscribeComponent("QueryName", function (key) {
                            if (key == 13) {
                                target.submitName();
                            }
                        });

                        $("#titleBlock h1 small").text("Give a name to your query");
                        $("#blocks").opacity = 1;
                    }
                });

                $("#blocks").on('panelWillDisappear', function (e, block) {
                    if (block.blockId() == "name") {
                        KeyEventController.unsubscribeComponent("QueryName");
                    }
                });

                $("#blocks").on('panelDidAppear', function (e, block) {
                    if (block.blockId() == "name") {
                        if ($(window).width() > 767) {
                            $('#nameQueryInput').focus();
                        }
                    }
                });
            },
            handleChange: function (e) {
                this.setState({ name: e.target.value, error: e.target.value.length == 0 });
            },
            submitName: function () {
                var query_id = urlH.getParam("query");

                if (query_id) {
                    Synchronise.Cloud.run("changeQueryName", { name: this.state.name, id_query: query_id }, {
                        success: function (query) {
                            panelFlow.scrollToBlock("fields");
                        }
                    });
                } else {
                    new Modal().title('Query name').content('You need to select a datastore before').footer(false, true).show();
                    panelFlow.scrollToBlock("dataSources");
                }
            },
            render: function () {
                var className = "form-group";
                if (this.state.error) {
                    className += " has-error";
                }
                return React.createElement(
                    "div",
                    { className: className },
                    React.createElement("input", { id: "nameQueryInput", type: "text", className: "form-control input-lg",
                        placeholder: "Choose a descriptive name to make sure you understand what the query is doing.",
                        value: this.state.name, onChange: this.handleChange })
                );
            }
        });

        ReactDOM.render(React.createElement(QueryName, null), document.getElementById("nameQuery"));
    });
})();