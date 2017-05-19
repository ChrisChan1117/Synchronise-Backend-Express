"use strict";

dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_", "Typeahead"], function () {
    // Displays all the sections
    var Sections = React.createClass({
        displayName: "Sections",
        getInitialState: function getInitialState() {
            return {
                loading: false,
                saving: false,
                sections: []
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("getSectionsMarketPlace", { realtime: true }, {
                success: function success(data) {
                    target.setState({
                        sections: _.sortBy(data, function (row) {
                            return row.order;
                        })
                    });
                },
                error: function error(err) {
                    new ModalErrorParse(err);
                },
                always: function always() {
                    target.setState({ loading: false });
                }
            });
        },
        addSection: function addSection() {
            var target = this;
            if (!target.state.saving) {
                target.setState({ saving: true });

                Synchronise.Cloud.run("addSectionMarketPlace", {}, {
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    always: function always() {
                        target.setState({ saving: false });
                    }
                });
            }
        },
        render: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { style: { marginBottom: "10px", textAlign: "center" } },
                    React.createElement(
                        "button",
                        { className: "btn btn-primary", onClick: this.addSection },
                        "Add section"
                    )
                ),
                React.createElement(
                    "div",
                    { id: "sectionMarketPlaceAccordion",
                        role: "tablist",
                        "aria-multiselectable": "true" },
                    this.state.sections.map(function (row, index) {
                        return React.createElement(Section, { id: row.id, key: "sectionMarketPlace" + row.id + index });
                    })
                )
            );
        }
    });

    // Display a section using its ID
    // Props:
    // - (string)id: the id of the section
    // - (integer)index: the index of the section in the list
    var Section = React.createClass({
        displayName: "Section",
        getInitialState: function getInitialState() {
            return {
                loading: false,
                saving: false,
                removingSection: false,
                image: "",
                uploadingImage: false,
                addingItem: false,
                order: 0,
                blocks: [],
                title: "Loading...",
                name: "",
                filePickerValue: ""
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("getSectionMarketPlaceById", { id: this.props.id, realtime: true }, {
                success: function success(data) {
                    target.setState({
                        blocks: _.sortBy(data.blocks, function (row) {
                            return row.order;
                        }),
                        name: data.name,
                        title: data.title,
                        order: data.order,
                        image: data.image
                    });
                },
                error: function error(err) {
                    new ModalErrorParse(err);
                },
                always: function always() {
                    target.setState({ loading: false });
                }
            });
        },
        updateSection: function updateSection(property, event) {
            var target = this;

            var data = {};
            data[property] = event.target.value;

            target.setState(_.extend({ saving: true }, data));

            Synchronise.Cloud.run("updateSectionMarketPlace", _.extend({ id: this.props.id }, data), {
                error: function error(err) {
                    new ModalErrorParse(err);
                },
                always: function always() {
                    target.setState({ saving: false });
                }
            });
        },
        removeSection: function removeSection() {
            var target = this;
            new ModalConfirm("Are you sure you want to remove that section", function (confirm) {
                if (confirm) {
                    if (!target.state.removingSection) {
                        target.setState({ removingSection: true });
                        Synchronise.Cloud.run("removeSectionMarketPlace", { id: target.props.id }, {
                            error: function error(err) {
                                new ModalErrorParse(err);
                            },
                            always: function always() {
                                target.setState({ removingSection: false });
                            }
                        });
                    }
                }
            });
        },
        addItem: function addItem() {
            var target = this;
            if (!target.state.addingItem) {
                target.updateSection("blocks", {
                    target: {
                        value: target.state.blocks.concat({
                            type: "project",
                            id: "",
                            order: target.state.blocks.length
                        })
                    }
                });
            }
        },
        uploadImage: function uploadImage() {
            var target = this;
            $(ReactDOM.findDOMNode(this)).find('.filePicker').trigger('click');
        },
        filePickerValueChange: function filePickerValueChange(event) {
            var target = this;
            target.setState({ uploadingImage: true });

            if (!this.state.uploadingImage) {
                var value = $(ReactDOM.findDOMNode(this)).find('.filePicker').prop("files");
                Synchronise.File.upload(value, "synchronise-images", {
                    success: function success(urls) {
                        target.updateSection("image", {
                            target: {
                                value: "/images/" + urls[0].filename
                            }
                        });
                    },
                    always: function always() {
                        target.setState({ uploadingImage: false });
                    }
                });
            }
        },
        itemChanged: function itemChanged(index, id_new_item) {
            var blocks = this.state.blocks.slice(0); // Copy the existing array
            blocks[index].id = id_new_item;
            this.updateSection("blocks", { target: { value: blocks } });
        },
        itemTypeChanged: function itemTypeChanged(index, newType) {
            var blocks = this.state.blocks.slice(0); // Copy the existing array
            blocks[index].type = newType;
            blocks[index].id = "";
            this.updateSection("blocks", { target: { value: blocks } });
        },
        render: function render() {
            var target = this;

            var uploadButtonLabel = "Upload image";
            if (this.state.uploadingImage) {
                uploadButtonLabel = "Uploading...";
            }

            var removeSectionButtonLabel = "Remove";
            if (this.state.removingSection) {
                removeSectionButtonLabel = "Removing...";
            }

            var addItemButtonLabel = "Add item";
            if (this.state.addingItem) {
                addItemButtonLabel = "Adding...";
            }

            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { className: "card" },
                    React.createElement(
                        "a",
                        { role: "button",
                            "data-toggle": "collapse",
                            "data-parent": "#sectionMarketPlaceAccordion",
                            href: "#" + this.props.id,
                            "aria-expanded": "false",
                            "aria-controls": this.props.id },
                        this.state.title
                    ),
                    React.createElement(
                        "div",
                        { style: { float: "right", marginRight: "10px" } },
                        React.createElement(
                            "b",
                            null,
                            "Order: "
                        ),
                        React.createElement("input", { type: "number", placeholder: "(integer)Order", value: this.state.order, onChange: this.updateSection.bind(null, "order") }),
                        React.createElement(
                            "button",
                            { className: "btn btn-xs btn-default", onClick: this.removeSection },
                            removeSectionButtonLabel
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "card collapse", role: "tabpanel", id: this.props.id, style: { marginTop: "-30px", borderTop: "1px dotted lightgray" } },
                    React.createElement(
                        "div",
                        { className: "row" },
                        React.createElement(
                            "div",
                            { className: "col-lg-6 col-md-6 col-sm-6" },
                            React.createElement(
                                "b",
                                null,
                                "Title"
                            ),
                            React.createElement("input", { type: "text", placeholder: "Title", value: this.state.title, className: "form-control", onChange: this.updateSection.bind(null, "title") }),
                            React.createElement(
                                "b",
                                null,
                                "Unique name"
                            ),
                            React.createElement("input", { type: "text", placeholder: "Name", value: this.state.name, className: "form-control", onChange: this.updateSection.bind(null, "name") })
                        ),
                        React.createElement(
                            "div",
                            { className: "col-lg-6 col-md-6 col-sm-6", style: { textAlign: "center" } },
                            React.createElement("img", { src: this.state.image, className: "img-thumbnail", style: { width: "200px", height: "83px" } }),
                            React.createElement("br", null),
                            React.createElement("input", { style: { position: "absolute", width: "0", height: "0", zIndex: "-1" }, type: "file", accept: "image/*", className: "filePicker", onChange: this.filePickerValueChange }),
                            React.createElement(
                                "button",
                                { className: "btn btn-primary btn-sm", onClick: this.uploadImage, style: { marginTop: "10px" } },
                                uploadButtonLabel
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement("div", { className: "col-xs-12", style: { borderTop: "1px dotted lightgray", marginTop: "10px", marginBottom: "10px" } })
                    ),
                    React.createElement(
                        "div",
                        { className: "row" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement(
                                "div",
                                { className: "row", style: { textAlign: "center", marginTop: "10px" } },
                                React.createElement(
                                    "button",
                                    { className: "btn btn-primary", onClick: this.addItem },
                                    addItemButtonLabel
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "row", style: { marginTop: "10px" } },
                        this.state.blocks.map(function (row, index) {
                            return React.createElement(SectionItem, { id: row.id,
                                type: row.type,
                                index: index,
                                key: "item" + index + "forsection" + target.props.id,
                                itemChanged: target.itemChanged.bind(null, index),
                                itemTypeChanged: target.itemTypeChanged.bind(null, index) });
                        })
                    )
                )
            );
        }
    });

    // Display an item of MarketPlaceCollection
    // - (string)id: The id of the item to display
    // - (number)index: Index of the SectionItem in the list
    // - (string)type: The type of the item to display (project, component, collection...)
    // - (function)itemChanged: Callback to be triggered whenever the item selected has changed
    // - (function)itemTypeChanged: Callback to be triggered whenever the type of the item has changed
    var SectionItem = React.createClass({
        displayName: "SectionItem",
        getInitialState: function getInitialState() {
            return {
                optionsForTypeahead: []
            };
        },
        itemSearchSelected: function itemSearchSelected(e) {
            if (e.item) {
                this.props.itemChanged(e.item.value);
            }
        },
        typeaheadSearchChanged: function typeaheadSearchChanged(e) {
            var target = this;
            Synchronise.Cloud.run("searchForItemsInMarketPlace", { type: this.props.type, search: e.target.value }, {
                success: function success(data) {
                    target.setState({ optionsForTypeahead: _.map(data, function (row) {
                            var dataToPush = {
                                value: row.id,
                                text: row.name
                            };

                            if (typeof row.icon !== "undefined") {
                                dataToPush.icon = row.icon;
                            }

                            return dataToPush;
                        }) });
                },
                error: function error(err) {
                    new ModalErrorParse(err);
                }
            });
        },
        typeChanged: function typeChanged(e) {
            this.props.itemTypeChanged(e.target.value);
        },
        render: function render() {
            var content = "";
            switch (this.props.type) {
                case "project":
                    content = React.createElement(SectionItemProject, { id: this.props.id, key: this.props.id + this.state.index });
                    break;
            }

            return React.createElement(
                "div",
                { className: "col-md-3 col-sm-4 col-xs-12" },
                content,
                React.createElement(
                    "div",
                    { className: "col-xs-12", style: { height: "100px", marginBottom: "10px" } },
                    React.createElement(
                        "div",
                        { className: "row-fluid" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement(
                                "b",
                                null,
                                "Type"
                            ),
                            React.createElement(
                                "select",
                                { className: "form-control", onChange: this.typeChanged, defaultValue: this.props.type },
                                React.createElement(
                                    "option",
                                    { value: "project" },
                                    "Project"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "collection" },
                                    "Collection"
                                )
                            ),
                            React.createElement(Typeahead, { options: this.state.optionsForTypeahead, onChange: this.typeaheadSearchChanged, onSelected: this.itemSearchSelected, typeContent: "text", className: "form-control", placeholder: "Search item...", openedOnfocus: false })
                        )
                    )
                )
            );
        }
    });

    // Section item of project
    // - (string)id: The id of the item
    var SectionItemProject = React.createClass({
        displayName: "SectionItemProject",
        getInitialState: function getInitialState() {
            return {
                loading: false,
                name: "Loading...",
                backgroundColor: "",
                textColor: "",
                logoUrl: ""
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;

            if (target.props.id.length) {
                target.loadData();
            }
        },
        componentWillReceiveProps: function componentWillReceiveProps(data1, data2) {
            var target = this;

            if (data1.id.length) {
                target.loadData(data1.id);
            }
        },
        loadData: function loadData(id) {
            var target = this;
            target.setState({ loading: true });

            if (id) {
                Synchronise.Cloud.run("getProject", { id_project: id, cacheFirst: true }, {
                    success: function success(data) {
                        if (target.isMounted()) {
                            target.setState({
                                name: data.name,
                                backgroundColor: data.bg_color,
                                textColor: data.txt_color,
                                logoUrl: data.icon
                            });
                        }
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    },
                    always: function always() {
                        if (target.isMounted()) {
                            target.setState({ loading: false });
                        }
                    }
                });
            }
        },
        render: function render() {
            var contentItem = React.createElement("div", null);
            if (this.props.id.length) {
                contentItem = React.createElement(
                    "div",
                    { className: "row-fluid", style: { cursor: "pointer" } },
                    React.createElement(
                        "div",
                        { className: "card", style: { background: this.state.backgroundColor } },
                        React.createElement(
                            "div",
                            { style: { height: "50%", width: "100%", textAlign: "center" } },
                            React.createElement("img", { src: this.state.logoUrl, style: { width: "50px", borderRadius: "5px", background: this.state.backgroundColor, borderRadius: "5px", color: this.state.textColor } })
                        ),
                        React.createElement(
                            "div",
                            { style: { height: "50%", width: "100%", textAlign: "center" } },
                            React.createElement(
                                "h3",
                                { style: { color: this.state.textColor } },
                                this.state.name
                            )
                        )
                    )
                );
            }

            return contentItem;
        }
    });

    // Display the Marketplace settings
    var MarketPlace = React.createClass({
        displayName: "MarketPlace",
        render: function render() {
            return React.createElement(
                "div",
                { className: "row-fluid" },
                React.createElement(Sections, null)
            );
        }
    });

    var isAllowedThisSection;
    _.each(Synchronise.User.current().roles, function (row) {
        if (row.name == "superadmin" || row.name == "admin" || row.name == "marketplace") {
            isAllowedThisSection = true;
        }
    });

    if (isAllowedThisSection) {
        ReactDOM.render(React.createElement(MarketPlace, null), document.getElementById("marketplace"));
    }
});