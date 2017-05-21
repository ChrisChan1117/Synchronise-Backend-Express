var RightBar;

dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "TimeAgo", "CodeMirror", "urlH", "Typeahead"], function () {
    // Displays the results of the execution of the component
    // Props :
    // - (string)status: the status of the execution
    // - (number)exec_time: The duration of the last execution
    // - (string)results: The results string
    var Results = React.createClass({
        getInitialState: function () {
            return {
                codeMirror: false
            };
        },
        componentDidMount: function () {
            /*var code = CodeMirror.fromTextArea(document.getElementById('results'), {
                mode        : "javascript",
                theme       : "material",
                lineNumbers : false,
                readOnly    : true,
                lint        : false
            });
             this.setState({codeMirror: code});*/
        },
        componentWillReceiveProps: function (props) {
            var target = this;
            // Formats the displays of the JSON if necessary
            if (props.hasOwnProperty('results')) {
                if (typeof props.results == "object") {
                    $(ReactDOM.findDOMNode(target)).find('#results').JSONView(props.results);
                } else {
                    $(ReactDOM.findDOMNode(target)).find('#results').text(props.results);
                }
            }
        },
        render: function () {
            var classForStatus = "";
            var duration = "";
            switch (this.props.status) {
                case "success":
                    classForStatus = "success";
                    duration = this.props.exec_time + "s";
                    break;

                case "error":
                    classForStatus = "danger";
                    break;

                case "loading":
                    classForStatus = "primary";
                    break;

                case "timeout":
                    classForStatus = "info";
                    break;

                case "progress":
                    classForStatus = "info";
                    break;
            }

            var labelForStatus = this.props.status.charAt(0).toUpperCase() + this.props.status.slice(1);

            if (this.state.codeMirror) {
                var results = this.props.results;
                if (typeof results == "object") {
                    results = JSON.stringify(results);
                }
                this.state.codeMirror.setValue(results);
            }

            var loaderForResults = "";
            var opacityForResults = 1;
            if (this.props.status == "loading") {
                loaderForResults = React.createElement(Loader, null);
                opacityForResults = 0;
            }

            return React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "legend",
                        null,
                        "Result ",
                        React.createElement(
                            "div",
                            { className: "pull-right" },
                            React.createElement(
                                "span",
                                { style: { fontWeight: "100", fontSize: "small", marginRight: "5px" } },
                                duration
                            ),
                            React.createElement(
                                "span",
                                { className: "label label-" + classForStatus, style: { fontSize: "10px", "marginTop": "11px" } },
                                labelForStatus
                            )
                        )
                    ),
                    loaderForResults,
                    React.createElement(
                        "div",
                        { id: "results", className: "card", style: { opacity: opacityForResults } },
                        "Execute the component to see the results"
                    )
                )
            );
        }
    });

    // Displays the messages from the console log on the server
    // Props:
    // - (string)logs: The logs to display
    var Console = React.createClass({
        getInitialState: function () {
            return {
                codeMirror: false
            };
        },
        componentDidMount: function () {
            var code = CodeMirror.fromTextArea(document.getElementById('console'), {
                mode: "javascript",
                theme: "material",
                lineNumbers: true,
                readOnly: true,
                lint: false,
                lineNumbers: false
            });

            this.setState({ codeMirror: code });
        },
        render: function () {
            if (this.state.codeMirror) {
                var string = "";
                {
                    this.props.logs.map(function (row, index) {
                        if (index != 0) {
                            string += "\n";
                        }
                        string += row.message.toString();
                    });
                }
                this.state.codeMirror.setValue(string);
            }

            return React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "legend",
                        null,
                        "Console"
                    ),
                    React.createElement("textarea", { id: "console" })
                )
            );
        }
    });

    /*
    Props:
    - (object)component: The Component object
    - (boolean)loading : Wether or not the component is still loading
    */
    var InputsForRightBar = React.createClass({
        getInitialState: function () {
            return {
                valuesForInputs: {}
            };
        },
        componentDidMount: function () {
            if (this.props.component) {
                var target = this;
            }
        },
        inputChanged: function (name, event) {
            var valuesForInputs = this.state.valuesForInputs;
            var value;
            if (event.hasOwnProperty('target')) {
                value = event.target.value;
            } else {
                value = event;
            }

            valuesForInputs[name] = {
                name: name,
                value: value
            };

            this.props.valuesForInputs(valuesForInputs);
        },
        render: function () {
            var target = this;
            var inputs = "";

            if (this.props.component) {
                inputs = React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    target.props.component.inputs.map(function (row, index) {
                        var value = "";
                        if (target.state.valuesForInputs.hasOwnProperty(row.name)) {
                            value = target.state.valuesForInputs[row.name].value;
                        }
                        var style = "";
                        var explanationError = "";
                        _.each(target.props.missing, function (row2) {
                            if (row2.name == row.name) {
                                style = "has-error has-feedback";
                            }
                        });

                        _.each(target.props.incorrect, function (row2) {
                            if (row2.expected.name == row.name) {
                                style = "has-error has-feedback";
                                explanationError = "Expected: " + _.last(row2.expected.type) + " - Given : " + row2.given.type;
                            }
                        });

                        var stringVersionOfTheTypeOfTheInput = _.reduce(row.type, function (initial, next) {
                            return initial + " - " + next;
                        });

                        var optionalLabel = "";
                        var styleForInputLabel = { fontSize: "75%", color: "white", paddingLeft: "3px", paddingRight: "3px", paddingBottom: "1px", borderRadius: "5px" };
                        if (row.is_optional) {
                            optionalLabel = React.createElement(
                                "span",
                                { style: _.extend({ backgroundColor: "#9c27b0" }, styleForInputLabel) },
                                "optional"
                            );
                        }

                        return React.createElement(
                            "div",
                            { className: "form-group input-xs " + style, key: "inputsForRightBar" + row.name },
                            React.createElement(
                                "label",
                                { style: { marginBottom: "0px" } },
                                React.createElement(
                                    "span",
                                    { style: _.extend({ backgroundColor: "darkgray" }, styleForInputLabel) },
                                    stringVersionOfTheTypeOfTheInput
                                ),
                                " ",
                                optionalLabel,
                                " ",
                                React.createElement(
                                    "span",
                                    { style: _.extend({ backgroundColor: "#2196f3" }, styleForInputLabel) },
                                    row.name
                                )
                            ),
                            React.createElement("input", { type: "text",
                                value: value,
                                style: { height: "initial" },
                                onChange: target.inputChanged.bind(null, row.name),
                                className: "form-control" }),
                            explanationError
                        );
                    })
                );
            }

            /*
            <Typeahead onSelected={target.inputChanged.bind(null, row.name)}
                       typeContent="text"
                       className="form-control"
                       options={_.map(_.filter(target.state.cacheInput, function(cacheInput){
                           return ((cacheInput.name_input == row.name) && (stringVersionOfTheTypeOfTheInput == cacheInput.type_data))
                       }), function(cacheInput){
                           return {
                               value : cacheInput.data,
                               text  : cacheInput.data
                           };
                       })}
                       onChange={target.inputChanged.bind(null, row.name)}
                       openedOnfocus={true}/>
            */

            /*
            <p style={{textAlign: "center"}}>Store values in a <b>profile</b> to avoid re-typing them all the time</p>
            <div className="col-lg-12" style={{textAlign: "center"}}>
                <button className="btn btn-xs btn-default">Create profile</button>
            </div>
            <div className="col-lg-12">
                <select className="form-control">
                    <option>Test</option>
                </select>
            </div>
            */
            var content = React.createElement("div", null);
            if (this.props.component) {
                if (this.props.component.inputs.length) {
                    content = React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 card" },
                            React.createElement(
                                "p",
                                { style: { textAlign: "center" } },
                                "Try some values for the inputs"
                            ),
                            inputs
                        )
                    );
                }
            }

            return content;
        }
    });

    // Displays the right bar (Run button, Results status, Console)
    RightBar = React.createClass({
        getInitialState: function () {
            return {
                running: false,
                execution_start: new Date(),
                logs: [],
                status: "",
                timeout: false,
                results: "",
                missing: [], // Missing parameters when executed
                incorrect: [], // Parameters when incorrect types when executed
                valuesForInputs: {}
            };
        },
        componentDidMount: function () {
            var target = this;

            // Save the state of tabs in the url query
            $(ReactDOM.findDOMNode(this)).find('.nav-tabs').on('shown.bs.tab', function (e) {
                urlH.insertParam('tab', $(e.target).attr('aria-controls'));
            });

            // A tab is available in the url query, we switch to it directly
            if (urlH.getParam('tab')) {
                $(ReactDOM.findDOMNode(this)).find('.nav-tabs a[aria-controls=' + urlH.getParam('tab') + ']').tab('show');
            }
        },
        formatInput: function (type, string) {
            switch (type) {
                case "text":
                    return string;
                    break;

                case "number":
                    return Number(string);
                    break;

                case "bool":
                    return Boolean(string);
                    break;

                case "date":
                    return new Date(string);
                    break;

                case "json":
                    var json = "{}";
                    try {
                        return JSON.parse(string);
                    } catch (e) {
                        return "";
                    }
                    break;
            }
        },
        runComponent: function () {
            var target = this;
            if (this.state.timeout) {
                window.clearTimeout(this.state.timeout);
            }

            /*if(!this.state.running){*/
            var target = this;
            target.setState({ logs: [], results: "", status: "loading", missing: [], incorrect: [], execution_start: new Date() });

            var answered = false;

            var inputs = {};

            _.each(Object.keys(target.state.valuesForInputs), function (key) {
                var inputFromComponent;
                _.each(target.props.component.inputs, function (row) {
                    if (row.name == key) {
                        inputFromComponent = row;
                    }
                });

                if (inputFromComponent) {
                    inputs[key] = target.formatInput(inputFromComponent.type[0], target.state.valuesForInputs[key].value);
                } else {
                    var copyValuesForInputs = target.state.valuesForInputs;
                    delete copyValuesForInputs[key];
                    target.setState({ valuesForInputs: copyValuesForInputs });
                }
            });

            // Scroll to the results
            $('html, body').animate({
                scrollTop: $(ReactDOM.findDOMNode(target)).find('#results').offset().top
            }, 300);

            Synchronise.Cloud.run("executeComponent", _.extend({ id_component: urlH.getParam("id") }, inputs), {
                success: function (data) {
                    var exec_time = (new Date().getTime() - target.state.execution_start.getTime()) / 1000;
                    target.setState({ status: "success", results: data, execution_time: exec_time });
                    answered = true;
                },
                error: function (err) {
                    if (err.code == 102) {
                        target.setState({ missing: err.missing });
                    } else if (err.code == 101) {
                        target.setState({ incorrect: err.incorrect });
                    }

                    target.setState({ status: "error", results: err });
                    answered = true;
                },
                always: function () {},
                progress: function () {
                    target.setState({ status: "progress" });
                },
                log: function (message) {
                    var date = new Date();
                    var logs = target.state.logs;
                    logs.push({
                        date: date,
                        id: "log" + date.getTime(),
                        message: message
                    });

                    target.setState({ logs: logs });
                }
            });

            var timeout = window.setTimeout(function () {
                if (!answered) {
                    target.setState({ status: "timeout" });
                }
                window.clearTimeout(timeout);
            }, 20000);

            target.setState({ timeout: timeout });
            /*}*/
        },
        valuesForInputs: function (valuesForInputs) {
            this.setState({ valuesForInputs: valuesForInputs });
        },
        render: function () {
            var content = React.createElement(
                "div",
                { id: "rightBar" },
                React.createElement(Loader, null)
            );

            var tabsForSections = "";
            var classForContentRightBar = "card";
            var urlForDocumentation = "/docs#a93231e6-dbda-4eee-a610-4c544b956647"; // Clients documentation
            if (!this.props.component.is_forked && this.props.component.user_id == Synchronise.User.current().id) {
                tabsForSections = React.createElement(
                    "div",
                    { className: "col-xs-12" },
                    React.createElement(
                        "ul",
                        { className: "nav nav-tabs", role: "tablist", style: { textAlign: "center" } },
                        React.createElement(
                            "li",
                            { role: "presentation", className: "active", style: { float: "none", display: "inline-block " } },
                            React.createElement(
                                "a",
                                { href: "#code", "aria-controls": "code", role: "tab", "data-toggle": "tab" },
                                "Code"
                            )
                        ),
                        React.createElement(
                            "li",
                            { role: "presentation", style: { float: "none", display: "inline-block " } },
                            React.createElement(
                                "a",
                                { href: "#setting", "aria-controls": "setting", role: "tab", "data-toggle": "tab" },
                                "Settings"
                            )
                        ),
                        React.createElement(
                            "li",
                            { role: "presentation", style: { float: "none", display: "inline-block " } },
                            React.createElement(
                                "a",
                                { href: "#export", "aria-controls": "export", role: "tab", "data-toggle": "tab" },
                                "Export"
                            )
                        )
                    )
                );

                classForContentRightBar = "";
                urlForDocumentation = "/docs#864c8a50-d32c-41d7-b63d-7571efc874ac"; // Component documentation
            }

            var labelTryIt = "";
            if (this.props.component.is_forked) {
                labelTryIt = React.createElement(
                    "legend",
                    null,
                    "Try it"
                );
            }

            if (!this.props.loading) {
                content = React.createElement(
                    "div",
                    { id: "rightBar", className: "row" },
                    React.createElement(
                        "div",
                        { className: "col-xs-12" },
                        React.createElement(
                            "div",
                            { className: "row", style: { marginBottom: "20px" } },
                            React.createElement(
                                "div",
                                { style: { position: "absolute", right: "0px", marginTop: "0px", zIndex: 999, opacity: 0 }, className: "handIndicator" },
                                React.createElement("img", { src: "/images/handPointingLeft.png" })
                            ),
                            React.createElement(
                                "div",
                                { className: "col-xs-12", style: { textAlign: "center" } },
                                React.createElement(
                                    "button",
                                    { className: "btn btn-primary", onClick: this.runComponent },
                                    "Run"
                                ),
                                React.createElement(
                                    "a",
                                    { className: "btn btn-info", href: urlForDocumentation, style: { marginLeft: "5px" }, target: "_blank" },
                                    "Documentation"
                                )
                            ),
                            tabsForSections
                        ),
                        labelTryIt,
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "div",
                                { className: "col-xs-12" },
                                React.createElement(InputsForRightBar, { component: this.props.component,
                                    missing: this.state.missing,
                                    incorrect: this.state.incorrect,
                                    valuesForInputs: this.valuesForInputs })
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: classForContentRightBar },
                            React.createElement(Results, { results: this.state.results,
                                exec_time: this.state.execution_time,
                                status: this.state.status }),
                            React.createElement(Console, { logs: this.state.logs })
                        )
                    )
                );
            }

            return content;
        }
    });
});