var displayGetFreeRequestsModal;
(function () {
    dependenciesLoader(["React", "ReactDOM", "Synchronise", "$", "urlH", "md5"], function () {
        var referralLink = "https://www.synchronise.io/";
        if (Synchronise.User.current()) {
            referralLink += '?referral=' + Synchronise.User.current().id;
        }

        // Display the "Get Free Requests" modal
        function displayGetFreeRequests(callbackWhenLoaded) {
            referralLink = "https://www.synchronise.io/?referral=" + Synchronise.User.current().id;
            var modal = new Modal();
            modal.title("Free requests");
            var string = "<div class='col-lg-6'><legend>Invite your friends <img src='/images/emojiFriend.png' style='height: 20px;'/></legend><h4 style='text-align:center'>10,000 requests</h4>Get <b>10,000</b> requests everytime a friends signup. There is no limit on the amount of friend you can invite.<div style='text-align:center; margin-top: 10px'><a class='btn btn-block btn-social shareOnMessenger' style='background: white; box-shadow: none; border: 1px solid darkgray'><span class='fa'><img src='/images/messenger.png' style='width: 30px; height: 30px'/></span> Send via Messenger</a><a href='https://twitter.com/intent/tweet?text=Stop reinventing the wheel! Reusable cloud components are there.&url=" + referralLink + "&hashtags=cloud,app&via=synchroniseio' class='btn btn-block btn-social btn-twitter' style='border: 0px; box-shadow: none;'><span class='fa fa-twitter'></span> Post a Tweet</a><input type='text' class='form-control' value='" + referralLink + "'></div></div>";
            string += "<div class='col-lg-6'><legend>Add a payment method <img src='/images/emojiPaymentMethod.png' style='width: 25px'/></legend><h4 style='text-align:center'>20,000 requests</h4>Add a payment method and we'll give you an extra <b>20,000</b> requests and you <b>won't</b> be charged, ever, until you decide to switch to a payed plan. <br/><br/>Why? When you save a payment method you give us a strong sign that you believe in our platform and that means a lot to us. This is our way of saying thank you for your support. <div style='text-align:center; margin-top: 10px'><a class='btn btn-primary' href='/billing?tab=paymentMethods'>Add payment method</a></div></div>";

            modal.content(string);
            modal.show();
            callbackWhenLoaded();
        }

        displayGetFreeRequestsModal = displayGetFreeRequests;

        $(document).on('click', '.shareOnMessenger', function () {
            FB.ui({
                method: 'send',
                link: referralLink
            });
        });

        ///// TOP MENU /////
        // Displays a modal to login or signup the user
        var LoginSignupModal = React.createClass({
            displayName: "LoginSignupModal",
            getInitialState: function () {
                return {
                    email: "",
                    password: "",
                    name: "",
                    emailValid: false,
                    passwordValid: false,
                    nameValid: false,

                    isCheckingForm: false,
                    recoveringPassword: false,
                    errorMessage: "",
                    actionToDo: "",
                    isLoging: false,
                    isSigning: false
                };
            },
            onInputChange: function (fieldName, event) {
                var data = {};
                data[fieldName] = event.target.value;

                switch (fieldName) {
                    case "email":
                        {
                            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            data.emailValid = re.test(event.target.value);
                        }
                        break;

                    case "password":
                        data.passwordValid = event.target.value.length > 6;
                        break;

                    case "name":
                        data.nameValid = event.target.value.length > 0;
                        break;
                }

                this.setState(data);
            },
            onKeyPress: function (e) {
                var key = e.which || e.keyCode;

                var canSubmit = false;
                if (this.state.emailValid && this.state.password) {
                    canSubmit = true;
                }

                if (canSubmit && key == 13) {
                    this.submitForm(e);
                }
            },
            signup: function () {
                var target = this;
                if (this.state.actionToDo == "signup" && this.state.emailValid && this.state.passwordValid && this.state.nameValid && !this.state.isSigning) {
                    target.setState({ isSigning: true, actionToDo: "login" });

                    Synchronise.Cloud.run('signup', {
                        email: this.state.email,
                        password: this.state.password,
                        name: this.state.name
                    }, {
                        success: function (result) {
                            mixpanel.track("signedUpManual");
                            target.login();
                            fbq('track', 'CompleteRegistration');
                        },
                        error: function (error) {
                            target.setState({ errorMessage: error.message });
                        },
                        always: function () {
                            target.setState({ isSigning: false });
                        }
                    });
                }
            },
            login: function () {
                var target = this;

                if (!target.state.isLoging && this.state.actionToDo == "login" && this.state.emailValid && this.state.passwordValid) {

                    this.setState({ isLoging: true });

                    Synchronise.User.logIn(target.state.email, target.state.password, {
                        success: function (data) {
                            mixpanel.track("loggedInManual");
                            // Animate the connection
                            $('html, body').animate({
                                opacity: 0
                            }, 300);

                            $('html, body').addClass('scaleOut');

                            if (urlH.getParam('backuri')) {
                                window.location.href = decodeURIComponent('/' + urlH.getParam('backuri'));
                            } else {
                                window.location.href = '/dashboard';
                            }
                        },
                        error: function (error) {
                            target.props.modal.shake();
                            target.setState({ isLoging: false });
                        }
                    });
                }
            },
            submitForm: function (event) {
                var target = this;

                event.preventDefault();

                if (!this.state.isCheckingForm && this.state.emailValid) {
                    this.setState({ isCheckingForm: true, errorMessage: "" });

                    Synchronise.Cloud.run('shouldLoginOrSignup', { email: this.state.email }, {
                        success: function (result) {
                            target.setState({ actionToDo: result.status });

                            if (result.status == 'login') {
                                target.login();
                            } else if (result.status == 'signup') {
                                if (target.state.nameValid) {
                                    target.signup();
                                }
                            } else {
                                target.setState({ errorMessage: "An error occured. Please try again!" });
                            }
                        },
                        error: function (error) {
                            target.setState({ errorMessage: error.error });
                        },
                        always: function () {
                            target.setState({ isCheckingForm: false });
                        }
                    });
                }
            },
            forgottenPassword: function () {
                var target = this;

                if (!target.state.recoveringPassword) {
                    if (!target.state.emailValid) {
                        $(ReactDOM.findDOMNode(target)).find('#loginSignupEmail').focus();
                        $(ReactDOM.findDOMNode(target)).find('#loginSignupEmail').effect("shake");
                    } else {
                        target.setState({ recoveringPassword: true });
                        Synchronise.Cloud.run("recoverPassword", { email: target.state.email }, {
                            success: function () {
                                target.setState({ successMessage: "An email with further instructions has been sent to you" });
                            },
                            error: function (err) {
                                target.setState({ errorMessage: err });
                            },
                            always: function () {
                                target.setState({ recoveringPassword: false });
                            }
                        });
                    }
                }
            },
            render: function () {
                var target = this;

                var classButton = "fa-plane";
                if (this.state.isCheckingForm || this.state.isLoging) {
                    classButton = "fa-cog fa-spin";
                }

                var errorBanner = "";
                if (this.state.errorMessage) {
                    errorBanner = React.createElement(
                        "div",
                        { className: "alert alert-danger", role: "alert" },
                        this.state.errorMessage
                    );
                }

                var successBanner = "";
                if (this.state.successMessage) {
                    successBanner = React.createElement(
                        "div",
                        { className: "alert alert-success", role: "alert" },
                        this.state.successMessage
                    );
                }

                var classForEmail = "";
                if (this.state.email.length && !this.state.emailValid) {
                    classForEmail = "has-error";
                } else if (this.state.email.length && this.state.emailValid) {
                    classForEmail = "has-success";
                }

                var classForPassword = "";
                if (this.state.password.length && !this.state.passwordValid) {
                    classForPassword = "has-error";
                } else if (this.state.password.length && this.state.passwordValid) {
                    classForPassword = "has-success";
                }

                var classForName = "";
                if (this.state.name.length && !this.state.nameValid) {
                    classForName = "has-error";
                } else if (this.state.name.length && this.state.nameValid) {
                    classForName = "has-success";
                }

                var contentName = "";
                if (this.state.actionToDo == "signup") {
                    contentName = React.createElement(
                        "div",
                        { className: "form-group " + classForName },
                        React.createElement(
                            "label",
                            { htmlFor: "loginSignupName" },
                            "Name"
                        ),
                        React.createElement("input", { id: "loginSignupName",
                            type: "text",
                            className: "form-control",
                            placeholder: "We would love to know your name",
                            tabIndex: "3",
                            value: this.state.name,
                            onKeyPress: target.onKeyPress,
                            onChange: this.onInputChange.bind(null, "name") })
                    );
                }

                var labelForRecoverPassword = "Forgot password?";
                if (this.state.recoveringPassword) {
                    labelForRecoverPassword = "Recovering...";
                }

                return React.createElement(
                    "div",
                    { className: "row-fluid" },
                    errorBanner,
                    successBanner,
                    React.createElement(
                        "form",
                        { role: "form", action: "#" },
                        React.createElement(
                            "div",
                            { className: "form-group " + classForEmail },
                            React.createElement(
                                "label",
                                { htmlFor: "loginSignupEmail" },
                                "Email"
                            ),
                            React.createElement("input", { id: "loginSignupEmail",
                                type: "email",
                                className: "form-control",
                                placeholder: "Email address",
                                tabIndex: "1",
                                value: target.state.email,
                                onKeyPress: target.onKeyPress,
                                onChange: target.onInputChange.bind(null, "email") })
                        ),
                        React.createElement(
                            "div",
                            { className: "form-group " + classForPassword },
                            React.createElement(
                                "label",
                                { htmlFor: "loginSignupPassword" },
                                "Password"
                            ),
                            React.createElement("input", { id: "loginSignupPassword",
                                type: "password",
                                className: "form-control",
                                placeholder: "Password",
                                tabIndex: "2",
                                value: target.state.password,
                                onKeyPress: target.onKeyPress,
                                onChange: target.onInputChange.bind(null, "password") }),
                            React.createElement(
                                "span",
                                { className: "help-block" },
                                React.createElement(
                                    "span",
                                    null,
                                    "6 characters min"
                                ),
                                React.createElement("a", { href: "#", className: "pull-right", id: "recoverPassword" })
                            )
                        ),
                        React.createElement(
                            "div",
                            { style: { textAlign: "right", display: "none" } },
                            React.createElement(
                                "a",
                                { onClick: this.forgottenPassword },
                                labelForRecoverPassword
                            )
                        ),
                        contentName,
                        React.createElement(
                            "div",
                            { style: { textAlign: "center" } },
                            React.createElement(
                                "a",
                                { className: "btn btn-default btn-social",
                                    type: "submit",
                                    tabIndex: "4",
                                    onClick: target.submitForm },
                                "Login/Signup"
                            )
                        )
                    )
                );
                /*
                <hr/>
                <div className="row-fluid">
                    <div className="col-xs-12 col-sm-6" style={{marginBottom: "5px"}}>
                        <a className="btn btn-block btn-social btn-github" href="/auth/github" style={{textAlign: "center"}}>
                            Github signin
                        </a>
                        <a className="btn btn-block btn-social btn-bitbucket" href="/auth/bitbucket" style={{textAlign: "center"}}>
                            Bitbucket signin
                        </a>
                    </div>
                     <div className="ol-xs-12 col-sm-6">
                        <a className="btn btn-block btn-social btn-facebook" href="/auth/facebook" style={{textAlign: "center"}}>
                            Facebook signin
                        </a>
                         <a className="btn btn-block btn-social btn-google" href="/auth/google" style={{background: "#DD4B3A", color: "white", textAlign: "center"}}>
                            Google signin
                        </a>
                    </div>
                </div>*/
            }
        });

        // Displays the buttons on the right of the topbar
        var NavBarRight = React.createClass({
            displayName: "NavBarRight",
            getInitialState: function () {
                return {
                    loaded: false
                };
            },
            componentDidMount: function () {
                var target = this;
                Synchronise.User.fetchCurrent(function (user) {
                    target.setState({ loaded: true });
                });
            },
            render: function () {
                var content = "";

                if (this.state.loaded) {
                    if (Synchronise.User.current()) {
                        content = React.createElement(NavBarRightConnected, null);
                    } else {
                        content = React.createElement(NavBarRightOffline, null);
                    }
                }

                return React.createElement(
                    "div",
                    null,
                    content
                );
            }
        });

        // Displays the login/signup button
        var NavBarRightOffline = React.createClass({
            displayName: "NavBarRightOffline",
            getInitialState: function () {
                return {
                    modalDisplayed: false,
                    modal: ""
                };
            },
            toggleModal: function (event) {
                if (event) {
                    event.preventDefault();
                }

                if (this.state.modalDisplayed) {
                    this.state.modal.hide();
                } else {
                    this.state.modal.show();
                    mixpanel.track("loginModalShown");
                }

                this.setState({ modalDisplayed: !this.state.modalDisplayed });
            },
            modalClosed: function () {
                this.setState({ modalDisplayed: false });
            },
            componentDidMount: function () {
                var target = this;

                Mousetrap.bind('mod+l', function (e) {
                    if (typeof user == "undefined") {
                        e.preventDefault();
                        target.toggleModal(e);
                    }
                });

                var modal = new Modal('globalModal');
                modal.title('One click away from amazingness');
                modal.footer('', false); // No special content but displays the close button
                modal.didDisappear(function () {
                    target.modalClosed();
                });

                this.setState({ modal: modal });

                // The user has tried to access a restricted area and was not logged-in
                // We display the login modal immediatly
                if (typeof urlH.getParam('display') != "undefined") {
                    if (urlH.getParam('display') == "login") {
                        modal.show();
                        this.setState({ modalDisplayed: true });
                    }
                }

                modal.didAppear(function () {
                    $("#globalModal").find("input")[0].focus();
                });

                ReactDOM.render(React.createElement(LoginSignupModal, { modal: modal, modalDidClose: this.modalClosed }), document.getElementById('globalModal').getElementsByClassName('modal-body')[0]);

                $('.loginSignupButton').click(function () {
                    target.toggleModal();
                });
            },
            isMacintosh: function () {
                return navigator.platform.indexOf('Mac') > -1;
            },
            isWindows: function () {
                return navigator.platform.indexOf('Win') > -1;
            },
            render: function () {
                var shortcut = "";

                if (this.isMacintosh()) {
                    shortcut = React.createElement(
                        "span",
                        null,
                        "(Cmd+l)"
                    );
                }

                if (this.isWindows()) {
                    shortcut = React.createElement(
                        "span",
                        null,
                        "(Ctrl+l)"
                    );
                }

                var content = "";
                if (document.location.pathname != "/" && document.location.pathname != "") {
                    /*
                    <li className="hidden-xs" style={{marginRight: "5px", marginTop: "15px", paddingBottom: "0px"}}>
                        <a className="btn btn-social-icon btn-github" href="/auth/github" style={{paddingBottom: "0px"}}>
                            <span className="fa fa-github"></span>
                        </a>
                    </li>
                     <li className="hidden-xs" style={{marginRight: "5px", marginTop: "15px", paddingBottom: "0px"}}>
                        <a className="btn btn-social-icon btn-bitbucket" href="/auth/bitbucket" style={{paddingBottom: "0px"}}>
                            <span className="fa fa-bitbucket"></span>
                        </a>
                    </li>
                     <li className="hidden-xs" style={{marginRight: "5px", marginTop: "15px", paddingBottom: "0px"}}>
                        <a className="btn btn-social-icon btn-google" href="/auth/google" style={{background: "#DD4B3A", color: "white", paddingBottom: "0px"}}>
                            <span className="fa fa-google"></span>
                        </a>
                    </li>
                     <li className="hidden-xs" style={{marginRight: "15px", marginTop: "15px", paddingBottom: "0px"}}>
                        <a className="btn btn-social-icon btn-facebook" href="/auth/facebook" style={{paddingBottom: "0px"}}>
                            <span className="fa fa-facebook"></span>
                        </a>
                    </li>
                    */
                    content = React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "ul",
                            { className: "nav navbar-nav navbar-right" },
                            React.createElement(
                                "li",
                                { className: "hidden-xs", style: { borderLeft: "1px solid white" } },
                                React.createElement(
                                    "a",
                                    { href: "#",
                                        onClick: this.toggleModal },
                                    React.createElement(
                                        "u",
                                        null,
                                        "L"
                                    ),
                                    "ogin/Signup ",
                                    shortcut
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: "visible-xs" },
                                React.createElement(
                                    "a",
                                    { href: "#",
                                        onClick: this.toggleModal },
                                    React.createElement(
                                        "u",
                                        null,
                                        "L"
                                    ),
                                    "ogin/Signup ",
                                    shortcut
                                )
                            )
                        )
                    );
                } else {
                    content = React.createElement(
                        "ul",
                        { className: "nav navbar-nav navbar-right" },
                        React.createElement(
                            "li",
                            { className: "active" },
                            React.createElement(
                                "a",
                                { href: "#home" },
                                "Home"
                            )
                        ),
                        React.createElement(
                            "li",
                            null,
                            React.createElement(
                                "a",
                                { href: "#product" },
                                "Product"
                            )
                        ),
                        React.createElement(
                            "li",
                            null,
                            React.createElement(
                                "a",
                                { href: "#pricing" },
                                "Pricing"
                            )
                        ),
                        React.createElement(
                            "li",
                            null,
                            React.createElement(
                                "a",
                                { href: "/marketplace" },
                                "Market Place"
                            )
                        ),
                        React.createElement(
                            "li",
                            null,
                            React.createElement(
                                "a",
                                { href: "/docs" },
                                "Docs"
                            )
                        ),
                        React.createElement(
                            "li",
                            null,
                            React.createElement(
                                "a",
                                { href: "/help" },
                                "Help"
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: "hidden-xs" },
                            React.createElement(
                                "a",
                                { href: "#",
                                    onClick: this.toggleModal },
                                React.createElement(
                                    "u",
                                    null,
                                    "L"
                                ),
                                "ogin/Signup"
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: "visible-xs" },
                            React.createElement(
                                "a",
                                { href: "#",
                                    onClick: this.toggleModal },
                                React.createElement(
                                    "u",
                                    null,
                                    "L"
                                ),
                                "ogin/Signup"
                            )
                        )
                    );

                    /*
                    <a className="btn btn-social-icon btn-github" href="/auth/github" style={{paddingBottom: "0px", marginRight: "5px", color: "white"}}>
                        <span className="fa fa-github"></span>
                    </a>
                    <a className="btn btn-social-icon btn-bitbucket" href="/auth/bitbucket" style={{paddingBottom: "0px", marginRight: "5px", color: "white"}}>
                        <span className="fa fa-bitbucket"></span>
                    </a>
                    <a className="btn btn-social-icon btn-google" href="/auth/google" style={{background: "#DD4B3A", color: "white", paddingBottom: "0px", marginRight: "5px"}}>
                        <span className="fa fa-google"></span>
                    </a>
                    <a className="btn btn-social-icon btn-facebook" href="/auth/facebook" style={{paddingBottom: "0px", color: "white"}}>
                        <span className="fa fa-facebook"></span>
                    </a>
                     <a className="btn btn-social-icon btn-github" href="/auth/github" style={{paddingBottom: "0px", marginRight: "5px", color: "white"}}>
                        <span className="fa fa-github"></span>
                    </a>
                    <a className="btn btn-social-icon btn-bitbucket" href="/auth/bitbucket" style={{paddingBottom: "0px", marginRight: "5px", color: "white"}}>
                        <span className="fa fa-bitbucket"></span>
                    </a>
                    <a className="btn btn-social-icon btn-google" href="/auth/google" style={{background: "#DD4B3A", color: "white", paddingBottom: "0px", marginRight: "5px"}}>
                        <span className="fa fa-google"></span>
                    </a>
                    <a className="btn btn-social-icon btn-facebook" href="/auth/facebook" style={{paddingBottom: "0px", color: "white"}}>
                        <span className="fa fa-facebook"></span>
                    </a>
                    */
                }

                return content;
            }
        });

        // Displays the list of actions the user can do when connected
        var NavBarRightConnected = React.createClass({
            displayName: "NavBarRightConnected",
            getInitialState: function () {
                return {
                    unreadNotifications: {
                        "account": 0,
                        "settings": 0,
                        "billing": 0
                    },
                    shortcuts: []
                };
            },
            logout: function () {
                Synchronise.User.logOut();
                modalMessage.show('See you soon');
                window.location.href = "/logout";
            },
            componentDidMount: function () {
                var target = this;
                $('[data-toggle=tooltip]').tooltip();

                Synchronise.Cloud.run("unreadNotification", { realtime: true, cacheFirst: true }, {
                    success: function (data) {
                        var account = _.reduce(data, function (prev, row) {
                            if (row.type == "account") {
                                return prev + row.quantity;
                            } else {
                                return prev + 0;
                            }
                        }, 0);

                        var settings = _.reduce(data, function (prev, row) {
                            if (row.type == "settings") {
                                return prev + row.quantity;
                            } else {
                                return prev + 0;
                            }
                        }, 0);

                        var billing = _.reduce(data, function (prev, row) {
                            if (row.type == "billing") {
                                return prev + row.quantity;
                            } else {
                                return prev + 0;
                            }
                        }, 0);

                        target.setState({
                            unreadNotifications: {
                                "account": account,
                                "settings": settings,
                                "billing": billing
                            }
                        });
                    }
                });

                Synchronise.LocalStorage.get("shortcutsMenu", function (shortcuts) {
                    target.setState({ shortcuts: shortcuts });
                }, [], true);
            },
            addShortcut: function () {
                var target = this;
                var modal = new ModalAskInput("What name do you want to give to your shortcut?", function (name) {
                    if (name) {
                        var shortcuts = target.state.shortcuts;
                        var date = new Date();
                        shortcuts.push({
                            name: name,
                            link: urlH.currentUrl(),
                            id: date.getTime()
                        });

                        Synchronise.LocalStorage.set("shortcutsMenu", shortcuts);
                    }
                });
                modal.title("Add shortcut");
            },
            render: function () {
                var notificationsBilling = React.createElement("span", null);
                if (this.state.unreadNotifications.billing) {
                    notificationsBilling = React.createElement(
                        "span",
                        { className: "notification" },
                        this.state.unreadNotifications.billing
                    );
                }

                return React.createElement(
                    "ul",
                    { className: "nav navbar-nav navbar-right" },
                    React.createElement(
                        "li",
                        { id: "shortcuts hidden-xs" },
                        React.createElement(
                            "a",
                            { type: "button",
                                "data-toggle": "tooltip",
                                "data-placement": "bottom",
                                href: "#",
                                title: "Add a shortcut to this page",
                                onClick: this.addShortcut },
                            React.createElement("i", { className: "fa fa-star", style: { color: "#D9AF02" } })
                        )
                    ),
                    React.createElement(SubscriptionPlan, null),
                    React.createElement(FreeTierProgress, null),
                    React.createElement(
                        "li",
                        { className: "dropdown" },
                        React.createElement(MenuUserLabel, null),
                        React.createElement(
                            "ul",
                            { className: "dropdown-menu", role: "menu" },
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { href: "/billing?tab=bills" },
                                    "Invoices"
                                )
                            ),
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { href: "/billing?tab=planTab" },
                                    "Subscription"
                                )
                            ),
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { href: "/billing?tab=paymentMethods" },
                                    "Payment methods ",
                                    notificationsBilling
                                )
                            ),
                            React.createElement("li", { className: "divider" }),
                            React.createElement(
                                "li",
                                null,
                                React.createElement(
                                    "a",
                                    { onClick: this.logout, className: "logout" },
                                    "Logout"
                                )
                            )
                        )
                    )
                );

                /*
                <li>
                    <a type="button"
                       data-toggle="tooltip"
                       data-placement="bottom"
                       href="#"
                       title="To trigger a shortcut press ctrl (cmd on mac) + the letter of the shortcut. For example ctrl + u will send you to the Query page. All the letters underscored on the interface are shortcuts you can trigger."><i className="fa fa-question-circle"></i></a>
                </li>
                */
            }
        });

        // Displays the name of the user and other information depending on his/her permissions
        var MenuUserLabel = React.createClass({
            displayName: "MenuUserLabel",
            getInitialState: function () {
                var username = "";
                if (Synchronise.User.current()) {
                    if (Synchronise.User.current().isAdmin()) {
                        username = Synchronise.User.current().name + " (Admin)";
                    } else {
                        username = Synchronise.User.current().name;
                    }
                }

                return {
                    username: username,
                    notifications: []
                };
            },
            componentDidMount: function () {
                var target = this;
                Synchronise.Cloud.run("unreadNotification", { realtime: true, cacheFirst: true }, {
                    success: function (data) {
                        target.setState({
                            notifications: data
                        });
                    }
                });
            },
            render: function () {
                var notifications = React.createElement("span", null);

                if (this.state.notifications.length) {
                    notifications = React.createElement(
                        "span",
                        { className: "notification" },
                        this.state.notifications.length
                    );
                }

                var avatarUser = "";
                if (Synchronise.User.current().avatar) {
                    avatarUser = "";
                } else {
                    avatarUser = 'https://www.gravatar.com/avatar/' + md5(Synchronise.User.current().email);
                }

                var avatarImage = "";
                if (avatarUser !== "") {
                    avatarImage = React.createElement("img", { src: avatarUser, style: { width: "20px", borderRadius: "100%", border: "1.5px solid white", boxShadow: "0 1px 1px rgba(0, 0, 0, .15)" } });
                }

                return React.createElement(
                    "a",
                    { href: "#", className: "dropdown-toggle", "data-toggle": "dropdown" },
                    avatarImage,
                    " ",
                    this.state.username,
                    " ",
                    notifications,
                    " ",
                    React.createElement("span", { className: "caret" })
                );
            }
        });

        var SubscriptionPlan = React.createClass({
            displayName: "SubscriptionPlan",
            render: function () {
                var plan = React.createElement(
                    "div",
                    { style: { display: "inline-block" } },
                    React.createElement(
                        "a",
                        { href: "/billing?tab=planTab" },
                        React.createElement("img", { src: "/images/" + Synchronise.User.current().subscription + ".png", alt: "Plan", style: { height: "30px", width: "30px", marginTop: "0px" } })
                    )
                );

                var style = { lineHeight: "64px", paddingLeft: "10px", marginRight: "10px", borderLeft: "1px dotted rgba(255,255,255,0.5)" };

                if (Synchronise.User.current().subscription != "earth") {
                    style.borderRight = "1px dotted rgba(255,255,255,0.5)";
                    style.paddingRight = "10px";
                }

                return React.createElement(
                    "li",
                    { style: style, className: "hidden-xs" },
                    React.createElement(
                        "div",
                        { style: { display: "inline-block" } },
                        React.createElement(
                            "small",
                            { style: { color: "white" } },
                            "Plan"
                        )
                    ),
                    " ",
                    plan
                );
            }
        });

        var FreeTierProgress = React.createClass({
            displayName: "FreeTierProgress",
            getInitialState: function () {
                return {
                    loadingReferralModal: false
                };
            },
            getFreeRequests: function () {
                var target = this;
                target.setState({ loadingReferralModal: true });
                displayGetFreeRequests(function () {
                    target.setState({ loadingReferralModal: false });
                });
            },
            render: function () {
                var plan = Synchronise.User.current().subscription;
                var content = React.createElement("span", null);
                var progress = "";

                var requests_allowed = 10000 + parseInt(Synchronise.User.current().bonus_requests);
                var requests_left = requests_allowed - parseInt(Synchronise.User.current().requests_executed);
                var percentageLeft = Math.min(requests_left / requests_allowed * 100, 100);

                if (requests_left / 1000 >= 1) {
                    requests_left = Math.round(requests_left / 1000) + "K";
                }

                var freeRequestButtonLabel = "Free requests";
                if (this.state.loadingReferralModal) {
                    freeRequestButtonLabel = "Loading...";
                }

                if (plan == "earth") {
                    if (requests_left) {
                        progress = React.createElement(
                            "div",
                            { className: "progress", style: { marginBottom: "0px", width: "50px", display: "inline-block", lineHeight: "32px", marginRight: "10px" } },
                            React.createElement("div", { className: "progress-bar progress-bar-warning", role: "progressbar", "aria-valuenow": percentageLeft, "aria-valuemin": "0", "aria-valuemax": "100", style: { width: percentageLeft + "%", borderRadius: "0" } })
                        );

                        content = React.createElement(
                            "li",
                            { className: "hidden-xs", style: { lineHeight: "64px", borderRight: "1px dotted rgba(255,255,255,0.5)" } },
                            React.createElement(
                                "div",
                                { style: { position: "absolute", top: "-13px", right: "10px" } },
                                React.createElement(
                                    "button",
                                    { className: "btn btn-xs btn-warning", style: { marginRight: "10px" }, onClick: this.getFreeRequests },
                                    freeRequestButtonLabel
                                )
                            ),
                            React.createElement(
                                "div",
                                { style: { marginBottom: "-13px", marginTop: "13px" } },
                                React.createElement(
                                    "div",
                                    { style: { display: "inline-block", marginRight: "0px" } },
                                    React.createElement(
                                        "small",
                                        { style: { color: "white" } },
                                        "Requests:"
                                    )
                                ),
                                React.createElement(
                                    "div",
                                    { style: { display: "inline-block", lineHeight: "32px", marginRight: "5px" } },
                                    requests_left
                                ),
                                progress
                            )
                        );
                    } else {
                        content = React.createElement(
                            "li",
                            { className: "hidden-xs", style: { lineHeight: "64px", borderRight: "1px dotted rgba(255,255,255,0.5)" } },
                            React.createElement(
                                "button",
                                { className: "btn btn-xs btn-warning", style: { marginRight: "10px" }, onClick: this.getFreeRequests },
                                freeRequestButtonLabel
                            )
                        );
                    }
                }

                return content;
            }
        });

        ReactDOM.render(React.createElement(NavBarRight, null), document.getElementById("navBarRight"));

        // Displays a banner when the connection to the server (socket) is lost
        var ConnectionLostBanner = React.createClass({
            displayName: "ConnectionLostBanner",
            getInitialState: function () {
                return {
                    disconnected: true,
                    style: { marginTop: "-25px" }
                };
            },
            componentDidMount: function () {
                var target = this;

                Synchronise.Connection.Lost(function (reason) {
                    target.setState({ disconnected: true });
                });

                Synchronise.Connection.Connected(function () {
                    target.setState({
                        disconnected: false,
                        style: { marginTop: "0px" }
                    });
                });
            },
            render: function () {
                var content = React.createElement("div", null);
                if (this.state.disconnected) {
                    content = React.createElement(
                        "div",
                        { id: "connectionLostBanner", style: this.state.style },
                        React.createElement(
                            "div",
                            { className: "content" },
                            "Oops, sounds like we have lost the connection with the server. Reconnecting..."
                        )
                    );
                }

                return React.createElement(
                    "div",
                    null,
                    content
                );
            }
        });

        ReactDOM.render(React.createElement(ConnectionLostBanner, null), document.getElementById("ConnectionLostBanner"));

        // Displays the branding of Synchronise
        var HeaderBranding = React.createClass({
            displayName: "HeaderBranding",
            render: function () {
                var brand = "";
                if (!this.props.collapsed) {
                    brand = React.createElement(
                        "a",
                        { className: "navbar-brand hidden-xs", href: "/" },
                        "ynchronise"
                    );
                } else {
                    brand = React.createElement("a", { className: "navbar-brand hidden-xs", href: "/" });
                }

                var loginSignupButton = "";
                if (!Synchronise.User.current()) {
                    loginSignupButton = React.createElement(
                        "div",
                        { className: "visible-xs pull-left", style: { position: "absolute", top: "17px", left: "15px" } },
                        React.createElement(
                            "button",
                            { className: "loginSignupButton btn btn-xs btn-default" },
                            "Login/Signup"
                        )
                    );
                }

                return React.createElement(
                    "div",
                    { className: "navbar-header" },
                    React.createElement(
                        "div",
                        { className: "hidden-xs", style: { left: "0", top: "0", position: "absolute" } },
                        React.createElement("img", { src: "/images/synchroniseSquare.png", style: { height: "64px", marginLeft: "10px" } })
                    ),
                    React.createElement(
                        "div",
                        { className: "visible-xs", style: { left: "0", top: "0", width: "100%", position: "absolute", textAlign: "center" } },
                        loginSignupButton,
                        React.createElement(
                            "a",
                            { href: "/" },
                            React.createElement("img", { src: "/images/synchroniseSquare.png", style: { height: "64px", marginLeft: "10px" } })
                        )
                    ),
                    React.createElement(
                        "button",
                        { type: "button", className: "navbar-toggle collapsed", "data-toggle": "collapse", "data-target": "#sde-navbar-collapse" },
                        React.createElement(
                            "span",
                            { className: "sr-only" },
                            "Toggle navigation"
                        ),
                        React.createElement("span", { className: "icon-bar" }),
                        React.createElement("span", { className: "icon-bar" }),
                        React.createElement("span", { className: "icon-bar" })
                    ),
                    brand
                );
            }
        });

        // Links of the TopMenu
        var TopMenu = React.createClass({
            displayName: "TopMenu",
            getInitialState: function () {
                return { shortcuts: [] };
            },
            componentDidMount: function () {
                var target = this;

                Synchronise.LocalStorage.get("shortcutsMenu", function (shortcuts) {
                    target.setState({ shortcuts: shortcuts });
                }, [], true);

                $(window).resize(function () {
                    target.resizeInterface();
                });
            },
            resizeInterface: function () {
                /*var calculation = $(window).width()-$(".navbar-header").width()-$(".navbar-right").width();
                $(ReactDOM.findDOMNode(this)).find('.navbar-nav').css({
                    maxWidth: calculation+"px",
                    overflowX: "auto",
                    width: calculation,
                    height: "64px",
                    maxHeight: "64px",
                    white
                });*/
            },
            render: function () {
                var target = this;

                var shortcuts = "";
                if (target.state.shortcuts.length) {
                    shortcuts = React.createElement(Shortcuts, { shortcuts: target.state.shortcuts });
                }

                var content = "";
                if (Synchronise.User.current()) {
                    /*
                    <li className={this.props.buttonsStates.blog}><a href="/blog">Blog</a></li>
                    */
                    content = React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "ul",
                            { className: "nav navbar-nav" },
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.dashboard },
                                React.createElement(
                                    "a",
                                    { href: "/dashboard" },
                                    React.createElement(
                                        "u",
                                        null,
                                        "D"
                                    ),
                                    "ashboard"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.marketplace },
                                React.createElement(
                                    "a",
                                    { href: "/marketplace" },
                                    "Marketplace"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.docs },
                                React.createElement(
                                    "a",
                                    { href: "/docs" },
                                    "Docs"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.help },
                                React.createElement(
                                    "a",
                                    { href: "/help" },
                                    "H",
                                    React.createElement(
                                        "u",
                                        null,
                                        "e"
                                    ),
                                    "lp"
                                )
                            ),
                            React.createElement("li", { className: "changelogArea", style: { marginTop: "17px" } })
                        ),
                        shortcuts
                    );
                } else {
                    /*
                    <li className={this.props.buttonsStates.blog}><a href="/blog">Blog</a></li>
                    */
                    content = React.createElement(
                        "ul",
                        { className: "nav navbar-nav" },
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.home },
                            React.createElement(
                                "a",
                                { href: "/" },
                                "Home"
                            )
                        ),
                        React.createElement(
                            "li",
                            null,
                            React.createElement(
                                "a",
                                { href: "/#product" },
                                "Product"
                            )
                        ),
                        React.createElement(
                            "li",
                            null,
                            React.createElement(
                                "a",
                                { href: "/#pricing" },
                                "Pricing"
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.marketplace },
                            React.createElement(
                                "a",
                                { href: "/marketplace" },
                                "Marketplace"
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.docs },
                            React.createElement(
                                "a",
                                { href: "/docs" },
                                "Docs"
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.help },
                            React.createElement(
                                "a",
                                { href: "/help" },
                                "H",
                                React.createElement(
                                    "u",
                                    null,
                                    "e"
                                ),
                                "lp"
                            )
                        )
                    );
                }

                return content;
            }
        });

        var Shortcuts = React.createClass({
            displayName: "Shortcuts",
            componentDidMount: function () {
                var target = this;

                $("#sde-navbar-collapse .shortcut").draggable({
                    revert: true,
                    drag: function (event, object) {
                        var element = $(event.target);
                        if (object.position.top > $('#sde-navbar-collapse').height()) {
                            element.addClass("willRemove");
                        } else {
                            element.removeClass("willRemove");
                        }
                    },
                    stop: function (event, object) {
                        var element = $(event.target);

                        if (object.position.top > $('#sde-navbar-collapse').height()) {
                            var newArray = target.props.shortcuts;
                            newArray.splice(element.index(), 1);

                            Synchronise.LocalStorage.set("shortcutsMenu", newArray);

                            element.css({
                                opacity: 0.3
                            });
                        } else {
                            element.removeClass("willRemove");
                        }
                    }
                });
            },
            render: function () {
                var target = this;

                return React.createElement(
                    "ul",
                    { className: "nav navbar-nav" },
                    target.props.shortcuts.map(function (row) {
                        return React.createElement(
                            "li",
                            { className: "hidden-xs shortcut draggable ui-draggable ui-draggable-handle", key: row.id },
                            React.createElement(
                                "a",
                                { href: row.link, "data-id": row.id },
                                React.createElement("i", { className: "fa fa-star" }),
                                " ",
                                row.name
                            )
                        );
                    })
                );
            }
        });

        ///// SIDE MENU /////
        var Backbutton = React.createClass({
            displayName: "Backbutton",
            render: function () {
                var content = "";
                if (this.props.collapsed) {
                    content = React.createElement(
                        "li",
                        { className: "back_button" },
                        React.createElement(
                            "a",
                            { href: this.props.url },
                            React.createElement("i", { className: "fa fa-chevron-left" })
                        )
                    );
                } else {
                    content = React.createElement(
                        "li",
                        { className: "back_button" },
                        React.createElement(
                            "a",
                            { href: this.props.url },
                            React.createElement("i", { className: "fa fa-chevron-left" }),
                            " ",
                            this.props.label
                        )
                    );
                }
                return content;
            }
        });

        var SuperAdminBlock = React.createClass({
            displayName: "SuperAdminBlock",
            render: function () {
                var content = "";
                if (this.props.collapsed) {
                    content = React.createElement(
                        "li",
                        { className: this.props.active, "data-toggle": "tooltip", "data-placement": "right", title: "SuperAdmin", "data-container": "#page-wrapper" },
                        React.createElement(
                            "a",
                            { href: "/superadmin" },
                            React.createElement("i", { className: "fa fa-fw fa-cog" })
                        )
                    );
                } else {
                    content = React.createElement(
                        "li",
                        { className: this.props.active },
                        React.createElement(
                            "a",
                            { href: "/superadmin" },
                            React.createElement("i", { className: "fa fa-fw fa-cog" }),
                            " SuperAdmin"
                        )
                    );
                }
                return content;
            }
        });

        var SideMenu = React.createClass({
            displayName: "SideMenu",
            getInitialState: function () {
                return {
                    collapsed: false
                };
            },
            componentDidUpdate: function () {
                $(ReactDOM.findDOMNode(this)).find('.collapseMenu i').attr("class", "fa fa-caret-square-o-left fa-2");
                this.resizeMenu();

                /*if(!this.props.collapsed){
                    Skype.ui({
                      "name": "chat",
                      "element": "SkypeButton_Call_synchroniseio_1",
                      "participants": ["synchroniseio"],
                      "imageSize": 24
                    });
                }*/
            },
            componentDidMount: function () {
                var target = this;

                target.resizeMenu();

                $(window).resize(function () {
                    target.resizeMenu();
                });

                var user = Synchronise.User.current();
            },
            resizeMenu: function () {
                var target = this;
                var maxHeight = 0;

                if (!target.props.collapsed) {
                    var windowHeight = $(window).height();
                    var navbarHeight = $('.navbar').height();
                    //var suggestionBlock = $(ReactDOM.findDOMNode(target)).find('.suggestionBlock').height();
                    var margin = 10;

                    maxHeight = windowHeight - navbarHeight;
                } else {
                    var windowHeight = $(window).height();
                    var navbarHeight = $('.navbar').height();
                    //var suggestionBlock = 30;
                    var margin = 10;

                    maxHeight = windowHeight - (navbarHeight + 40);
                }

                $(ReactDOM.findDOMNode(target)).find('.side-nav').css('maxHeight', maxHeight + 'px');
            },
            collapseMenu: function () {
                var target = this;
                var newValue = !target.props.collapsed;

                Synchronise.LocalStorage.set("dashboardMenuCollapsed", newValue);

                $(ReactDOM.findDOMNode(target)).find('.collapseMenu i').attr("class", "fa fa-refresh fa-2 fa-spin");
            },
            render: function () {
                var backButton = "";
                if (urlH.getParam('backuri')) {
                    backButton = React.createElement(Backbutton, { url: decodeURIComponent(urlH.getParam('backuri')),
                        label: decodeURIComponent(urlH.getParam('backlabel')),
                        collapsed: this.props.collapsed });
                }

                var superAdminBlock = "";
                if (Synchronise.User.current()) {
                    if (Synchronise.User.current().isAdmin()) {
                        superAdminBlock = React.createElement(SuperAdminBlock, { collapsed: this.props.collapsed,
                            active: this.props.buttonsStates.superadmin });
                    }
                }

                var menuContent = "";
                var className = "";
                if (this.props.collapsed) {
                    className = "collapsed";
                }

                /*
                <li className={this.props.buttonsStates.subdashboard}>
                    <a href="/dashboard"><i className="fa fa-fw fa-dashboard"></i> <u>D</u>ashboard</a>
                </li>
                <li className={this.props.buttonsStates.component}>
                    <a href="/component"><i className="fa fa-puzzle-piece"></i> C<u>o</u>mponents</a>
                </li>
                <li className={this.props.buttonsStates.workflow}>
                    <a href="/workflow"><i className="fa fa-random workFlowIcon"></i> Workflows</a>
                </li>
                <li className={this.props.buttonsStates.tokens}>
                    <a href="/oauthtokens"><i className="fa fa-key"></i> OAuth Tokens</a>
                </li>
                <li className={this.props.buttonsStates.events}>
                    <a href="/logs"><i className="fa fa-terminal"></i> Events</a>
                </li>
                <li className={this.props.buttonsStates.project}>
                    <a href="/project"><i className="fa fa fa-cubes"></i> <u>P</u>rojects</a>
                </li>
                <li className={this.props.buttonsStates.analytics}>
                    <a href="/analytics"><i className="fa fa-fw fa-line-chart"></i> <u>A</u>nalytics</a>
                </li>
                <li className={this.props.buttonsStates.logs}>
                    <a href="/logs"><i className="fa fa-terminal"></i> Logs</a>
                </li>
                */
                if (!this.props.collapsed) {
                    menuContent = React.createElement(
                        "ul",
                        { className: "nav navbar-nav side-nav" },
                        backButton,
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.subdashboard },
                            React.createElement(
                                "a",
                                { href: "/dashboard" },
                                React.createElement("i", { className: "fa fa-fw fa-dashboard" }),
                                " ",
                                React.createElement(
                                    "u",
                                    null,
                                    "D"
                                ),
                                "ashboard"
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.component },
                            React.createElement(
                                "a",
                                { href: "/component" },
                                React.createElement("i", { className: "fa fa-puzzle-piece" }),
                                " C",
                                React.createElement(
                                    "u",
                                    null,
                                    "o"
                                ),
                                "mponents"
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.workflow },
                            React.createElement(
                                "a",
                                { href: "/workflow" },
                                React.createElement("i", { className: "fa fa-random workFlowIcon" }),
                                " Workflows"
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.project },
                            React.createElement(
                                "a",
                                { href: "/project" },
                                React.createElement("i", { className: "fa fa fa-cubes" }),
                                " ",
                                React.createElement(
                                    "u",
                                    null,
                                    "P"
                                ),
                                "rojects"
                            )
                        ),
                        superAdminBlock
                    );
                } else {
                    menuContent = React.createElement(
                        "ul",
                        { className: "nav navbar-nav side-nav" },
                        backButton,
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.subdashboard, "data-toggle": "tooltip", "data-placement": "right", title: "Dashboard", "data-container": "#page-wrapper" },
                            React.createElement(
                                "a",
                                { href: "/dashboard" },
                                React.createElement("i", { className: "fa fa-fw fa-dashboard" })
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.component, "data-toggle": "tooltip", "data-placement": "right", title: "Components", "data-container": "#page-wrapper" },
                            React.createElement(
                                "a",
                                { href: "/component" },
                                React.createElement("i", { className: "fa fa-puzzle-piece" })
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.workflow, "data-toggle": "tooltip", "data-placement": "right", title: "Workflows", "data-container": "#page-wrapper" },
                            React.createElement(
                                "a",
                                { href: "/workflow" },
                                React.createElement("i", { className: "fa fa-random workFlowIcon" })
                            )
                        ),
                        React.createElement(
                            "li",
                            { className: this.props.buttonsStates.project, "data-toggle": "tooltip", "data-placement": "right", title: "Projects", "data-container": "#page-wrapper" },
                            React.createElement(
                                "a",
                                { href: "/project" },
                                React.createElement("i", { className: "fa fa fa-cubes" })
                            )
                        ),
                        superAdminBlock
                    );
                }

                var suggestionBlock = "";
                if (!this.props.collapsed) {
                    /*suggestionBlock = (
                        <div>
                            <div className="suggestionBlock">
                              <div className="content">
                                    <h3>Customer feedback</h3>
                                    <h5>Have a suggestion ? Encounter an evil bug ? We want to improve that. Let us know what we can do.</h5>
                                    <div className="row">
                                        <div className="col-lg-6 col-md-6 col-sm-6" style={{textAlign: "center"}}>
                                            <button className="btn btn-primary btn-xs">Feedback</button>
                                        </div>
                                         <div className="col-lg-6 col-md-6 col-sm-6" style={{textAlign: "center"}}>
                                            <div id="SkypeButton_Call_synchroniseio_1" style={{textAlign: "center"}}></div>
                                        </div>
                                    </div>
                              </div>
                            </div>
                             <div id="SkypeButton_Call_synchroniseio_1" style={{textAlign: "center", position: "absolute", bottom: "40px", width: "100%"}}></div>
                        </div>
                    );*/
                }

                return React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "SideMenu collapse navbar-collapse navbar-ex1-collapse hidden-xs " + className },
                        menuContent,
                        React.createElement(
                            "div",
                            { className: "collapseMenu" },
                            React.createElement("i", { className: "fa fa-caret-square-o-left fa-2", onClick: this.collapseMenu })
                        ),
                        suggestionBlock
                    ),
                    React.createElement(
                        "div",
                        { id: "mobile_dashboard_side_nav", className: "visible-xs" },
                        React.createElement(
                            "ul",
                            { className: "list-inline" },
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.subdashboard },
                                React.createElement(
                                    "a",
                                    { href: "/dashboard" },
                                    React.createElement("i", { className: "fa fa-fw fa-dashboard" }),
                                    " Dashboard"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.component },
                                React.createElement(
                                    "a",
                                    { href: "/component" },
                                    React.createElement("i", { className: "fa fa-puzzle-piece" }),
                                    " Components"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.workflow },
                                React.createElement(
                                    "a",
                                    { href: "/workflow" },
                                    React.createElement("i", { className: "fa fa-random workFlowIcon" }),
                                    " Workflows"
                                )
                            ),
                            React.createElement(
                                "li",
                                { className: this.props.buttonsStates.project },
                                React.createElement(
                                    "a",
                                    { href: "/project" },
                                    React.createElement("i", { className: "fa fa fa-cubes" }),
                                    " Projects"
                                )
                            ),
                            superAdminBlock
                        ),
                        React.createElement("hr", null)
                    )
                );
            }
        });

        Synchronise.LocalStorage.get("dashboardMenuCollapsed", function (collapsed) {
            $('#wrapper').css('opacity', 1);

            if (collapsed) {
                $("#wrapper").addClass("collapsed");
                $(".navbar").addClass("collapsed");
            } else {
                $("#wrapper").removeClass("collapsed");
                $(".navbar").removeClass("collapsed");
            }

            if (document.location.pathname != "/" && document.location.pathname != "") {
                ReactDOM.render(React.createElement(HeaderBranding, { collapsed: collapsed }), document.getElementById("headerBrand"));
                ReactDOM.render(React.createElement(TopMenu, { collapsed: collapsed,
                    buttonsStates: navbarButtonsState }), document.getElementById("topMenu"));
            }

            // navbarButtonsState is only available when we are on the dashboard
            if (typeof navbarButtonsState != "undefined") {
                if (navbarButtonsState.dashboard == "active") {
                    ReactDOM.render(React.createElement(SideMenu, { buttonsStates: navbarButtonsState,
                        collapsed: collapsed }), document.getElementById("SideMenu"));
                }
            } else {
                if (document.location.pathname != "/" && document.location.pathname != "") {
                    ReactDOM.render(React.createElement(SideMenu, { collapsed: collapsed }), document.getElementById("SideMenu"));
                }
            }
        }, false, true);
    });
})();