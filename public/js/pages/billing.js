"use strict";

(function () {
    dependenciesLoader(["$", "React", "_", "Loader", "urlH", "Synchronise"], function () {
        if (urlH.getParam("tab")) {
            $('#tabs a[href="#' + urlH.getParam("tab") + '"]').tab('show');
        }

        var SubscriptionSelection = React.createClass({
            displayName: "SubscriptionSelection",
            getInitialState: function getInitialState() {
                return {
                    saving: false,
                    loading: false,
                    cancelling: false,
                    currentPlan: "",
                    planIsActive: false,
                    subscriptionEnds: new Date()
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;
                target.setState({ loading: true });

                Synchronise.User.fetchCurrent(function (user) {
                    var date = new Date(user.subscriptionEnds);
                    target.setState({
                        loading: false,
                        currentPlan: user.subscription,
                        planIsActive: user.subscriptionActive,
                        subscriptionEnds: date
                    });
                });
            },
            selectPlan: function selectPlan(planName, planType, price) {
                var target = this;
                var messageConfirm = "";
                var panelClass = "";

                switch (planName) {
                    case "earth":
                        panelClass = "panel-primary";
                        break;

                    case "mars":
                        panelClass = "panel-warning";
                        break;
                }

                if (planName != "earth") {
                    price = "$" + price;
                    messageConfirm += "Since you were already on a paid plan the first payment will be reduced proportionally to what you already used this month";
                } else {
                    price = "Free";
                    var currentDate = new Date().getTime();
                    if (currentDate < target.state.subscriptionEnds.getTime()) {
                        messageConfirm += "You will be able to use your premium subscription until <b>" + target.state.subscriptionEnds.toUTCString() + "</b>";
                    }
                }

                messageConfirm = "<div class='col-xs-12'><div class='panel " + panelClass + "'><div class='panel-heading'><h3 style='color: white'>" + planName.charAt(0).toUpperCase() + planName.slice(1) + "</h3></div><div class='panel-body'><table class='table table-bordered table-striped'><tbody><tr><th>Cost</th><th>Every</th></tr><tr><td>" + price + "</td><td>" + planType.charAt(0).toUpperCase() + planType.slice(1) + "</td></tr></tbody></table></div><div class='panel-footer'>" + messageConfirm + "</div></div></div>";

                new ModalConfirm(messageConfirm, function (confirm) {
                    if (confirm) {
                        target.setState({ saving: true });

                        var query = Synchronise.Cloud.run("changePlan", { plan: { name: planName, type: planType } }, {
                            error: function error(err) {
                                if (err.message == "noCard") {
                                    $('#tabs [href="#paymentMethods"]').tab("show");
                                    $("#collapseCardForm").collapse('show');
                                } else {
                                    new ModalErrorParse(err);
                                }
                            },
                            success: function success() {
                                if (planName != "earth") {
                                    fbq('track', 'Purchase', { value: parseInt(price), currency: 'USD' });
                                }
                            },
                            always: function always() {
                                target.setState({ saving: false });
                            }
                        });
                    }
                });

                fbq('track', 'InitiateCheckout');
            },
            cancelSubscription: function cancelSubscription() {
                var target = this;
                if (!target.state.cancelling) {
                    target.setState({ cancelling: true });

                    Synchronise.Cloud.run("cancelSubscription", {}, {
                        error: function error(err) {
                            new ModalErrorParse(err);
                        },
                        always: function always() {
                            target.setState({ cancelling: false });
                        }
                    });
                }
            },
            render: function render() {
                var target = this;
                var currentDate = new Date();

                var content = React.createElement(Loader, null);

                if (!this.state.saving && !this.state.loading) {
                    var cancellingLabel = "Cancel subscription";
                    if (this.state.cancelling) {
                        cancellingLabel = "Cancelling";
                    }

                    var buttonForEarth = React.createElement(
                        "button",
                        { className: "btn btn-primary", type: "button", onClick: target.selectPlan.bind(null, "earth", "free") },
                        "Select plan"
                    );
                    if (target.state.currentPlan == "earth") {
                        buttonForEarth = "You are on that plan";
                    }

                    var buttonForMars = React.createElement(
                        "button",
                        { className: "btn btn-success", type: "button", onClick: target.selectPlan.bind(null, "mars", "month", "59"), style: { marginBottom: "5px" } },
                        "Select month plan"
                    );
                    if (target.state.currentPlan == "mars" && target.state.planIsActive) {
                        buttonForMars = React.createElement(
                            "div",
                            null,
                            "You are on the plan Mars charged monthly.",
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "button",
                                    { className: "btn btn-default btn-xs", onClick: this.cancelSubscription },
                                    cancellingLabel
                                )
                            )
                        );
                    } else {
                        if (target.state.currentPlan == "mars" && !target.state.planIsActive) {
                            buttonForMars = React.createElement(
                                "div",
                                null,
                                "You are on the plan Mars charged monthly until ",
                                target.state.subscriptionEnds.toUTCString(),
                                React.createElement(
                                    "div",
                                    null,
                                    React.createElement(
                                        "button",
                                        { className: "btn btn-success", onClick: target.selectPlan.bind(null, "mars", "month", "59") },
                                        "Reactivate subscription"
                                    )
                                )
                            );
                        }
                    }

                    var buttonForMarsYear = React.createElement(
                        "button",
                        { className: "btn btn-success", type: "button", onClick: target.selectPlan.bind(null, "mars", "year", "649"), style: { marginBottom: "5px" } },
                        "Select year plan"
                    );
                    if (target.state.currentPlan == "marsyear" && target.state.planIsActive) {
                        buttonForMarsYear = React.createElement(
                            "div",
                            null,
                            "You are on the plan Mars charged yearly.",
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "button",
                                    { className: "btn btn-default btn-xs", onClick: this.cancelSubscription },
                                    cancellingLabel
                                )
                            )
                        );
                    } else {
                        if (target.state.currentPlan == "marsyear" && !target.state.planIsActive) {
                            buttonForMarsYear = React.createElement(
                                "div",
                                null,
                                "You are on the plan Mars charged yearly until ",
                                target.state.subscriptionEnds.toUTCString(),
                                React.createElement(
                                    "div",
                                    null,
                                    React.createElement(
                                        "button",
                                        { className: "btn btn-success", onClick: target.selectPlan.bind(null, "mars", "year", "649") },
                                        "Reactivate subscription"
                                    )
                                )
                            );
                        }
                    }

                    var planIsActiveUntil = "";
                    if (target.state.subscriptionEnds.getTime() <= currentDate.getTime()) {
                        planIsActiveUntil = "You are on the Earth plan.";
                    } else {
                        planIsActiveUntil = "You are on the " + target.state.currentPlan.charAt(0).toUpperCase() + target.state.currentPlan.slice(1) + " plan until " + target.state.subscriptionEnds.toUTCString();
                    }

                    content = React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "div",
                            { style: { textAlign: "center" } },
                            React.createElement(
                                "h4",
                                null,
                                planIsActiveUntil
                            )
                        ),
                        React.createElement(
                            "legend",
                            null,
                            "Select your plan"
                        ),
                        React.createElement(
                            "div",
                            { id: "plans" },
                            React.createElement(
                                "div",
                                { className: "col-lg-3 col-lg-offset-3 col-md-6 col-xs-12 plan" },
                                React.createElement(
                                    "div",
                                    { className: "panel panel-primary" },
                                    React.createElement(
                                        "div",
                                        { className: "panel-heading", style: { textAlign: "center" } },
                                        React.createElement(
                                            "div",
                                            { className: "planetContainer", style: { width: "100%", position: "absolute", textAlign: "center", left: "0", top: "-60px" } },
                                            React.createElement("img", { className: "img-responsive planetImage", src: "/images/earth.png", style: { width: "100px", margin: "auto" } })
                                        ),
                                        React.createElement(
                                            "h3",
                                            { style: { color: "white" } },
                                            "Earth"
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "panel-body text-center" },
                                        React.createElement(
                                            "h4",
                                            null,
                                            "Free"
                                        )
                                    ),
                                    React.createElement(
                                        "ul",
                                        { className: "list-group text-center" },
                                        React.createElement(
                                            "li",
                                            { className: "list-group-item text-primary" },
                                            React.createElement("i", { className: "fa fa-check" }),
                                            " Requests: 10.000"
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "panel-footer", style: { textAlign: "center" } },
                                        buttonForEarth
                                    )
                                )
                            ),
                            React.createElement(
                                "div",
                                { className: "col-lg-3 col-md-6 col-xs-12 plan" },
                                React.createElement(
                                    "div",
                                    { className: "panel panel-warning" },
                                    React.createElement(
                                        "div",
                                        { className: "panel-heading", style: { textAlign: "center" } },
                                        React.createElement(
                                            "div",
                                            { className: "planetContainer", style: { width: "100%", position: "absolute", textAlign: "center", left: "0", top: "-60px" } },
                                            React.createElement("img", { className: "img-responsive planetImage", src: "/images/mars.png", style: { width: "100px", margin: "auto" } })
                                        ),
                                        React.createElement(
                                            "h3",
                                            { style: { color: "white" } },
                                            "Mars"
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "panel-body text-center" },
                                        React.createElement(
                                            "h4",
                                            null,
                                            "$4.95/Month"
                                        )
                                    ),
                                    React.createElement(
                                        "ul",
                                        { className: "list-group text-center" },
                                        React.createElement(
                                            "li",
                                            { className: "list-group-item text-success" },
                                            React.createElement("i", { className: "fa fa-check" }),
                                            " Requests: Unlimited"
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "panel-footer", style: { textAlign: "center" } },
                                        React.createElement(
                                            "div",
                                            { className: "row" },
                                            React.createElement(
                                                "div",
                                                { className: "col-lg-12 col-md-6 col-sm-6 col-xs-12" },
                                                buttonForMars
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
                    { className: "row-fluid" },
                    React.createElement(
                        "div",
                        { className: "col-xs-12 card" },
                        content
                    )
                );
            }
        });
        ReactDOM.render(React.createElement(SubscriptionSelection, null), document.getElementById("SubscriptionSelection"));

        var Invoices = React.createClass({
            displayName: "Invoices",

            getInitialState: function getInitialState() {
                return {
                    loading: false,
                    invoices: []
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;
                target.setState({ loading: true });

                Synchronise.Cloud.run("listOfInvoicesForUser", {}, {
                    success: function success(data) {
                        target.setState({ invoices: data });
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
                var content = React.createElement(Loader, null);

                if (!this.state.loading) {
                    var invoices = "";

                    if (!this.state.invoices.length) {
                        invoices = React.createElement(
                            "tbody",
                            null,
                            React.createElement(
                                "tr",
                                { style: { textAlign: "center" } },
                                React.createElement(
                                    "td",
                                    { colSpan: "4" },
                                    "No invoices"
                                )
                            )
                        );
                    }

                    if (this.state.invoices.length) {
                        invoices = React.createElement(
                            "tbody",
                            null,
                            React.createElement(
                                "tr",
                                null,
                                React.createElement(
                                    "th",
                                    null,
                                    "ID"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Date"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Period Start"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Period End"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Amount"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Status"
                                )
                            ),
                            this.state.invoices.map(function (row) {
                                var paidLabel = "unpaid";
                                if (row.paid) {
                                    paidLabel = "paid";
                                }

                                var classForInvoice = "warning";
                                if (row.paid) {
                                    classForInvoice = "success";
                                }

                                return React.createElement(
                                    "tr",
                                    { key: "invoice" + row.id, className: classForInvoice },
                                    React.createElement(
                                        "td",
                                        null,
                                        row.id
                                    ),
                                    React.createElement(
                                        "td",
                                        null,
                                        new Date(row.date * 1000).toUTCString()
                                    ),
                                    React.createElement(
                                        "td",
                                        null,
                                        new Date(row.period_start * 1000).toUTCString()
                                    ),
                                    React.createElement(
                                        "td",
                                        null,
                                        new Date(row.period_end * 1000).toUTCString()
                                    ),
                                    React.createElement(
                                        "td",
                                        null,
                                        "$",
                                        row.amount_due
                                    ),
                                    React.createElement(
                                        "td",
                                        null,
                                        paidLabel
                                    ),
                                    React.createElement(
                                        "td",
                                        null,
                                        React.createElement(
                                            "a",
                                            { target: "_blank", href: "/billing/invoice?id=" + row.id, className: "btn btn-primary" },
                                            "Open"
                                        )
                                    )
                                );
                            })
                        );
                    }

                    content = React.createElement(
                        "div",
                        { className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 table-responsive" },
                        React.createElement(
                            "table",
                            { className: "table table-striped table-bordered" },
                            invoices
                        )
                    );
                }

                return content;
            }
        });
        ReactDOM.render(React.createElement(Invoices, null), document.getElementById("Invoices"));

        // Displays the list of cards stored on the users account
        var CardsList = React.createClass({
            displayName: "CardsList",

            getInitialState: function getInitialState() {
                return {
                    loading: true,
                    cards: []
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;

                target.setState({ loading: true });

                Synchronise.Cloud.run("getCardsListForUser", { realtime: true }, {
                    success: function success(cards) {
                        target.setState({ cards: cards });
                    },
                    always: function always() {
                        target.setState({ loading: false });
                    }
                });

                if (urlH.getParam("openCardForm")) {
                    $("#collapseCardForm").collapse('show');
                }
            },
            render: function render() {
                // Still loading
                var content = React.createElement(
                    "table",
                    { className: "table table-striped table-bordered table-condensed" },
                    React.createElement(
                        "tbody",
                        null,
                        React.createElement(
                            "tr",
                            { style: { textAlign: "center" } },
                            React.createElement(
                                "td",
                                { colSpan: "6" },
                                React.createElement(Loader, null)
                            )
                        )
                    )
                );

                // Cards found and not loading anymore
                if (!this.state.loading && this.state.cards.length) {
                    content = React.createElement(
                        "table",
                        { className: "table table-striped table-bordered" },
                        React.createElement(
                            "tbody",
                            null,
                            React.createElement(
                                "tr",
                                null,
                                React.createElement(
                                    "th",
                                    null,
                                    " "
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "First name"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Surname"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Company"
                                ),
                                React.createElement(
                                    "th",
                                    null,
                                    "Expiry date"
                                )
                            ),
                            this.state.cards.map(function (card) {
                                return React.createElement(CardListItem, { key: "card" + card.id,
                                    id: card.id,
                                    type: card.card_type,
                                    last4: card.last4,
                                    firstname: card.firstname,
                                    surname: card.surname,
                                    expiry_month: card.expiry_month,
                                    company: card.company,
                                    expiry_year: card.expiry_year,
                                    isDefault: card.isDefault });
                            })
                        )
                    );
                } else if (!this.state.loading && !this.state.cards.length) {
                    // No cards saved in the system
                    content = React.createElement(
                        "table",
                        { className: "table table-striped table-bordered table-condensed" },
                        React.createElement(
                            "tbody",
                            null,
                            React.createElement(
                                "tr",
                                { style: { textAlign: "center" } },
                                React.createElement(
                                    "td",
                                    { colSpan: "6" },
                                    "No cards saved"
                                )
                            )
                        )
                    );
                }

                return content;
            }
        });

        // Displays an alert if the user has not linked a card
        var CardStoreAlert = React.createClass({
            displayName: "CardStoreAlert",

            getInitialState: function getInitialState() {
                return {
                    cards: [],
                    loading: true
                };
            },
            componentDidMount: function componentDidMount() {
                var target = this;
                Synchronise.Cloud.run("getCardsListForUser", { realtime: true }, {
                    success: function success(cards) {
                        target.setState({ cards: cards });
                    },
                    always: function always() {
                        target.setState({
                            loading: false
                        });
                    }
                });
            },
            render: function render() {
                var content = React.createElement("div", null);

                if (!this.state.cards.length && !this.state.loading) {
                    content = React.createElement(
                        "div",
                        { className: "col-xs-12" },
                        React.createElement(
                            "div",
                            { className: "alert alert-info", role: "alert" },
                            "Save your card now to avoid any disruption of your service."
                        )
                    );
                }

                return content;
            }
        });

        // Displays one card in the list of cards
        // Props :
        // - id           : id of the card
        // - type         : type of the card (visa, amex...)
        // - firstname    : firstname of the owner of the card
        // - surname      : surname of the owner of the card
        // - expiry_month
        // - expiry_year
        // - company
        // - isDefault
        // - last4        : last 4 digits of the card
        // - isDefault : whether the card is the default one
        var CardListItem = React.createClass({
            displayName: "CardListItem",

            getInitialState: function getInitialState() {
                return {
                    isSettingAsDefault: false,
                    removing: false
                };
            },
            changeDefaultCard: function changeDefaultCard(event) {
                event.preventDefault();

                var target = this;
                target.setState({ isSettingAsDefault: true });

                Synchronise.Cloud.run("setDefaultCard", { id_card: this.props.id }, {
                    always: function always() {
                        target.setState({ isSettingAsDefault: false });
                    },
                    error: function error(err) {
                        new ModalErrorParse(err);
                    }
                });
            },
            deleteCard: function deleteCard(event) {
                event.preventDefault();

                var target = this;

                if (!target.state.removing) {
                    target.setState({ removing: true });
                    Synchronise.Cloud.run("deleteCard", { id_card: this.props.id }, {
                        always: function always() {
                            target.setState({ removing: false });
                        },
                        error: function error(err) {
                            new ModalErrorParse(err);
                        }
                    });
                }
            },
            render: function render() {
                var isDefault = React.createElement(
                    "a",
                    { alt: "Set card as default", onClick: this.changeDefaultCard },
                    "Set as default"
                );
                if (this.props.isDefault) {
                    isDefault = React.createElement(
                        "span",
                        { className: "label label-primary" },
                        "Default"
                    );
                }

                var isSettingAsDefault = "";
                if (this.state.isSettingAsDefault) {
                    isSettingAsDefault = "Saving...";
                }

                var deleteButton = React.createElement("td", null);
                if (!this.props.isDefault) {
                    if (this.state.removing) {
                        deleteButton = React.createElement(
                            "td",
                            null,
                            React.createElement(
                                "button",
                                { className: "btn btn-default btn-xs" },
                                "Deleting..."
                            )
                        );
                    } else {
                        deleteButton = React.createElement(
                            "td",
                            null,
                            React.createElement(
                                "button",
                                { className: "btn btn-default btn-xs", onClick: this.deleteCard },
                                "Delete"
                            )
                        );
                    }
                }

                return React.createElement(
                    "tr",
                    null,
                    React.createElement(
                        "td",
                        null,
                        React.createElement("img", { src: "/images/cards/" + this.props.type + ".png", alt: this.props.type }),
                        " (",
                        this.props.last4,
                        ") ",
                        isDefault,
                        " ",
                        isSettingAsDefault
                    ),
                    React.createElement(
                        "td",
                        null,
                        this.props.firstname
                    ),
                    React.createElement(
                        "td",
                        null,
                        this.props.surname
                    ),
                    React.createElement(
                        "td",
                        null,
                        this.props.company
                    ),
                    React.createElement(
                        "td",
                        null,
                        this.props.expiry_month + "/" + this.props.expiry_year
                    ),
                    deleteButton
                );
            }
        });

        ReactDOM.render(React.createElement(CardsList, null), document.getElementById("CardList"));
        ReactDOM.render(React.createElement(CardStoreAlert, null), document.getElementById("CardStoreAlert"));
    });

    dependenciesLoader(["$", "React", "_", "Stripe", "Loader"], function () {
        // Displays a form to add a new card
        var CardForm = React.createClass({
            displayName: "CardForm",

            getInitialState: function getInitialState() {
                return {
                    saving: false,
                    first_name: "",
                    surname: "",
                    card_number: "",
                    card_expiry: {
                        month: "",
                        year: ""
                    },
                    card_expiry_field_value: "",
                    card_cvc: "",
                    company: ""
                };
            },
            componentDidMount: function componentDidMount() {
                $('#collapseCardForm').on('shown.bs.collapse', function () {
                    $('#collapseCardForm input').first().focus();
                });
            },
            submit: function submit(event) {
                event.preventDefault();
                if (!this.state.saving) {
                    var target = this;

                    if ($.payment.validateCardNumber(target.state.card_number) && $.payment.validateCardExpiry(target.state.card_expiry.month, target.state.card_expiry.year) && $.payment.validateCardCVC(target.state.card_cvc, $.payment.cardType(target.state.card_number))) {

                        target.setState({ saving: true });

                        Stripe.card.createToken({
                            number: target.state.card_number,
                            cvc: target.state.card_cvc,
                            exp_month: target.state.card_expiry.month,
                            exp_year: target.state.card_expiry.year
                        }, function (status, token) {
                            if (status) {
                                Synchronise.Cloud.run("saveCardInfo", {
                                    token: token.id,
                                    firstname: target.state.first_name,
                                    surname: target.state.surname,
                                    company: target.state.company,
                                    type: $.payment.cardType(target.state.card_number),
                                    exp_month: target.state.card_expiry.month,
                                    exp_year: target.state.card_expiry.year
                                }, {
                                    success: function success() {
                                        target.setState({
                                            first_name: "",
                                            surname: "",
                                            card_number: "",
                                            card_expiry: {
                                                month: "",
                                                year: ""
                                            },
                                            card_expiry_field_value: "",
                                            card_cvc: "",
                                            company: ""
                                        });

                                        $('#collapseCardForm').collapse('hide');
                                        fbq('track', 'AddPaymentInfo');
                                    },
                                    error: function error(err) {
                                        new ModalErrorParse(err);
                                    },
                                    always: function always() {
                                        target.setState({ saving: false });
                                    }
                                });
                            } else {
                                new ModalErrorParse("An error occured while trying to process your card");
                            }
                        });
                    }
                }
            },
            handleCompanyName: function handleCompanyName(event) {
                var target = this;
                target.setState({ company: event.target.value });
            },
            handleFirstName: function handleFirstName(event) {
                var target = this;
                target.setState({ first_name: event.target.value });
            },
            handleSurname: function handleSurname(event) {
                var target = this;
                target.setState({ surname: event.target.value });
            },
            handleCardNumber: function handleCardNumber(event) {
                $('[data-numeric]').payment('restrictNumeric');
                $('input.cc-num').payment('formatCardNumber');

                var target = this;
                target.setState({ card_number: event.target.value });
            },
            handleCardExpiry: function handleCardExpiry(event) {
                $('[data-numeric]').payment('restrictNumeric');
                $('input.cc-exp').payment('formatCardExpiry');

                var target = this;
                target.setState({ card_expiry_field_value: event.target.value });

                var expiry = $.payment.cardExpiryVal(event.target.value);

                var month = "";
                var year = "";

                if (!isNaN(expiry["month"])) {
                    month = expiry["month"];
                }

                if (!isNaN(expiry["year"])) {
                    year = expiry["year"];
                }

                target.setState({ card_expiry: {
                        month: month,
                        year: year
                    } });
            },
            handleCardCVC: function handleCardCVC(event) {
                var target = this;
                target.setState({ card_cvc: event.target.value });

                $('input.cc-cvc').payment('formatCardCVC');
            },
            render: function render() {
                var identifiedForm = "";
                var identifiedFirstName = "";
                var identifiedSurname = "";
                var identifiedCardNum = "";
                var identifiedCardExp = "";
                var identifiedCardCVC = "";
                var identifiedCompany = "";

                if (this.state.company.length) {
                    identifiedCompany = "identified";
                }

                if (this.state.first_name.length) {
                    identifiedFirstName = "identified";
                }

                if (this.state.surname.length) {
                    identifiedSurname = "identified";
                }

                if ($.payment.validateCardNumber(this.state.card_number)) {
                    identifiedCardNum = "identified";
                }

                if ($.payment.validateCardExpiry(this.state.card_expiry.month, this.state.card_expiry.year)) {
                    identifiedCardExp = "identified";
                }

                if ($.payment.validateCardCVC(this.state.card_cvc, $.payment.cardType(this.state.card_number))) {
                    identifiedCardCVC = "identified";
                }

                if ($.payment.validateCardNumber(this.state.card_number) && $.payment.validateCardExpiry(this.state.card_expiry.month, this.state.card_expiry.year) && $.payment.validateCardCVC(this.state.card_cvc, $.payment.cardType(this.state.card_number))) {
                    identifiedForm = "identified";
                    identifiedCompany = "";
                    identifiedFirstName = "";
                    identifiedSurname = "";
                    identifiedCardNum = "";
                    identifiedCardExp = "";
                    identifiedCardCVC = "";
                }

                var labelSubmitButton = "Save card";
                var messageWhileSaving = "";
                if (this.state.saving) {
                    labelSubmitButton = "Saving...";
                    messageWhileSaving = React.createElement(
                        "p",
                        null,
                        "Please be patient, this can take a while"
                    );
                }

                return React.createElement(
                    "form",
                    { acceptCharset: "UTF-8",
                        className: "simple_form cardInfo well " + identifiedForm,
                        action: "#",
                        id: "payment-form" },
                    React.createElement("i", { className: "fa fa-lock secureIcon" }),
                    React.createElement(
                        "fieldset",
                        { className: "cardInfo__personalDetails" },
                        React.createElement(
                            "div",
                            { className: "input string required cardInfo_companyname form-row" },
                            React.createElement(
                                "label",
                                { className: "string required", htmlFor: "cardInfo_firstname" },
                                "Company"
                            ),
                            React.createElement("input", { "aria-required": "true",
                                className: "string required form-control paymentInput " + identifiedCompany,
                                id: "cardInfo_company",
                                maxLength: "60",
                                name: "cardInfo[company]",
                                placeholder: "Company LTD",
                                size: "60",
                                type: "text",
                                value: this.state.company,
                                onChange: this.handleCompanyName })
                        ),
                        React.createElement(
                            "div",
                            { className: "input string required cardInfo_firstname form-row" },
                            React.createElement(
                                "label",
                                { className: "string required", htmlFor: "cardInfo_firstname" },
                                "First Name"
                            ),
                            React.createElement("input", { "aria-required": "true",
                                className: "string required form-control paymentInput " + identifiedFirstName,
                                id: "cardInfo_firstname",
                                maxLength: "60",
                                name: "cardInfo[firstname]",
                                placeholder: "e.g. Joe",
                                required: "required",
                                size: "60",
                                type: "text",
                                value: this.state.first_name,
                                onChange: this.handleFirstName })
                        ),
                        React.createElement(
                            "div",
                            { className: "input string required cardInfo_surname form-row" },
                            React.createElement(
                                "label",
                                { className: "string required",
                                    htmlFor: "cardInfo_surname" },
                                "Surname"
                            ),
                            React.createElement("input", { "aria-required": "true",
                                className: "string required form-control paymentInput " + identifiedSurname,
                                id: "cardInfo_surname",
                                maxLength: "60",
                                name: "cardInfo[surname]",
                                placeholder: "e.g. Bloggs",
                                required: "required",
                                size: "60",
                                type: "text",
                                value: this.state.surname,
                                onChange: this.handleSurname })
                        )
                    ),
                    React.createElement(
                        "fieldset",
                        { className: "cardInfo__cardDetails" },
                        React.createElement("span", { className: "payment-errors" }),
                        React.createElement(
                            "div",
                            { className: "form-row cardInfo__cc-num" },
                            React.createElement(
                                "label",
                                { htmlFor: "cc-num" },
                                React.createElement(
                                    "span",
                                    null,
                                    "Card Number"
                                )
                            ),
                            React.createElement(
                                "div",
                                { className: "cc-num__wrap" },
                                React.createElement("input", { id: "cc-num",
                                    type: "tel",
                                    className: "paymentInput cc-num unknown form-control " + identifiedCardNum,
                                    placeholder: "•••• •••• •••• ••••",
                                    autocompletetype: "cc-number",
                                    required: "required",
                                    value: this.state.card_number,
                                    onChange: this.handleCardNumber }),
                                React.createElement("span", { className: "cardimage", "aria-hidden": "true" })
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "div",
                                { className: "form-row cardInfo__cc-exp input col-lg-6 col-md-6 col-sm-6 col-xs-6" },
                                React.createElement(
                                    "label",
                                    { htmlFor: "cc-exp" },
                                    React.createElement(
                                        "span",
                                        null,
                                        "Expires"
                                    )
                                ),
                                React.createElement("input", { id: "cc-exp",
                                    type: "tel",
                                    className: "paymentInput cc-exp cc-exp__demo form-control " + identifiedCardExp,
                                    placeholder: "MM / YY",
                                    size: "10",
                                    autocompletetype: "cc-exp",
                                    required: "required",
                                    value: this.state.card_expiry_field_value,
                                    onChange: this.handleCardExpiry })
                            ),
                            React.createElement(
                                "div",
                                { className: "form-row cardInfo__cc-cvc input col-lg-6 col-md-6 col-sm-6 col-xs-6" },
                                React.createElement(
                                    "label",
                                    { htmlFor: "cc-cvc" },
                                    React.createElement(
                                        "span",
                                        null,
                                        "CVC"
                                    )
                                ),
                                React.createElement("input", { id: "cc-cvc",
                                    type: "tel",
                                    className: "paymentInput cc-cvc cc-cvc__demo form-control " + identifiedCardCVC,
                                    placeholder: "CVC",
                                    autocompletetype: "cc-cvc",
                                    required: "required",
                                    value: this.state.card_cvc,
                                    onChange: this.handleCardCVC })
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "cardInfo__submission col-lg-12 col-md-12 col-sm-12 col-xs-12", style: { textAlign: "center" } },
                            React.createElement(
                                "button",
                                { className: "btn btn-primary", onClick: this.submit },
                                labelSubmitButton
                            ),
                            messageWhileSaving
                        )
                    )
                );
            }
        });

        ReactDOM.render(React.createElement(CardForm, null), document.getElementById("CardForm"));

        // Displays a form to add a coupon code
        var CouponCodeForm = React.createClass({
            displayName: "CouponCodeForm",

            getInitialState: function getInitialState() {
                return {
                    coupon: "",
                    saving: false
                };
            },
            couponChanged: function couponChanged(event) {
                var target = this;
                target.setState({ coupon: event.target.value });
            },
            applyCoupon: function applyCoupon() {
                var target = this;
                if (!target.state.saving && this.state.coupon.length) {
                    target.setState({ saving: true });

                    Synchronise.Cloud.run("applyCoupon", { coupon: this.state.coupon }, {
                        success: function success() {
                            var modal = new Modal();
                            modal.title("Coupon");
                            modal.content("Your coupon has been applied successfully.");
                            modal.footer("", true);
                            modal.show();
                        },
                        error: function error(err) {
                            new ModalErrorParse(err);
                        },
                        always: function always() {
                            target.setState({ saving: false, coupon: "" });
                        }
                    });
                }
            },
            render: function render() {
                var labelForButton = "Add coupon";
                if (this.state.saving) {
                    labelForButton = "Saving...";
                }

                return React.createElement(
                    "div",
                    { style: { textAlign: "center" } },
                    React.createElement(
                        "div",
                        { className: "col-xs-12 col-sm-8 col-md-6 col-sm-offset-2 col-md-offset-3" },
                        React.createElement("input", { type: "text", className: "form-control", value: this.state.coupon, onChange: this.couponChanged }),
                        React.createElement(
                            "button",
                            { className: "btn btn-primary", style: { marginTop: "10px" }, onClick: this.applyCoupon },
                            labelForButton
                        )
                    )
                );
            }
        });

        ReactDOM.render(React.createElement(CouponCodeForm, null), document.getElementById("CouponCodeForm"));
    });
})();