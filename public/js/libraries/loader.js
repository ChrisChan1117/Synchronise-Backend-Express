"use strict";

var Loader;
var InfiniteLoader;

dependenciesLoader(["React", "ReactDOM"], function () {
    Loader = React.createClass({
        displayName: "Loader",

        componentDidMount: function componentDidMount() {
            /*var svg = $('#loading').clone();
                svg.removeClass('hidden');
             var container = $(ReactDOM.findDOMNode(this));
                container.append(svg); // Insert the SVG into the loader*/
        },
        render: function render() {
            return React.createElement("div", { className: "spinner", style: { textAlign: "center" } });
        }
    });

    InfiniteLoader = React.createClass({
        displayName: "InfiniteLoader",

        componentDidMount: function componentDidMount() {
            $(ReactDOM.findDOMNode(this)).animate({
                opacity: 1
            }, 300);
        },
        render: function render() {
            return React.createElement(
                "div",
                { className: "infiniteLoading" },
                React.createElement("div", { className: "bullet" }),
                React.createElement("div", { className: "bullet" }),
                React.createElement("div", { className: "bullet" }),
                React.createElement("div", { className: "bullet" })
            );
        }
    });
});