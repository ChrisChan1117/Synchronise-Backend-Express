var QueryResultPreview;
(function () {
    dependenciesLoader([], function () {
        // Container of the QueryResultPreview block
        QueryResultPreview = React.createClass({
            getInitialState: function () {
                return { selected_fields: [] };
            },
            render: function () {
                return React.createElement(
                    "div",
                    { id: "QueryResultPreview" },
                    React.createElement(
                        "div",
                        { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 btn-group", style: { textAlign: "center", marginBottom: "5px" } },
                        React.createElement(
                            "button",
                            { className: "btn-xs btn btn-default", style: { float: "none" } },
                            "Table"
                        ),
                        React.createElement(
                            "button",
                            { className: "btn-xs btn btn-default", style: { float: "none" } },
                            "JSON"
                        )
                    ),
                    React.createElement(QueryResult, { fields: this.state.selected_fields }),
                    React.createElement(
                        "center",
                        null,
                        React.createElement(
                            "small",
                            null,
                            "This block represents the data that will be returned by the query once executed. Be aware that the values of the fields are there for information sake and do not reflect the actual value on your databases."
                        )
                    )
                );
            }
        });

        // Displays an example of the result a query would returned when executed
        // Props :
        // - [object]fields : The list of fields that are currently selected
        var QueryResult = React.createClass({
            getInitialState: function () {
                return {
                    indent: "\u00a0\u00a0\u00a0\u00a0",
                    opening_curly_bracket: "\u007b",
                    closing_curly_bracket: "\u007d",
                    opening_square_bracket: "\u005b",
                    closing_square_bracket: "\u005d",
                    double_slash: "\u002f\u002f",
                    tables: [],
                    fields: []
                };
            },
            render: function () {
                var target = this;

                var tables = [];
                var typeToData = {
                    "boolean": "true",
                    "data": "data",
                    "date": "01/01/2015",
                    "number": "5",
                    "string": "string",
                    "unknown": "",
                    "text": "text"
                };

                this.state.fields.forEach(function (elem, index, array) {
                    var table_exists = false;
                    tables.forEach(function (table) {
                        // if table already created
                        if (table.name == elem.tableName) {
                            table_exists = true;
                            table.fields.push({
                                name: elem.fieldName,
                                type: elem.type,
                                example: typeToData[elem.type]
                            });
                        }
                    });

                    if (!table_exists) {
                        tables.push({
                            name: elem.tableName,
                            fields: []
                        });

                        tables.forEach(function (table) {
                            if (table.name == elem.tableName) {
                                table.fields.push({
                                    name: elem.fieldName,
                                    type: elem.type,
                                    example: typeToData[elem.type]
                                });
                            }
                        });
                    }
                });

                var results_output = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        null,
                        this.state.indent,
                        " ",
                        this.state.indent,
                        " ",
                        this.state.opening_curly_bracket
                    ),
                    tables.map(function (table, key) {

                        return React.createElement(
                            "div",
                            { key: key },
                            React.createElement(
                                "div",
                                null,
                                target.state.indent,
                                " ",
                                target.state.indent,
                                " ",
                                target.state.indent,
                                "\"",
                                table.name,
                                "\": ",
                                target.state.opening_curly_bracket
                            ),
                            table.fields.map(function (field, key2) {
                                return React.createElement(
                                    "div",
                                    { key: key2 },
                                    target.state.indent,
                                    " ",
                                    target.state.indent,
                                    " ",
                                    target.state.indent,
                                    " ",
                                    target.state.indent,
                                    "\"",
                                    field.name,
                                    "\":",
                                    React.createElement(
                                        "span",
                                        null,
                                        " \"",
                                        field.example,
                                        "\""
                                    ),
                                    key2 < table.fields.length - 1 ? "," : "",
                                    " ",
                                    target.state.double_slash,
                                    " ",
                                    field.type
                                );
                            }),
                            React.createElement(
                                "div",
                                null,
                                target.state.indent,
                                " ",
                                target.state.indent,
                                " ",
                                target.state.indent,
                                " ",
                                target.state.closing_curly_bracket,
                                " ",
                                key < tables.length - 1 ? "," : ""
                            )
                        );
                    }),
                    React.createElement(
                        "div",
                        null,
                        this.state.indent,
                        " ",
                        this.state.indent,
                        " ",
                        this.state.closing_curly_bracket
                    )
                );

                return React.createElement(
                    "div",
                    { className: "code" },
                    React.createElement(
                        "pre",
                        null,
                        this.state.opening_curly_bracket,
                        React.createElement(
                            "div",
                            null,
                            this.state.indent,
                            "\"results\": ",
                            this.state.opening_square_bracket
                        ),
                        tables.length ? results_output : "",
                        React.createElement(
                            "div",
                            null,
                            this.state.indent,
                            " ",
                            this.state.closing_square_bracket,
                            ","
                        ),
                        React.createElement(
                            "div",
                            null,
                            this.state.indent,
                            "\"nb_results\": ",
                            React.createElement(
                                "span",
                                { className: "number" },
                                "0"
                            ),
                            ","
                        ),
                        React.createElement(
                            "div",
                            null,
                            this.state.indent,
                            "\"total_results\": ",
                            React.createElement(
                                "span",
                                { className: "number" },
                                "0"
                            ),
                            ","
                        ),
                        React.createElement(
                            "div",
                            null,
                            this.state.indent,
                            "\"page\": ",
                            React.createElement(
                                "span",
                                { className: "number" },
                                "0"
                            ),
                            ","
                        ),
                        React.createElement(
                            "div",
                            null,
                            this.state.indent,
                            "\"execution_time\": ",
                            React.createElement(
                                "span",
                                { className: "number" },
                                "0"
                            )
                        ),
                        this.state.closing_curly_bracket
                    )
                );
            }
        });
    });
})();