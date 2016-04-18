"use strict";

dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function () {
    // This creates and populates a fake database for development purposes
    var Docs = React.createClass({
        displayName: "Docs",
        getInitialState: function getInitialState() {
            return {
                loading: false,
                loaded: false,
                sections: []
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;

            $(ReactDOM.findDOMNode(this)).on('click', "#loadDocumenttion", function () {
                target.setState({ loading: true });
                Synchronise.Cloud.run("getDocumentationTree", { realtime: true }, {
                    success: function success(data) {
                        target.setState({ sections: _.sortBy(data, function (row) {
                                return parseInt(row.order);
                            }) });
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    always: function always() {
                        target.setState({ loading: false, loaded: true });
                    }
                });
            });
        },
        addSection: function addSection() {
            var target = this;
            if (!this.state.saving) {
                target.setState({ saving: true });

                var params = {
                    level: 0,
                    parent: "",
                    order: parseInt(this.state.sections.length + 1),
                    name: "New section"
                };

                Synchronise.Cloud.run("addSectionDocumentation", _.extend({ id: this.props.id }, params), {
                    success: function success() {},
                    always: function always() {
                        target.setState({ saving: false });
                    }
                });
            }
        },
        render: function render() {
            var loader = "";
            if (this.state.loading) {
                loader = React.createElement(Loader, null);
            }

            var labelForAddSectionButton = "Add section";
            if (this.state.saving) {
                labelForAddSectionButton = "Saving...";
            }

            var content = "";
            if (!this.state.loading && this.state.loaded) {
                content = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { role: "tablist", "aria-multiselectable": "true" },
                        this.state.sections.map(function (sec, index) {
                            return React.createElement(DocsSection, { id: sec.id,
                                displayed: true,
                                key: "section" + sec.id + index });
                        })
                    ),
                    React.createElement(
                        "div",
                        { className: "col-xs-12", style: { textAlign: "center" } },
                        React.createElement(
                            "button",
                            { className: "btn btn-default", onClick: this.addSection },
                            labelForAddSectionButton
                        )
                    ),
                    React.createElement("hr", null)
                );
            }

            var buttonStartLoading = "";
            if (!this.state.loading && !this.state.loaded) {
                buttonStartLoading = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(
                        "button",
                        { className: "btn btn-primary", id: "loadDocumenttion" },
                        "Load documentation"
                    )
                );
            }

            return React.createElement(
                "div",
                { className: "row-fluid" },
                loader,
                content,
                buttonStartLoading
            );
        }
    });

    // Props:
    // - (string)id: the ID of the section
    // - (boolean)displayed: Wether or not the section is on display. The section will only load data if it is displayed
    var DocsSection = React.createClass({
        displayName: "DocsSection",
        getInitialState: function getInitialState() {
            return {
                name: "Loading...",
                content: "",
                parent: "",
                order: 0,
                level: 0,
                loading: false,
                loaded: false,
                isOpened: false,
                subsections: [],
                backgroundColor: "#3E4EB8",
                color: "#3E4EB8",
                activeColor: "#3E4EB8",
                published: false
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;

            if (target.props.displayed) {
                target.loadData();
            }

            $(ReactDOM.findDOMNode(this)).on("click", ".openSection", function () {
                target.setState({ isOpened: !target.state.isOpened });
            });
        },
        componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
            if (nextProps.displayed) {
                this.loadData();
            }
        },
        loadData: function loadData() {
            var target = this;

            if (!target.state.loading && !target.state.loaded) {
                target.setState({ loading: true });

                Synchronise.Cloud.run("getDocumentationSection", { id: target.props.id, realtime: true }, {
                    success: function success(data) {
                        if (data) {
                            var params = {
                                name: data.name,
                                order: data.order,
                                level: data.level,
                                parent: data.parent,
                                backgroundColor: data.backgroundColor,
                                color: data.color,
                                activeColor: data.activeColor,
                                published: data.published,
                                content: data.content
                            };

                            var promises = [];
                            var subsections = [];

                            _.each(data.subsections, function (cur) {
                                promises.push(new Promise(function (resolve, reject) {
                                    Synchronise.Cloud.run("getDocumentationSection", { id: cur.id, cacheFirst: true, realtime: false }, {
                                        success: function success(data) {
                                            var alreadyExists = false;
                                            _.each(subsections, function (row) {
                                                if (row.id == data.id) {
                                                    alreadyExists = true;
                                                }
                                            });
                                            if (!alreadyExists) {
                                                subsections.push(data);
                                            }
                                        },
                                        always: function always() {
                                            resolve();
                                        }
                                    });
                                }));
                            });

                            Promise.all(promises).then(function () {
                                params.subsections = _.sortBy(subsections, function (row) {
                                    return parseInt(row.order);
                                });
                                params.loading = false;
                                if (target.isMounted()) {
                                    target.setState(params);
                                }
                            });
                        }
                    },
                    always: function always() {
                        target.setState({ loaded: true });
                    }
                });
            }
        },
        updateSection: function updateSection(type, event) {
            var target = this;

            var params = {};
            if (type === "published") {
                params["published"] = !target.state.published;
            } else {
                params[type] = event.target.value;
            }

            if (type === "published") {
                target.setState({ published: !target.state.published });
            } else {
                target.setState(params);
            }

            Synchronise.Cloud.run("updateDocumentationSection", _.extend({ id: target.props.id }, { data: params }));
        },
        addSubsection: function addSubsection() {
            var target = this;

            var params = {
                level: parseInt(parseInt(target.state.level) + 1),
                parent: target.props.id,
                order: parseInt(target.state.subsections.length + 1),
                name: "New section"
            };

            Synchronise.Cloud.run("addSectionDocumentation", _.extend({ id: this.props.id }, params));
        },
        removeSubsection: function removeSubsection(id_section) {
            var target = this;

            var params = {
                parent: target.state.parent,
                id_section: target.props.id
            };

            Synchronise.Cloud.run("removeSectionDocumentation", _.extend({ id: this.props.id }, params));
        },
        displaySubsection: function displaySubsection(id) {
            var tempSub = this.state.subsections;
            var tempDisp = this.state.displayedSubsection;

            var indexT = 0;

            _.each(tempSub, function (subsec, i) {
                if (subsec.id == id) {
                    tempDisp.push(subsec);
                    indexT = i;
                }
            });

            tempSub.splice(indexT, 1);

            this.setState({ subsections: tempSub, displayedSubsection: _.sortBy(tempDisp, function (subsec) {
                    return subsec.order;
                }) });
        },
        render: function render() {
            var target = this;

            return React.createElement(
                "div",
                { style: { marginLeft: this.state.level * 15 + "px" } },
                React.createElement(
                    "div",
                    { className: "card", style: { background: this.state.backgroundColor } },
                    React.createElement(
                        "a",
                        { className: "openSection", style: { color: this.state.color }, role: "button", "data-toggle": "collapse", "data-parent": "#accordion", href: "#" + this.props.id, "aria-expanded": "true", "aria-controls": "collapseOne" },
                        this.state.name
                    ),
                    React.createElement(
                        "div",
                        { className: "pull-right" },
                        React.createElement(
                            "a",
                            { className: "btn btn-primary btn-xs", href: "/docs?cache=false#" + this.props.id, target: "_blank" },
                            "Show"
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { id: this.props.id, className: "panel-collapse collapse row-fluid", role: "tabpanel", style: { marginTop: "-30px" } },
                    React.createElement(
                        "div",
                        { className: "card" },
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "div",
                                { className: "col-lg-7 col-md-7 col-sm-7 col-xs-12" },
                                React.createElement("input", { type: "text",
                                    className: "form-control",
                                    placeholder: "Title of the section",
                                    value: this.state.name,
                                    onChange: this.updateSection.bind(null, "name") }),
                                React.createElement("br", null),
                                React.createElement("textarea", { className: "form-control",
                                    value: this.state.content,
                                    placeholder: "Content of the section",
                                    onChange: this.updateSection.bind(null, "content") })
                            ),
                            React.createElement(
                                "div",
                                { className: "col-lg-2 col-md-2 col-sm-2 col-xs-12", style: { textAlign: "center" } },
                                "(O ",
                                React.createElement("input", { type: "text", value: this.state.order, onChange: this.updateSection.bind(null, "order") }),
                                " - L : ",
                                this.state.level,
                                ")",
                                React.createElement("br", null),
                                "Published: ",
                                React.createElement("input", { type: "checkbox", checked: this.state.published, onChange: this.updateSection.bind(null, "published") })
                            ),
                            React.createElement(
                                "div",
                                { className: "col-lg-3 col-md-3 col-sm-3 col-xs-12" },
                                "Background color: ",
                                React.createElement("input", { className: "pull-right", id: "background-color", type: "color", value: this.state.backgroundColor, onChange: this.updateSection.bind(null, "backgroundColor") }),
                                React.createElement("br", null),
                                "Text Color: ",
                                React.createElement("input", { className: "pull-right", id: "color", type: "color", value: this.state.color, onChange: this.updateSection.bind(null, "color") }),
                                React.createElement("br", null),
                                "Active Text Color: ",
                                React.createElement("input", { className: "pull-right", id: "active-color", type: "color", value: this.state.activeColor, onChange: this.updateSection.bind(null, "activeColor") }),
                                React.createElement("br", null),
                                React.createElement("br", null),
                                React.createElement("i", { className: "fa fa-caret-square-o-up", style: { fontSize: "30px", color: "#A2A2A2" } }),
                                React.createElement("i", { className: "fa fa-caret-square-o-down", style: { fontSize: "30px", marginLeft: "10px", color: "#A2A2A2" } }),
                                React.createElement("i", { className: "pull-right fa fa-times", style: { fontSize: "20px", marginRight: "10px", color: "#A2A2A2" }, onClick: this.removeSubsection.bind(null, this.props.id) })
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "row", style: { marginTop: "-20px", marginBottom: "10px" } },
                        React.createElement(
                            "div",
                            { className: "col-xs-12", style: { textAlign: "center" }, onClick: this.addSubsection },
                            React.createElement(
                                "button",
                                { className: "btn btn-default btn-xs" },
                                "Add subsection to ",
                                this.state.name
                            )
                        )
                    ),
                    target.state.subsections.map(function (subsec, index) {
                        return React.createElement(DocsSection, { id: subsec.id,
                            displayed: target.state.isOpened,
                            parent: target.state.parent,
                            key: "section" + subsec.id + target.state.parent + index });
                    })
                )
            );
        }
    });

    var isAllowedThisSection = false;
    _.each(Synchronise.User.current().roles, function (row) {
        if (row.name == "superadmin" || row.name == "admin" || row.name == "docwriter") {
            isAllowedThisSection = true;
        }
    });

    if (isAllowedThisSection) {
        ReactDOM.render(React.createElement(Docs, null), document.getElementById("docs"));
    }
});