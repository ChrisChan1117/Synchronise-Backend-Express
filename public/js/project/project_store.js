"use strict";

var ProjectModalStore;

dependenciesLoader(["React", "ReactDOM", "_", "Loader"], function () {
    ProjectModalStore = React.createClass({
        displayName: "ProjectModalStore",

        getInitialState: function getInitialState() {
            return {
                loading: false,
                isSubmitting: false,
                isPublishing: false,
                bg_color: "",
                txt_color: "",
                icon_flts: "",
                icon: "",
                name: "",
                colorPickers: [],
                published: false,
                community: false
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            target.setState({ loading: true });

            if (this.props.id_project) {
                Synchronise.Cloud.run("getProject", { id_project: this.props.id_project, realtime: true }, {
                    success: function success(project) {
                        if (target.isMounted()) {
                            var colorProperties = ["bg_color", "txt_color"];
                            var colorPickers = [];

                            _.each(colorProperties, function (row) {
                                var picker = $(ReactDOM.findDOMNode(target)).find("." + row).colorpicker();
                                picker.on('changeColor.colorpicker', function (event) {
                                    var params = { id_project: project.id };
                                    params[row] = event.color.toHex();

                                    target.setState(params);
                                    Synchronise.Cloud.run("createOrUpdateProject", params);
                                });
                                colorPickers.push(picker);
                            });

                            target.setState({
                                bg_color: project.bg_color,
                                txt_color: project.txt_color,
                                icon_flts: project.icon_flts,
                                icon: project.icon,
                                name: project.name,
                                colorPickers: colorPickers,
                                published: project.published,
                                community: project.community
                            });
                        }
                    },
                    error: function error(err) {
                        new ModalErrorParse(err, function () {
                            target.closeModal();
                        });
                    },
                    always: function always() {
                        if (target.isMounted()) {
                            target.setState({ loading: false, isSubmitting: false, isPublishing: false });
                            $('[data-toggle="tooltip"]').tooltip('destroy');
                            $('[data-toggle="tooltip"]').tooltip();
                        }
                    }
                });
            }
        },
        componentWillUnmount: function componentWillUnmount() {
            _.each(this.state.colorPickers, function (picker) {
                picker.colorpicker("destroy");
            });
        },
        submitProjectToTheStore: function submitProjectToTheStore(value) {
            var target = this;
            if (!this.state.isSubmitting) {
                target.setState({ isSubmitting: true });
                Synchronise.Cloud.run("createOrUpdateProject", { id_project: this.props.id_project, published: value }, {});
            }
        },
        setPublished: function setPublished(value) {
            var target = this;
            if (!this.state.isPublishing) {
                target.setState({ isPublishing: true });
                Synchronise.Cloud.run("createOrUpdateProject", { id_project: this.props.id_project, community: value }, {});
            }
        },
        render: function render() {
            var target = this;
            var content = "";

            var submissionContent = "";
            var titleSubmission = "";
            var submitButton = "";
            var setPublicButton = "";
            var marketPlacePageButton = "";
            if (this.state.published) {
                var labelUnpublishProjectButton = "Unpublish";
                if (this.state.isSubmitting) {
                    labelUnpublishProjectButton = "Unpublishing...";
                }

                titleSubmission = React.createElement(
                    "legend",
                    null,
                    "Market Place ",
                    React.createElement(
                        "label",
                        { className: "label label-success pull-right", style: { fontSize: "50%", marginTop: "10px" } },
                        "Project published"
                    )
                );
                submitButton = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(
                        "button",
                        { className: "btn btn-warning",
                            onClick: this.submitProjectToTheStore.bind(null, false),
                            "data-toggle": "tooltip",
                            "data-placement": "top",
                            title: "The project will no longer be visible on the market place. Developers that have used or created components for this project, will still have access to the resources they had used before unpublication." },
                        labelUnpublishProjectButton
                    )
                );
                marketPlacePageButton = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(
                        "a",
                        { href: "/marketplace/project/" + this.props.id_project, className: "btn btn-primary" },
                        "Go to marketplace"
                    )
                );
            } else {
                var labelSubmitProjectButton = "Submit my Project";
                if (this.state.isSubmitting) {
                    labelSubmitProjectButton = "Submitting...";
                }

                titleSubmission = React.createElement(
                    "legend",
                    null,
                    "Submit to the MarketPlace"
                );
                submitButton = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(
                        "button",
                        { className: "btn btn-primary", onClick: this.submitProjectToTheStore.bind(null, true) },
                        labelSubmitProjectButton
                    )
                );
            }

            if (this.state.community) {
                var labelPublishingProjectButton = "Set private";
                if (this.state.isPublishing) {
                    labelPublishingProjectButton = "Unpublishing...";
                }
                setPublicButton = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(
                        "button",
                        { className: "btn btn-warning",
                            onClick: this.setPublished.bind(null, false),
                            "data-toggle": "tooltip",
                            "data-placement": "top",
                            title: "Other developers will no longer be able to create and publish new components for this project. However, existing components will keep their current publication status." },
                        labelPublishingProjectButton
                    )
                );
            } else {
                var labelPublishingProjectButton = "Set public";
                if (this.state.isPublishing) {
                    labelPublishingProjectButton = "Publishing...";
                }
                setPublicButton = React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(
                        "button",
                        { className: "btn btn-success",
                            onClick: this.setPublished.bind(null, true),
                            "data-toggle": "tooltip",
                            "data-placement": "top",
                            title: "Making a project public allow other developers to contribute to it by creating new components. The contributors will not be able to edit the components you have made, but they will be able to create and publish new ones." },
                        labelPublishingProjectButton
                    )
                );
            }

            submissionContent = React.createElement(
                "div",
                { className: "col-xs-12" },
                titleSubmission,
                React.createElement("br", null),
                marketPlacePageButton,
                React.createElement("br", null),
                setPublicButton,
                React.createElement("br", null),
                submitButton
            );

            if (this.state.loading) {
                content = React.createElement(Loader, null);
            } else {
                content = React.createElement(
                    "div",
                    { className: "row-fluid store" },
                    React.createElement(
                        "div",
                        { className: "col-xs-12" },
                        React.createElement(
                            "p",
                            null,
                            "If you think your project could be beneficial to the rest of the community you can make it available on the Market Place. We only require you to define few esthetical elements in order to keep the consistency of our platform. Choosing the right visual elements can help your project stand out from the rest of the projects on the market."
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "col-md-6 col-sm-12 col-xs-12", style: { textAlign: "center" } },
                        React.createElement(
                            "legend",
                            null,
                            "Settings"
                        ),
                        React.createElement(
                            "div",
                            { className: "form-group" },
                            React.createElement(
                                "label",
                                null,
                                "Background color"
                            ),
                            " ",
                            React.createElement("input", { type: "text",
                                className: "bg_color",
                                defaultValue: this.state.bg_color })
                        ),
                        React.createElement(
                            "div",
                            { className: "form-group" },
                            React.createElement(
                                "label",
                                null,
                                "Text color"
                            ),
                            " ",
                            React.createElement("input", { type: "text",
                                className: "txt_color",
                                defaultValue: this.state.txt_color })
                        ),
                        submissionContent
                    ),
                    React.createElement(
                        "div",
                        { className: "col-md-6 col-sm-12 col-xs-12 preview" },
                        React.createElement(
                            "legend",
                            { style: { textAlign: "center" } },
                            "Preview"
                        ),
                        React.createElement(
                            "p",
                            { style: { textAlign: "center" } },
                            "The following blocks will help you to see how your project will look like on the rest of the platform."
                        ),
                        React.createElement(
                            "ul",
                            { className: "nav nav-tabs", role: "tablist" },
                            React.createElement(
                                "li",
                                { role: "presentation", className: "active" },
                                React.createElement(
                                    "a",
                                    { href: "#project", "aria-controls": "project", role: "tab", "data-toggle": "tab" },
                                    "Project"
                                )
                            ),
                            React.createElement(
                                "li",
                                { role: "presentation" },
                                React.createElement(
                                    "a",
                                    { href: "#workflow", "aria-controls": "workflow", role: "tab", "data-toggle": "tab" },
                                    "Workflow"
                                )
                            ),
                            React.createElement(
                                "li",
                                { role: "presentation" },
                                React.createElement(
                                    "a",
                                    { href: "#marketPlace", "aria-controls": "marketPlace", role: "tab", "data-toggle": "tab" },
                                    "Market Place"
                                )
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "tab-content" },
                            React.createElement(
                                "div",
                                { role: "tabpanel",
                                    className: "tab-pane active",
                                    style: { backgroundColor: "#edecec" },
                                    id: "project" },
                                React.createElement(
                                    "div",
                                    { style: { backgroundColor: "#edecec", display: "-webkit-box", marginTop: "20px" } },
                                    React.createElement(
                                        "div",
                                        { className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-10 col-sm-offset-1 col-xs-12 project" },
                                        React.createElement(
                                            "div",
                                            { className: "card display", style: { backgroundColor: this.state.bg_color, color: this.state.txt_color, borderRadius: "5px", marginTop: "35px", minHeight: "150px", maxHeight: "150px" } },
                                            React.createElement(
                                                "div",
                                                { className: "settings" },
                                                React.createElement("i", { className: "fa fa-cog" })
                                            ),
                                            React.createElement(
                                                "div",
                                                { className: "delete" },
                                                React.createElement("i", { className: "fa fa-trash" })
                                            ),
                                            React.createElement(
                                                "div",
                                                { className: "team" },
                                                React.createElement("i", { className: "fa fa-users" })
                                            ),
                                            React.createElement(
                                                "div",
                                                { style: { opacity: "1", textAlign: "center", width: "100%" } },
                                                React.createElement("img", { src: this.state.icon, style: { width: "50px", borderRadius: "5px", marginTop: "-35px" } })
                                            ),
                                            React.createElement(
                                                "center",
                                                null,
                                                React.createElement(
                                                    "h3",
                                                    { style: { color: this.state.txt_color } },
                                                    this.state.name
                                                )
                                            )
                                        )
                                    )
                                )
                            ),
                            React.createElement(
                                "div",
                                { role: "tabpanel",
                                    className: "tab-pane",
                                    id: "workflow" },
                                React.createElement(
                                    "div",
                                    { style: { backgroundColor: "#edecec", marginTop: "30px", paddingTop: "10px" } },
                                    React.createElement(
                                        "div",
                                        { className: "row-fluid", style: { textAlign: "center" } },
                                        React.createElement(
                                            "button",
                                            { className: "btn btn-primary" },
                                            "Run"
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "row-fluid", style: { textAlign: "center", marginBottom: "10px" } },
                                        React.createElement(
                                            "ul",
                                            { className: "nav nav-tabs", role: "tablist" },
                                            React.createElement(
                                                "li",
                                                { role: "presentation", className: "active", style: { display: "inline-block", float: "none" } },
                                                React.createElement(
                                                    "a",
                                                    { role: "tab", "data-toggle": "tab" },
                                                    "Workflow"
                                                )
                                            ),
                                            React.createElement(
                                                "li",
                                                { role: "presentation", style: { display: "inline-block", float: "none" } },
                                                React.createElement(
                                                    "a",
                                                    { role: "tab", "data-toggle": "tab" },
                                                    "Settings"
                                                )
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "row" },
                                        React.createElement(
                                            "div",
                                            { className: "card col-lg-10 col-lg-offset-1 col-md-8 col-md-offset-2 col-sm-6 col-sm-offset-3 col-xs-12 ", style: { minHeight: "230px" } },
                                            React.createElement(
                                                "center",
                                                null,
                                                React.createElement("input", { type: "text", placeholder: "Search by name", className: "form-control", style: { marginBottom: "10px" } })
                                            ),
                                            React.createElement(
                                                "div",
                                                { className: "card workflow", style: { background: this.state.bg_color, color: this.state.txt_color } },
                                                React.createElement("img", { src: this.state.icon, style: { width: "50px", height: "50px", borderRadius: "5px" } }),
                                                React.createElement(
                                                    "span",
                                                    { className: "title" },
                                                    this.state.name
                                                )
                                            ),
                                            React.createElement(
                                                "div",
                                                { className: "card", style: { minHeight: "50px", border: "1px solid " + this.state.bg_color, marginTop: "-30px" } },
                                                React.createElement(
                                                    "span",
                                                    { style: { color: "#777", fontWeight: "bold" } },
                                                    "A component"
                                                )
                                            )
                                        )
                                    )
                                )
                            ),
                            React.createElement(
                                "div",
                                { role: "tabpanel",
                                    className: "tab-pane",
                                    id: "marketPlace" },
                                React.createElement(
                                    "div",
                                    { style: { backgroundColor: "#edecec", marginTop: "30px", padding: "0" } },
                                    React.createElement(
                                        "div",
                                        { className: "row" },
                                        React.createElement(
                                            "div",
                                            { className: "card col-xs-10 col-xs-offset-1", style: { minHeight: "150px", background: this.state.bg_color, color: this.state.txt_color, borderRadius: "5px", marginTop: "20px" } },
                                            React.createElement(
                                                "div",
                                                { style: { height: "75px", width: "100%", textAlign: "center", lineHeight: "75px" } },
                                                React.createElement("img", { src: this.state.icon, style: { width: "50px", borderRadius: "5px" } })
                                            ),
                                            React.createElement(
                                                "div",
                                                { style: { height: "75px", width: "100%", textAlign: "center", lineHeight: "75px" } },
                                                React.createElement(
                                                    "h3",
                                                    { style: { color: this.state.txt_color } },
                                                    this.state.name
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                );
            }

            return React.createElement(
                "div",
                { role: "tabpanel", className: "tab-pane fade in store " + this.props.state, id: "store" },
                content
            );
        }
    });
});