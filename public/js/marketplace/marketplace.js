"use strict";

dependenciesLoader(["React", "ReactDOM", "$", "_", "Loader"], function () {
    function headerSlideshow() {
        var blocks = $("#headerSlideshow .blocks .block");
        $("#headerSlideshow .blocks").css({
            minWidth: $(window).width(),
            maxWidth: $(window).width(),
            width: $(window).width()
        });

        var window_focus = true;
        $(window).focus(function () {
            window_focus = true;
        }).blur(function () {
            window_focus = false;
        });

        window.setInterval(function () {
            if (window_focus) {
                var firstItem = $("#headerSlideshow .blocks .block").first().clone();

                $("#headerSlideshow .blocks").append(firstItem);

                var marginLeft = parseInt($("#headerSlideshow .blocks .block").first().css('width')) * -1 * 1.5 - 4.5;
                $("#headerSlideshow .blocks .block").first().animate({
                    marginLeft: marginLeft + "px",
                    opacity: "0.5"
                }, 300, 'easeInOutBack');

                window.setTimeout(function () {
                    $("#headerSlideshow .blocks .block").first().remove();
                }, 600);
            }
        }, 2000);
    }

    headerSlideshow();

    $(window).resize(function () {
        $("#headerSlideshow .blocks").css({
            minWidth: $(window).width(),
            maxWidth: $(window).width(),
            width: $(window).width()
        });
    });

    // Displays the carousel
    var HeaderCarousel = React.createClass({
        displayName: "HeaderCarousel",
        getInitialState: function getInitialState() {
            return {
                loading: false,
                blocks: []
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("marketPlaceHeaderCarousel", { cacheFirst: true }, {
                success: function success(data) {
                    target.setState({
                        blocks: data.blocks
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
        render: function render() {
            return React.createElement(
                "div",
                { id: "headerSlideshow" },
                React.createElement(
                    "div",
                    { className: "arrowLeft arrows" },
                    React.createElement("i", { className: "fa fa-arrow-circle-left" })
                ),
                React.createElement(
                    "div",
                    { className: "arrowRight arrows" },
                    React.createElement("i", { className: "fa fa-arrow-circle-right" })
                ),
                React.createElement(
                    "div",
                    { className: "blocks" },
                    this.state.blocks.map(function (row, index) {
                        return React.createElement(HeaderSlideshowBlock, { id: row.id, type: row.type, key: "HeaderSlideshowBlock" + row.id + index });
                    })
                )
            );
        }
    });

    // Display one item of the carousel of the Header
    // Props:
    // - (string)id: the id of the item to display
    // - (string)type: the type of the item to display (project, collection...)
    var HeaderSlideshowBlock = React.createClass({
        displayName: "HeaderSlideshowBlock",
        render: function render() {
            var item = "";
            switch (this.props.type) {
                case "project":
                    item = React.createElement(HeaderSlideshowBlockProject, { id: this.props.id });
                    break;
            }

            return React.createElement(
                "div",
                { className: "block" },
                item
            );
        }
    });

    // Displays an item of the carousel of type project
    // - (string)id: the id of the project
    var HeaderSlideshowBlockProject = React.createClass({
        displayName: "HeaderSlideshowBlockProject",

        getInitialState: function getInitialState() {
            return {
                loading: false,
                backgroundColor: "",
                logoUrl: "",
                colorText: "",
                nameProject: "",
                failed: false
            };
        },
        componentDidMount: function componentDidMount() {
            var target = this;
            target.setState({ loading: true });

            Synchronise.Cloud.run("getProject", { id_project: this.props.id, cacheFirst: true }, {
                success: function success(data) {
                    if (data) {
                        target.setState({
                            backgroundColor: data.bg_color,
                            logoUrl: data.icon,
                            colorText: data.txt_color,
                            nameProject: data.name
                        });
                    } else {
                        target.setState({
                            failed: true
                        });
                    }
                },
                error: function error(err) {
                    new ModalErrorParse(err);
                },
                always: function always() {
                    target.setState({ loading: false });
                }
            });
        },
        render: function render() {
            var content = "";
            if (this.state.loading) {
                content = React.createElement(
                    "div",
                    null,
                    React.createElement(Loader, null)
                );
            } else if (!this.state.failed) {
                content = React.createElement(
                    "a",
                    { href: "/marketplace/project/" + this.props.id, alt: this.state.nameProject + " project page" },
                    React.createElement(
                        "div",
                        { className: "card", style: { background: this.state.backgroundColor } },
                        React.createElement(
                            "div",
                            { className: "logoProject" },
                            React.createElement("img", { src: this.state.logoUrl })
                        ),
                        React.createElement(
                            "div",
                            { className: "nameProject" },
                            React.createElement(
                                "h3",
                                { style: { color: this.state.colorText } },
                                this.state.nameProject
                            )
                        )
                    )
                );
            }
            return content;
        }
    });

    // Displays the MarketPlace
    var Marketplace = React.createClass({
        displayName: "Marketplace",
        getInitialState: function getInitialState() {
            return {};
        },
        componentDidMount: function componentDidMount() {
            Synchronise.LocalStorage.set("visitedMarketplace", true);
        },
        render: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(HeaderCarousel, null)
            );
        }
    });

    ReactDOM.render(React.createElement(Marketplace, null), document.getElementById('Marketplace'));
});