"use strict";

var TutorialModal;
dependenciesLoader(["React", "ReactDOM", "$", function () {
    // Displays a guide to new users
    // Props:
    // - (array)steps: The steps of the tutorial
    // - (function)onNextStep: The callback to trigger when the tutorial goes to the next step
    // - (function)onPreviousStep: The callback to trigger when the tutorial goes to the previous step
    TutorialModal = React.createClass({
        displayName: "TutorialModal",

        getInitialState: function getInitialState() {
            return {
                currentStep: 1,
                shouldDisplay: false
            };
        },
        startTutorial: function startTutorial() {
            var target = this;
            KeyEventController.subscribeComponent("tutorialModal", function (key) {
                if (key == 27) {
                    target.hide();
                }
            });
            target.resizeInterface();
        },
        resizeInterface: function resizeInterface() {
            var target = this;
            window.setTimeout(function () {
                $(ReactDOM.findDOMNode(target)).find("#tutorialBlock").animate({
                    'top': $(window).height() / 2 - $(ReactDOM.findDOMNode(target)).find("#tutorialBlock").height() / 2
                }, 300, "easeOutBack");
            }, 10);
        },
        nextStep: function nextStep() {
            var target = this;
            target.setState({ currentStep: this.state.currentStep + 1 });
            target.props.onNextStep(this.state.currentStep + 1);
            target.resizeInterface();
        },
        previousStep: function previousStep() {
            var target = this;
            target.setState({ currentStep: this.state.currentStep - 1 });
            target.props.onPreviousStep(this.state.currentStep - 1);
        },
        hide: function hide() {
            var target = this;
            KeyEventController.unsubscribeComponent("tutorialFirsTime");
            $(ReactDOM.findDOMNode(this)).find("#tutorialBlock").animate({
                top: "100%"
            }, 500, "easeInBack", function () {
                $(ReactDOM.findDOMNode(target)).animate({
                    opacity: 0
                }, function () {
                    target.setState({ shouldDisplay: false });
                });
            });
        },
        render: function render() {
            var content = this.props.steps[this.state.currentStep];

            var display = "none";
            if (this.state.shouldDisplay) {
                display = "block";
            }

            return React.createElement(
                "div",
                { style: { display: display } },
                React.createElement("div", { id: "shadow", style: { position: "fixed", "left": 0, "top": 0, background: "rgba(0,0,0,0.5)", width: "100%", height: "100%", zIndex: 1001 } }),
                React.createElement(
                    "div",
                    { id: "tutorialBlock", style: { position: "fixed", width: "80%", maxHeight: "80%", overflowY: "auto", zIndex: 1002, top: "10%", left: "10%", background: "white", borderRadius: "5px", boxShadow: "0 1px 1px rgba(0,0,0,.15) !important", padding: "10px" } },
                    content
                )
            );
        }
    });
}]);