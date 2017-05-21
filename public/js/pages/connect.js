dependenciesLoader(["React", "ReactDOM", "$", "Loader", "Synchronise"], function () {
    var Connect = React.createClass({
        getInitialState: function () {
            return {
                public_key: ""
            };
        },
        componentDidMount: function () {
            Synchronise.LocalStorage.set("visitedConnect", true);

            var needToCreatePublicKey = false;
            var target = this;
            target.setState({ loading_key: true });

            if (!Synchronise.User.current().public_key) {
                needToCreatePublicKey = true;
            }

            if (needToCreatePublicKey) {
                Synchronise.Cloud.run("createPublicKey", { "type": "javascript" }, {
                    success: function (key) {
                        target.setState({ public_key: key.status });
                        Synchronise.User.fetchCurrent(); // Refresh local data
                        Synchronise.init(key.status);
                    },
                    error: function (err) {
                        new ModalErrorParse(err);
                    },
                    always: function () {
                        target.setState({ loading_key: false });
                    }
                });
            } else {
                var pk = Synchronise.User.current().public_key;
                target.setState({ public_key: pk });
                Synchronise.init(pk);
            }
        },
        render: function () {
            return React.createElement(
                "div",
                { className: "card" },
                React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "center",
                        null,
                        React.createElement("i", { className: "fa fa-plug", style: { fontSize: "4em", color: "black" } })
                    ),
                    React.createElement(
                        "legend",
                        { style: { fontWeight: "100%", fontSize: "3em", textAlign: "center" } },
                        "Connect"
                    )
                ),
                React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "p",
                        { style: { fontSize: "1.5em", textAlign: "center" } },
                        "Integrating our platform only takes a few seconds. You only need to do it once and for all!"
                    )
                ),
                React.createElement(
                    "div",
                    { id: "export" },
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
                    React.createElement(
                        "div",
                        { className: "tab-content", style: { marginTop: "20px" } },
                        React.createElement(
                            "div",
                            { role: "tabpanel", className: "tab-pane fade in active", id: "javascript" },
                            React.createElement(ExportJavascript, { public_key: this.state.public_key })
                        ),
                        React.createElement(
                            "div",
                            { role: "tabpanel", className: "tab-pane fade", id: "nodejs" },
                            React.createElement(ExportNodeJS, { public_key: this.state.public_key })
                        ),
                        React.createElement(
                            "div",
                            { role: "tabpanel", className: "tab-pane fade", id: "rest" },
                            React.createElement(ExportREST, { public_key: this.state.public_key })
                        )
                    )
                )
            );
        }
    });

    // Props:
    // - (string)public_key: The public key of the developer for javascript
    var ExportJavascript = React.createClass({
        displayName: "ExportJavascript",
        selectImport: function () {
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function () {
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        render: function () {
            return React.createElement(
                "ol",
                null,
                React.createElement(
                    "li",
                    null,
                    React.createElement(
                        "legend",
                        null,
                        "Import the Synchronise.JS library in your app/project"
                    ),
                    React.createElement(
                        "div",
                        { className: "code import", style: { cursor: "pointer" }, onClick: this.selectImport },
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
                            "\"/js/1.0.min.js\""
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
                        { className: "code init", style: { cursor: "pointer" }, onClick: this.selectInit },
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
                )
            );
        }
    });

    // Props:
    // - (string)public_key: The public key of the developer for nodejs
    var ExportNodeJS = React.createClass({
        displayName: "ExportNodeJS",
        selectImport: function () {
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function () {
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        render: function () {
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
                )
            );
        }
    });

    // Props:
    // - (string)public_key: The public key of the developer for rest
    var ExportREST = React.createClass({
        displayName: "ExportREST",
        selectImport: function () {
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function () {
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        render: function () {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "center",
                    null,
                    "The requests you make to our REST API need to be authenticated using your PUBLIC KEY.",
                    React.createElement("br", null),
                    "All requests have to be executed using HTTPS, we do not provide an HTTP endpoint."
                ),
                React.createElement(
                    "div",
                    { className: "code" },
                    React.createElement(
                        "code",
                        { className: "plain" },
                        "https://api.synchronise.io/[component|workflow]/run"
                    )
                ),
                React.createElement(
                    "ol",
                    { style: { marginTop: "20px" } },
                    React.createElement(
                        "li",
                        null,
                        React.createElement(
                            "legend",
                            null,
                            "Example request for component"
                        ),
                        React.createElement(
                            "div",
                            { className: "code import", onClick: this.selectImport, style: { cursor: "pointer" } },
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
                                    `{`,
                                    "\"id\":ID_COMPONENT, ... ANY OTHER PARAMETERS TO SEND}'"
                                ),
                                " \\ ",
                                React.createElement("br", null),
                                React.createElement(
                                    "code",
                                    { className: "keyword" },
                                    "https",
                                    `://`,
                                    "api.synchronise.io/component/run"
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "li",
                        null,
                        React.createElement(
                            "legend",
                            null,
                            "Example request for workflow"
                        ),
                        React.createElement(
                            "div",
                            { className: "code init", onClick: this.selectInit, style: { cursor: "pointer" } },
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
                                    `{`,
                                    "\"id\":ID_WORKFLOW, ... ANY OTHER PARAMETERS TO SEND}'"
                                ),
                                " \\ ",
                                React.createElement("br", null),
                                React.createElement(
                                    "code",
                                    { className: "keyword" },
                                    "https",
                                    `://`,
                                    "api.synchronise.io/workflow/run"
                                )
                            )
                        )
                    )
                )
            );
        }
    });

    ReactDOM.render(React.createElement(Connect, null), document.getElementById('connect'));
});