"use strict";

var Export;
dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "urlH"], function () {
    jQuery.fn.selectText = function () {
        this.find('input').each(function () {
            if ($(this).prev().length == 0 || !$(this).prev().hasClass('p_copy')) {
                $('<p class="p_copy" style="position: absolute; z-index: -1;"></p>').insertBefore($(this));
            }
            $(this).prev().html($(this).val());
        });
        var doc = document;
        var element = this[0];
        if (doc.body.createTextRange) {
            var range = document.body.createTextRange();
            range.moveToElementText(element);
            range.select();
        } else if (window.getSelection) {
            var selection = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };

    // Displays the export block of a workflow
    // Props:
    // - (string)id
    // - (boolean)loading
    // - (object)inputs
    Export = React.createClass({
        displayName: "Export",
        getInitialState: function getInitialState() {
            return {
                public_key: "",
                loading_key: false
            };
        },
        componentDidMount: function componentDidMount() {
            var needToCreatePublicKey = false;
            var target = this;
            target.setState({ loading_key: true });

            if (!Synchronise.User.current().public_key) {
                needToCreatePublicKey = true;
            }

            if (needToCreatePublicKey) {
                Synchronise.Cloud.run("createPublicKey", { "type": "javascript" }, {
                    success: function success(key) {
                        target.setState({ public_key: key.status });
                        Synchronise.User.fetchCurrent(); // Refresh local data
                        Synchronise.init(key.status);
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    always: function always() {
                        target.setState({ loading_key: false });
                    }
                });
            } else {
                var pk = Synchronise.User.current().public_key;
                target.setState({ public_key: pk });
                Synchronise.init(pk);
            }
        },
        selectUniqueIdentifier: function selectUniqueIdentifier() {
            $(ReactDOM.findDOMNode(this)).find('.queryUniqueIdentifier').selectText();
        },
        render: function render() {
            var public_key_javascript = "Loading...";
            var public_key_nodejs = "Loading...";
            if (this.state.public_key) {
                public_key_javascript = this.state.public_key;
                public_key_nodejs = this.state.public_key;
            }

            var implementIt = "";

            var content = React.createElement(Loader, null);
            if (!this.props.loading && this.props.id) {
                content = React.createElement(
                    "div",
                    null,
                    implementIt,
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "p",
                            { style: { fontSize: "20px", fontWeight: "bold", textAlign: "center" } },
                            React.createElement(
                                "span",
                                null,
                                "Workflow unique identifier "
                            ),
                            "  ",
                            React.createElement(
                                "span",
                                { className: "code", onClick: this.selectUniqueIdentifier, style: { cursor: "pointer" } },
                                React.createElement(
                                    "code",
                                    { className: "plain queryUniqueIdentifier" },
                                    this.props.id
                                )
                            )
                        ),
                        React.createElement(
                            "ul",
                            { className: "nav nav-tabs", role: "tablist" },
                            React.createElement(
                                "li",
                                { role: "presentation", className: "active" },
                                React.createElement(
                                    "a",
                                    { href: "#javascript", "aria-controls": "javascript", role: "tab", "data-toggle": "tab" },
                                    "Javascript"
                                )
                            ),
                            React.createElement(
                                "li",
                                { role: "presentation" },
                                React.createElement(
                                    "a",
                                    { href: "#nodejs", "aria-controls": "nodejs", role: "tab", "data-toggle": "tab" },
                                    "Node.JS"
                                )
                            ),
                            React.createElement(
                                "li",
                                { role: "presentation" },
                                React.createElement(
                                    "a",
                                    { href: "#rest", "aria-controls": "rest", role: "tab", "data-toggle": "tab" },
                                    "REST"
                                )
                            )
                        ),
                        React.createElement("br", null),
                        React.createElement(
                            "div",
                            { className: "tab-content" },
                            React.createElement(
                                "div",
                                { role: "tabpanel", className: "tab-pane active", id: "javascript" },
                                React.createElement(
                                    "center",
                                    null,
                                    React.createElement(
                                        "a",
                                        { className: "btn btn-info btn-sm", href: "/docs#79b8a5e0-4de5-4dec-a4c4-df989d686607 " },
                                        "Javascript Client library documentation"
                                    )
                                ),
                                React.createElement("br", null),
                                React.createElement(ExportJavascript, { workflow_id: this.props.id, public_key: public_key_javascript, inputs: this.props.inputs })
                            ),
                            React.createElement(
                                "div",
                                { role: "tabpanel", className: "tab-pane", id: "nodejs" },
                                React.createElement(
                                    "center",
                                    null,
                                    React.createElement(
                                        "a",
                                        { className: "btn btn-info btn-sm", href: "/docs#8a46492d-0f9c-4280-b199-c2dfe10b4dba" },
                                        "Node.JS Client library documentation"
                                    )
                                ),
                                React.createElement("br", null),
                                React.createElement(ExportNodeJS, { workflow_id: this.props.id, public_key: public_key_nodejs, inputs: this.props.inputs })
                            ),
                            React.createElement(
                                "div",
                                { role: "tabpanel", className: "tab-pane", id: "rest" },
                                React.createElement(
                                    "center",
                                    null,
                                    React.createElement(
                                        "a",
                                        { className: "btn btn-info btn-sm", href: "/docs#b382c473-6652-426b-9075-b5dd8b6659df" },
                                        "REST API documentation"
                                    )
                                ),
                                React.createElement("br", null),
                                React.createElement(ExportREST, { workflow_id: this.props.id, public_key: public_key_nodejs, inputs: this.props.inputs })
                            )
                        )
                    )
                );
            }
            return content;
        }
    });

    // Props:
    // - (string)public_key_content: The public key of the developer for javascript
    // - (string)workflow_id: The component id
    // - (object)inputs: The inputs required for the workflow
    var ExportJavascript = React.createClass({
        displayName: "ExportJavascript",
        selectImport: function selectImport() {
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function selectInit() {
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        selectExecute: function selectExecute() {
            $(ReactDOM.findDOMNode(this)).find('.execute').selectText();
        },
        render: function render() {
            var paramsFormatted = "";
            for (var i = 0; i < this.props.inputs.length; i++) {
                var row = this.props.inputs[i];
                if (i != 0) {
                    paramsFormatted += ", ";
                }

                paramsFormatted += row.name + ":";
                switch (row.type[0]) {
                    case "text":
                        paramsFormatted += '""';
                        break;

                    case "number":
                        paramsFormatted += '0';
                        break;

                    case "json":
                        paramsFormatted += '{}';
                        break;

                    case "date":
                        paramsFormatted += '"' + new Date().toISOString() + '"';
                        break;

                    case "bool":
                        paramsFormatted += ' true';
                        break;
                }

                if (i == this.props.inputs.length - 1) {
                    paramsFormatted += "\n";
                }
            }

            return React.createElement(
                "ol",
                null,
                React.createElement(
                    "li",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Import the Synchronise.JS library in your project"
                    ),
                    React.createElement(
                        "div",
                        { className: "code import", onClick: this.selectImport, style: { cursor: "pointer" } },
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "<"
                        ),
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "script"
                        ),
                        " ",
                        React.createElement(
                            "code",
                            { className: "color1" },
                            "src"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "="
                        ),
                        React.createElement(
                            "code",
                            { className: "string" },
                            "\"https://js.synchronise.io/1.0.min.js\""
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "></"
                        ),
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "script"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ">"
                        )
                    )
                ),
                React.createElement(
                    "li",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Initialize the library with your Public Key"
                    ),
                    React.createElement(
                        "div",
                        { className: "code init", onClick: this.selectInit, style: { cursor: "pointer" } },
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "Synchronise"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ".init("
                        ),
                        React.createElement(
                            "code",
                            { className: "string" },
                            "\"",
                            this.props.public_key,
                            "\""
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ");"
                        )
                    )
                ),
                React.createElement(
                    "li",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Execute the Workflow"
                    ),
                    React.createElement(
                        "div",
                        { className: "code execute", onClick: this.selectExecute, style: { cursor: "pointer" } },
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "Synchronise"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ".Workflow.run("
                        ),
                        React.createElement(
                            "code",
                            { className: "string" },
                            "\"",
                            this.props.workflow_id,
                            "\""
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ", ",
                            "{",
                            React.createElement("br", null),
                            "    ",
                            paramsFormatted,
                            "}, {"
                        ),
                        React.createElement("br", null),
                        "    ",
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "success"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ": ",
                            "function",
                            "("
                        ),
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "data"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ")",
                            "{"
                        ),
                        React.createElement("br", null),
                        "        ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "console.log(data);"
                        ),
                        React.createElement("br", null),
                        "    ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "},"
                        ),
                        React.createElement("br", null),
                        "    ",
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "error"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ": ",
                            "function",
                            "("
                        ),
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "err"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ")",
                            "{"
                        ),
                        React.createElement("br", null),
                        "        ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "console.log(err);"
                        ),
                        React.createElement("br", null),
                        "  ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "  },"
                        ),
                        React.createElement("br", null),
                        "    ",
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "always"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ": ",
                            "function",
                            "("
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ")",
                            "{"
                        ),
                        "        ",
                        React.createElement("code", { className: "plain" }),
                        React.createElement("br", null),
                        "  ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "  }"
                        ),
                        React.createElement("br", null),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "});"
                        )
                    )
                )
            );
        }
    });

    var ExportNodeJS = React.createClass({
        displayName: "ExportNodeJS",
        selectImport: function selectImport() {
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function selectInit() {
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        selectExecute: function selectExecute() {
            $(ReactDOM.findDOMNode(this)).find('.execute').selectText();
        },
        render: function render() {
            var paramsFormatted = "";
            for (var i = 0; i < this.props.inputs.length; i++) {
                var row = this.props.inputs[i];
                if (i != 0) {
                    paramsFormatted += ", ";
                }

                paramsFormatted += row.name + ":";
                switch (row.type[0]) {
                    case "text":
                        paramsFormatted += '""';
                        break;

                    case "number":
                        paramsFormatted += '0';
                        break;

                    case "json":
                        paramsFormatted += '{}';
                        break;

                    case "date":
                        paramsFormatted += '"' + new Date().toISOString() + '"';
                        break;

                    case "bool":
                        paramsFormatted += ' true';
                        break;
                }

                if (i == this.props.inputs.length - 1) {
                    paramsFormatted += "\n";
                }
            }

            return React.createElement(
                "ol",
                null,
                React.createElement(
                    "li",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Import the Synchronise NPM package in your project"
                    ),
                    React.createElement(
                        "div",
                        { className: "code import", onClick: this.selectImport, style: { cursor: "pointer" } },
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "npm install synchronise"
                        )
                    )
                ),
                React.createElement(
                    "li",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Require the package and initialize it with your Public Key"
                    ),
                    React.createElement(
                        "div",
                        { className: "code init", onClick: this.selectInit, style: { cursor: "pointer" } },
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "var "
                        ),
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "Synchronise"
                        ),
                        " = ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "require("
                        ),
                        React.createElement(
                            "code",
                            { className: "string" },
                            "\"synchronise\""
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ")("
                        ),
                        React.createElement(
                            "code",
                            { className: "string" },
                            "\"",
                            this.props.public_key,
                            "\""
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ");"
                        )
                    )
                ),
                React.createElement(
                    "li",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Execute the Workflow"
                    ),
                    React.createElement(
                        "div",
                        { className: "code execute", onClick: this.selectExecute, style: { cursor: "pointer" } },
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "Synchronise"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ".Workflow.run("
                        ),
                        React.createElement(
                            "code",
                            { className: "string" },
                            "\"",
                            this.props.workflow_id,
                            "\""
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ", ",
                            "{",
                            React.createElement("br", null),
                            "    ",
                            paramsFormatted,
                            "}, {"
                        ),
                        React.createElement("br", null),
                        "    ",
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "success"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ": ",
                            "function",
                            "("
                        ),
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "data"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ")",
                            "{"
                        ),
                        React.createElement("br", null),
                        "        ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "console.log(data);"
                        ),
                        React.createElement("br", null),
                        "    ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "},"
                        ),
                        React.createElement("br", null),
                        "    ",
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "error"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ": ",
                            "function",
                            "("
                        ),
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "err"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ")",
                            "{"
                        ),
                        React.createElement("br", null),
                        "        ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "console.log(err);"
                        ),
                        React.createElement("br", null),
                        "  ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "  },"
                        ),
                        React.createElement("br", null),
                        "    ",
                        React.createElement(
                            "code",
                            { className: "keyword" },
                            "always"
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ": ",
                            "function",
                            "("
                        ),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            ")",
                            "{"
                        ),
                        "        ",
                        React.createElement("code", { className: "plain" }),
                        React.createElement("br", null),
                        "  ",
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "  }"
                        ),
                        React.createElement("br", null),
                        React.createElement(
                            "code",
                            { className: "plain" },
                            "});"
                        )
                    )
                )
            );
        }
    });

    var ExportREST = React.createClass({
        displayName: "ExportREST",
        selectExecute: function selectExecute() {
            $(ReactDOM.findDOMNode(this)).find('.execute').selectText();
        },
        render: function render() {
            var paramsFormatted = "";
            for (var i = 0; i < this.props.inputs.length; i++) {
                var row = this.props.inputs[i];
                if (i != 0) {
                    paramsFormatted += ", ";
                }

                paramsFormatted += '"' + row.name + '":';
                switch (row.type[0]) {
                    case "text":
                        paramsFormatted += '""';
                        break;

                    case "number":
                        paramsFormatted += '0';
                        break;

                    case "json":
                        paramsFormatted += '{}';
                        break;

                    case "date":
                        paramsFormatted += '"' + new Date().toISOString() + '"';
                        break;

                    case "bool":
                        paramsFormatted += ' true';
                        break;
                }
            }

            return React.createElement(
                "ol",
                null,
                React.createElement(
                    "li",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Execute the Component"
                    ),
                    React.createElement(
                        "div",
                        { className: "code execute", onClick: this.selectExecute, style: { cursor: "pointer" } },
                        React.createElement(
                            "code",
                            { className: "plain" },
                            React.createElement(
                                "code",
                                { className: "keyword" },
                                "curl -X POST"
                            ),
                            " \\ ",
                            React.createElement("br", null),
                            React.createElement(
                                "code",
                                { className: "keyword" },
                                "-H"
                            ),
                            " ",
                            React.createElement(
                                "code",
                                { className: "string" },
                                "\"x-synchronise-public-key: ",
                                this.props.public_key,
                                "\""
                            ),
                            " \\ ",
                            React.createElement("br", null),
                            React.createElement(
                                "code",
                                { className: "keyword" },
                                "-H"
                            ),
                            " ",
                            React.createElement(
                                "code",
                                { className: "string" },
                                "\"Content-Type: application/json\""
                            ),
                            " \\ ",
                            React.createElement("br", null),
                            React.createElement(
                                "code",
                                { className: "keyword" },
                                "-d"
                            ),
                            " ",
                            React.createElement(
                                "code",
                                { className: "string" },
                                "'",
                                "{",
                                "\"id\":\"",
                                this.props.workflow_id,
                                "\", ",
                                paramsFormatted,
                                "}'"
                            ),
                            " \\ ",
                            React.createElement("br", null),
                            React.createElement(
                                "code",
                                { className: "keyword" },
                                "https",
                                "://",
                                "api.synchronise.io/workflow/run"
                            )
                        )
                    )
                )
            );
        }
    });
});