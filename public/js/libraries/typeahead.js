var Typeahead;

dependenciesLoader(["React", "ReactDOM"], function () {
    // Displays a Typeahead
    // Props :
    // - [Array]options         : List of elements that can be selected in the typeahead
    //      Example : Array({
    //                  value : "value",
    //                  text  : "The text to display",
    //                  (optional)icon : "url_of_an_icon"
    //                })
    // - [function]onSelected   : Callback when an element is selected
    // - [string]typeContent    : The type of content that will be search for (text, email, password ...)
    // - [string]className      : The class to associate with the typeahead. This is usefull for styling it
    // - [string]placeholder    : The placeholder to put when the typeahead input field is empty
    // - [boolean]openedOnfocus : If true the typeahead will display all possible results when focused
    // - [callback]onChange     : The callback to trigger when we type something in the field
    Typeahead = React.createClass({
        displayName: "Typeahead",
        getInitialState: function () {
            return {
                inputHasFocus: false,
                itemListHasFocus: false,
                shouldDisplayTA: 'none',
                matchingItems: [],
                inputValue: "",
                typeaheadPosition: 0,
                currentItem: {}
            };
        },
        componentDidMount: function () {
            // Verify that the css file is loaded (we have forgotten it many times in the past)
            var cssLoaded = false;
            $('link').each(function () {
                if ($(this).attr('href').indexOf('typeahead') != -1) {
                    cssLoaded = true;
                }
            });

            if (!cssLoaded) {
                var link = document.createElement("link");
                link.href = "/css/made-by-synchronise/libraries/typeahead.css";
                link.type = "text/css";
                link.rel = "stylesheet";
                document.getElementsByTagName("head")[0].appendChild(link);
            }
        },
        onChange: function (fieldName, e) {
            if (typeof this.props.onChange != "undefined") {
                this.props.onChange(e);
            }
            this.checkMatchingElements(e.target.value);
        },
        checkMatchingElements: function (val, inputHasFocus) {
            var target = this;
            var value = val.toLowerCase();
            var matchingItems = [];

            if (value.length && (this.state.inputHasFocus || inputHasFocus)) {
                _.each(this.props.options, function (item) {
                    if (typeof item != "string") {
                        var anyMatching = false;
                        _.each(Object.keys(item), function (key) {
                            if (typeof item[key] == "string") {
                                if (item[key].toLowerCase().indexOf(value.toLowerCase()) != -1) {
                                    anyMatching = true;
                                }
                            }
                        });

                        if (anyMatching) {
                            var composedString = "";
                            if ('text' in item) {
                                composedString += item.text;
                            } else {
                                _.each(Object.keys(item), function (key, i) {
                                    composedString += key + " : " + item[key];
                                    if (i != Object.keys(item).length - 1) {
                                        composedString += ", ";
                                    }
                                });
                            }
                            matchingItems.push({
                                item: item,
                                string: composedString,
                                icon: item.icon
                            });
                        }
                    } else {
                        if (item.indexOf(value.toLowerCase()) != -1) {
                            matchingItems.push({
                                item: item,
                                string: item,
                                icon: item.icon
                            });
                        }
                    }
                });
            } else {
                if (this.props.openedOnfocus && (this.state.inputHasFocus || inputHasFocus)) {
                    _.each(this.props.options, function (item) {
                        if (typeof item != "string") {
                            var composedString = "";
                            if ('text' in item) {
                                composedString += item.text;
                            } else {
                                _.each(Object.keys(item), function (key, i) {
                                    composedString += key + " : " + item[key];
                                    if (i != Object.keys(item).length - 1) {
                                        composedString += ", ";
                                    }
                                });
                            }
                            matchingItems.push({
                                item: item,
                                string: composedString,
                                icon: item.icon
                            });
                        } else {
                            if (item.indexOf(value.toLowerCase()) != -1) {
                                matchingItems.push({
                                    item: item,
                                    string: item,
                                    icon: item.icon
                                });
                            }
                        }
                    });

                    if (target.isMounted()) {
                        target.setState({ currentItem: matchingItems[0], itemListHasFocus: true });
                    }
                }
            }

            if (target.isMounted()) {
                this.setState({
                    matchingItems: matchingItems,
                    inputValue: val
                });

                if (matchingItems.length) {
                    this.setState({
                        shouldDisplayTA: 'block'
                    });
                } else {
                    this.setState({
                        shouldDisplayTA: 'none'
                    });
                }
            }
        },
        inputFocusIn: function () {
            var target = this;
            if (target.isMounted()) {
                this.setState({
                    inputHasFocus: true,
                    itemListHasFocus: false
                });

                $(ReactDOM.findDOMNode(this.refs.typeaheadInput)).addClass('slideInTypeahead');
                KeyEventController.subscribeComponent("typeahead", function (key) {
                    target.onkeyup(key);
                });

                this.checkMatchingElements(this.state.inputValue, true);
            }
        },
        inputFocusOut: function () {
            var target = this;
            setTimeout(function () {
                if (target.isMounted()) {
                    target.setState({
                        inputHasFocus: false,
                        shouldDisplayTA: 'none'
                    });
                    $(ReactDOM.findDOMNode(target.refs.typeaheadInput)).removeClass('slideOutTypeahead slideInTypeahead');
                }
            }, 300);
            $(ReactDOM.findDOMNode(target.refs.typeaheadInput)).addClass('slideOutTypeahead');
            KeyEventController.unsubscribeComponent("typeahead");
        },
        resetInput: function () {
            var target = this;
            if (target.isMounted()) {
                this.setState({
                    inputValue: ""
                });
            }
        },
        onkeyup: function (key) {
            var target = this;

            if (target.isMounted()) {
                switch (key) {
                    case 27:
                        // esc
                        break;

                    case 13:
                        // Enter

                        // there is no matching item (new value)
                        if (this.state.matchingItems.length === 0) {
                            var value = $(ReactDOM.findDOMNode(this.refs.typeahead))[0].value;
                            this.props.onSelected(value);
                            this.setState({ typeaheadPosition: 0 });
                            this.inputFocusOut();
                            this.resetInput();
                        }

                        if (this.state.typeaheadPosition >= 0 && this.state.typeaheadPosition < this.state.matchingItems.length) {
                            // value isn't changed, so call the function to submit
                            if (this.state.currentItem.string == this.state.matchingItems[this.state.typeaheadPosition].string) {
                                this.props.onSelected(this.state.currentItem);
                                this.setState({ typeaheadPosition: 0 });
                                this.inputFocusOut();
                                this.resetInput();
                                this.inputFocusIn();
                            } else {
                                if (this.isMounted()) {
                                    this.setState({
                                        currentItem: this.state.matchingItems[this.state.typeaheadPosition],
                                        inputValue: this.state.matchingItems[this.state.typeaheadPosition].string
                                    });
                                }
                            }
                        }
                        break;

                    case 38:
                        // Up arrow
                        if (this.state.typeaheadPosition > 0) {
                            this.setState({
                                typeaheadPosition: this.state.typeaheadPosition - 1
                            });
                        } else {
                            this.setState({
                                typeaheadPosition: this.state.matchingItems.length - 1
                            });
                        }
                        break;

                    case 40:
                        // Down arrow
                        if (this.state.typeaheadPosition < this.state.matchingItems.length - 1) {
                            this.setState({
                                typeaheadPosition: this.state.typeaheadPosition + 1
                            });
                        } else {
                            this.setState({
                                typeaheadPosition: 0
                            });
                        }
                        break;

                    default:
                        this.setState({
                            currentItem: this.state.inputValue,
                            typeaheadPosition: 0
                        });
                        break;
                }
            }
        },
        itemSelected: function (item) {
            var target = this;
            if (target.isMounted()) {
                this.setState({
                    inputValue: item.string,
                    currentItem: item.item,
                    typeaheadPosition: 0
                });
            }
            this.props.onSelected(item);
            this.resetInput();
        },
        componentWillReceiveProps: function () {
            this.checkMatchingElements(this.state.inputValue);
        },
        render: function () {
            var target = this;

            var styleTypeahead = { position: 'absolute',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px double white',
                paddingLeft: '0px',
                listStyle: 'none',
                zIndex: 2,
                display: this.state.shouldDisplayTA };

            var typeahead = React.createElement(
                "ul",
                { style: styleTypeahead, ref: "typeaheadInput", className: "typeaheadContainer" },
                this.state.matchingItems.map(function (item, index) {
                    var className = 'typeahead-item';
                    if (index == target.state.typeaheadPosition) {
                        className += ' typeahead-selected';
                    }
                    var img = "";
                    if (typeof item.icon != "undefined") {
                        img = React.createElement("img", { src: item.icon, style: { width: "25px", marginRight: "5px" } });
                    }
                    return React.createElement(
                        "li",
                        { style: { textAlign: "left" }, onClick: target.itemSelected.bind(target, item), className: className, item: item.item, key: index },
                        img,
                        item.string
                    );
                })
            );

            var colorForText = "black";
            if (this.props.txt_color) {
                colorForText = this.props.txt_color;
            }

            return React.createElement(
                "div",
                null,
                React.createElement("input", { type: this.props.typeContent,
                    className: this.props.className + " typeahead",
                    placeholder: this.props.placeholder,
                    onChange: this.onChange.bind(this, "input"),
                    onFocus: this.inputFocusIn,
                    onBlur: this.inputFocusOut,
                    onKeyUp: this.onkeyup,
                    value: this.state.inputValue,
                    style: { color: colorForText },
                    ref: "typeahead" }),
                typeahead
            );
        }
    });
});