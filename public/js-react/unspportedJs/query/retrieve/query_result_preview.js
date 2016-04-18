var QueryResultPreview;
(function() {
    dependenciesLoader([], function(){
        // Container of the QueryResultPreview block
        QueryResultPreview = React.createClass({
            getInitialState: function(){
                return {selected_fields:[]};
            },
            render: function(){
                return (
                    <div id="QueryResultPreview">
                        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 btn-group" style={{textAlign: "center", marginBottom: "5px"}}>
                            <button className="btn-xs btn btn-default" style={{float: "none"}}>Table</button>
                            <button className="btn-xs btn btn-default" style={{float: "none"}}>JSON</button>
                        </div>
                        <QueryResult fields={this.state.selected_fields}/>
                        <center>
                            <small>This block represents the data that will be returned by the query once executed.
                                Be aware that the values of the fields are there for information sake and do not
                                reflect the actual value on your databases.
                            </small>
                        </center>
                    </div>
                );
            }
        });

        // Displays an example of the result a query would returned when executed
        // Props :
        // - [object]fields : The list of fields that are currently selected
        var QueryResult = React.createClass({
            getInitialState: function () {
                return ({
                    indent: "\u00a0\u00a0\u00a0\u00a0",
                    opening_curly_bracket: "\u007b",
                    closing_curly_bracket: "\u007d",
                    opening_square_bracket: "\u005b",
                    closing_square_bracket: "\u005d",
                    double_slash: "\u002f\u002f",
                    tables: [],
                    fields: []
                });
            },
            render: function () {
                var target = this;

                var tables = [];
                var typeToData = {
                    "boolean" : "true",
                    "data"    : "data",
                    "date"    : "01/01/2015",
                    "number"  : "5",
                    "string"  : "string",
                    "unknown" : "",
                    "text"    : "text"
                };

                this.state.fields.forEach(function (elem, index, array) {
                    var table_exists = false;
                    tables.forEach(function (table) {
                        // if table already created
                        if (table.name == elem.tableName) {
                            table_exists = true;
                            table.fields.push({
                                name    : elem.fieldName,
                                type    : elem.type,
                                example : typeToData[elem.type]
                            });
                        }
                    });

                    if (!table_exists) {
                        tables.push({
                            name   : elem.tableName,
                            fields : []
                        });

                        tables.forEach(function (table) {
                            if (table.name == elem.tableName) {
                                table.fields.push({
                                    name    : elem.fieldName,
                                    type    : elem.type,
                                    example : typeToData[elem.type]
                                });
                            }
                        });
                    }
                });

                var results_output = (
                    <div>
                        <div>{this.state.indent} {this.state.indent} {this.state.opening_curly_bracket}</div>

                        {tables.map(function (table, key) {

                            return (
                                <div key={key}>
                                    <div>{target.state.indent} {target.state.indent} {target.state.indent}"{table.name}": {target.state.opening_curly_bracket}</div>
                                    {table.fields.map(function (field, key2) {
                                        return (
                                            <div key={key2}>{target.state.indent} {target.state.indent} {target.state.indent} {target.state.indent}"{field.name}":
                                                <span> "{field.example}"</span>{key2 < table.fields.length - 1 ? "," : ""} {target.state.double_slash} {field.type}
                                            </div>
                                        );
                                    })}
                                    <div>{target.state.indent} {target.state.indent} {target.state.indent} {target.state.closing_curly_bracket} {key < tables.length - 1 ? "," : ""}</div>
                                </div>
                            );
                        })}
                        <div>{this.state.indent} {this.state.indent} {this.state.closing_curly_bracket}</div>
                    </div>
                );

                return (
                    <div className="code">
                    <pre>
                        {this.state.opening_curly_bracket}
                        <div>{this.state.indent}"results": {this.state.opening_square_bracket}</div>
                        {tables.length ? results_output : ""}
                        <div>{this.state.indent} {this.state.closing_square_bracket},</div>
                        <div>{this.state.indent}"nb_results": <span className="number">0</span>,</div>
                        <div>{this.state.indent}"total_results": <span className="number">0</span>,</div>
                        <div>{this.state.indent}"page": <span className="number">0</span>,</div>
                        <div>{this.state.indent}"execution_time": <span className="number">0</span></div>
                        {this.state.closing_curly_bracket}
                       </pre>
                    </div>
                );
            }
        });
    });
})();
