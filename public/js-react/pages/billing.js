(function(){
    dependenciesLoader(["$", "React", "_", "Loader", "urlH", "Synchronise"], function(){
        if(urlH.getParam("tab")){
            $('#tabs a[href="#' + urlH.getParam("tab") + '"]').tab('show');
        }

        var SubscriptionSelection = React.createClass({
            displayName: "SubscriptionSelection",
            getInitialState: function(){
                return {
                    saving: false,
                    loading: false,
                    cancelling: false,
                    currentPlan: "",
                    planIsActive: false,
                    subscriptionEnds: new Date()
                };
            },
            componentDidMount: function(){
                var target = this;
                    target.setState({loading: true});

                Synchronise.User.fetchCurrent(function(user){
                    var date = new Date(user.subscriptionEnds);
                    target.setState({
                        loading: false,
                        currentPlan: user.subscription,
                        planIsActive: user.subscriptionActive,
                        subscriptionEnds: date
                    });
                });
            },
            selectPlan: function(planName, planType, price){
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

                if(planName != "earth"){
                    price = "$"+price;
                    messageConfirm += "Since you were already on a paid plan the first payment will be reduced proportionally to what you already used this month";
                }else{
                    price = "Free";
                    var currentDate = new Date().getTime();
                    if(currentDate<target.state.subscriptionEnds.getTime()){
                        messageConfirm += "You will be able to use your premium subscription until <b>" + target.state.subscriptionEnds.toUTCString() + "</b>";
                    }
                }

                messageConfirm = "<div class='col-xs-12'><div class='panel " + panelClass + "'><div class='panel-heading'><h3 style='color: white'>" + planName.charAt(0).toUpperCase() + planName.slice(1) + "</h3></div><div class='panel-body'><table class='table table-bordered table-striped'><tbody><tr><th>Cost</th><th>Every</th></tr><tr><td>" + price + "</td><td>" + planType.charAt(0).toUpperCase() + planType.slice(1) + "</td></tr></tbody></table></div><div class='panel-footer'>" + messageConfirm + "</div></div></div>";

                new ModalConfirm(messageConfirm, function(confirm){
                    if(confirm){
                        target.setState({saving: true});

                        var query = Synchronise.Cloud.run("changePlan", {plan: {name: planName, type: planType}}, {
                            error: function(err){
                                if(err.message == "noCard"){
                                    $('#tabs [href="#paymentMethods"]').tab("show");
                                    $("#collapseCardForm").collapse('show');
                                }else{
                                    new ModalErrorParse(err);
                                }
                            },
                            success: function(){
                                if(planName!="earth"){
                                    fbq('track', 'Purchase', {value: parseInt(price), currency: 'USD'});
                                }
                            },
                            always: function(){
                                target.setState({saving: false});
                            }
                        });
                    }
                });

                fbq('track', 'InitiateCheckout');
            },
            cancelSubscription: function(){
                var target = this;
                if(!target.state.cancelling){
                    target.setState({cancelling: true});

                    Synchronise.Cloud.run("cancelSubscription", {}, {
                        error: function(err){
                            new ModalErrorParse(err);
                        },
                        always: function(){
                            target.setState({cancelling: false});
                        }
                    });
                }
            },
            render: function(){
                var target = this;
                var currentDate = new Date();

                var content = (<Loader/>);

                if(!this.state.saving && !this.state.loading){
                    var cancellingLabel = "Cancel subscription";
                    if(this.state.cancelling){
                        cancellingLabel = "Cancelling";
                    }

                    var buttonForEarth = (<button className="btn btn-primary" type="button" onClick={target.selectPlan.bind(null, "earth", "free")}>Select plan</button>);
                    if(target.state.currentPlan == "earth"){
                        buttonForEarth = "You are on that plan";
                    }

                    var buttonForMars = (<button className="btn btn-success" type="button" onClick={target.selectPlan.bind(null, "mars", "month", "59")} style={{marginBottom: "5px"}}>Select month plan</button>);
                    if(target.state.currentPlan == "mars" && target.state.planIsActive){
                        buttonForMars = (
                            <div>
                                You are on the plan Mars charged monthly.
                                <div><button className="btn btn-default btn-xs" onClick={this.cancelSubscription}>{cancellingLabel}</button></div>
                            </div>
                        );
                    }else{
                        if(target.state.currentPlan == "mars" && !target.state.planIsActive){
                            buttonForMars = (
                                <div>
                                    You are on the plan Mars charged monthly until {target.state.subscriptionEnds.toUTCString()}
                                    <div><button className="btn btn-success" onClick={target.selectPlan.bind(null, "mars", "month", "59")}>Reactivate subscription</button></div>
                                </div>
                            );
                        }
                    }

                    var buttonForMarsYear = (<button className="btn btn-success" type="button" onClick={target.selectPlan.bind(null, "mars", "year", "649")} style={{marginBottom: "5px"}}>Select year plan</button>);
                    if(target.state.currentPlan == "marsyear" && target.state.planIsActive){
                        buttonForMarsYear = (
                            <div>
                                You are on the plan Mars charged yearly.
                                <div><button className="btn btn-default btn-xs" onClick={this.cancelSubscription}>{cancellingLabel}</button></div>
                            </div>
                        );
                    }else{
                        if(target.state.currentPlan == "marsyear" && !target.state.planIsActive){
                            buttonForMarsYear = (
                                <div>
                                    You are on the plan Mars charged yearly until {target.state.subscriptionEnds.toUTCString()}
                                    <div><button className="btn btn-success" onClick={target.selectPlan.bind(null, "mars", "year", "649")}>Reactivate subscription</button></div>
                                </div>
                            );
                        }
                    }

                    var planIsActiveUntil = "";
                    if(target.state.subscriptionEnds.getTime()<=currentDate.getTime()){
                        planIsActiveUntil = "You are on the Earth plan.";
                    }else{
                        planIsActiveUntil = "You are on the " + target.state.currentPlan.charAt(0).toUpperCase() + target.state.currentPlan.slice(1) + " plan until " + target.state.subscriptionEnds.toUTCString();
                    }

                    content = (
                        <div>
                            <div style={{textAlign: "center"}}><h4>{planIsActiveUntil}</h4></div>
                            <legend>Select your plan</legend>
                            <div id="plans">
                                <div className="col-lg-3 col-lg-offset-3 col-md-6 col-xs-12 plan">
                                    <div className="panel panel-primary">
                                        <div className="panel-heading" style={{textAlign: "center"}}>
                                            <div className="planetContainer" style={{width: "100%", position: "absolute", textAlign: "center", left: "0", top: "-60px"}}>
                                                <img className="img-responsive planetImage" src="https://images.synchronise.io/earth.png" style={{width: "100px", margin: "auto"}}/>
                                            </div>
                                            <h3 style={{color: "white"}}>Earth</h3>
                                        </div>

                                        <div className="panel-body text-center">
                                            <h4>Free</h4>
                                        </div>

                                        <ul className="list-group text-center">
                                            <li className="list-group-item text-primary"><i className="fa fa-check"></i> Requests: 10.000</li>
                                        </ul>
                                        <div className="panel-footer" style={{textAlign: "center"}}>
                                            {buttonForEarth}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-3 col-md-6 col-xs-12 plan">
                                    <div className="panel panel-warning">
                                        <div className="panel-heading" style={{textAlign: "center"}}>
                                            <div className="planetContainer" style={{width: "100%", position: "absolute", textAlign: "center", left: "0", top: "-60px"}}>
                                                <img className="img-responsive planetImage" src="https://images.synchronise.io/mars.png" style={{width: "100px", margin: "auto"}}/>
                                            </div>
                                            <h3 style={{color: "white"}}>Mars</h3>
                                        </div>
                                        <div className="panel-body text-center">
                                            <h4>$4.95/Month</h4>
                                        </div>
                                        <ul className="list-group text-center">
                                            <li className="list-group-item text-success"><i className="fa fa-check"></i> Requests: Unlimited</li>
                                        </ul>
                                        <div className="panel-footer" style={{textAlign: "center"}}>
                                            <div className="row">
                                                <div className="col-lg-12 col-md-6 col-sm-6 col-xs-12">{buttonForMars}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="row-fluid">
                        <div className="col-xs-12 card">
                            {content}
                        </div>
                    </div>
                );
            }
        });
        ReactDOM.render(<SubscriptionSelection/>, document.getElementById("SubscriptionSelection"));

        var Invoices = React.createClass({
            getInitialState: function(){
                return {
                    loading: false,
                    invoices: []
                };
            },
            componentDidMount: function(){
                var target = this;
                    target.setState({loading: true});

                Synchronise.Cloud.run("listOfInvoicesForUser", {}, {
                    success: function(data){
                        target.setState({invoices: data});
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({loading: false});
                    }
                });
            },
            render: function(){
                var content = <Loader/>;

                if(!this.state.loading){
                    var invoices = "";

                    if(!this.state.invoices.length){
                        invoices = (
                            <tbody>
                                <tr style={{textAlign: "center"}}>
                                    <td colSpan="4">No invoices</td>
                                </tr>
                            </tbody>
                        );
                    }

                    if(this.state.invoices.length){
                        invoices = (
                            <tbody>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Period Start</th>
                                    <th>Period End</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                                {this.state.invoices.map(function(row){
                                    var paidLabel = "unpaid";
                                    if(row.paid){
                                        paidLabel = "paid";
                                    }

                                    var classForInvoice = "warning";
                                    if(row.paid){
                                        classForInvoice = "success"
                                    }

                                    return (
                                        <tr key={"invoice"+row.id} className={classForInvoice}>
                                            <td>{row.id}</td>
                                            <td>{new Date(row.date*1000).toUTCString()}</td>
                                            <td>{new Date(row.period_start*1000).toUTCString()}</td>
                                            <td>{new Date(row.period_end*1000).toUTCString()}</td>
                                            <td>${row.amount_due}</td>
                                            <td>{paidLabel}</td>
                                            <td><a target="_blank" href={"/billing/invoice?id="+row.id} className="btn btn-primary">Open</a></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        );
                    }

                    content = (
                        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 table-responsive">
                            <table className="table table-striped table-bordered">
                                {invoices}
                            </table>
                        </div>
                    );
                }

                return content;
            }
        });
        ReactDOM.render(<Invoices/>, document.getElementById("Invoices"));

        // Displays the list of cards stored on the users account
        var CardsList = React.createClass({
            getInitialState: function(){
                return {
                    loading: true,
                    cards: []
                };
            },
            componentDidMount: function(){
                var target = this;

                target.setState({loading: true});

                Synchronise.Cloud.run("getCardsListForUser", {realtime: true}, {
                    success: function(cards){
                        target.setState({cards: cards});
                    },
                    always: function(){
                        target.setState({loading: false});
                    }
                });

                if(urlH.getParam("openCardForm")){
                    $("#collapseCardForm").collapse('show');
                }
            },
            render: function(){
                // Still loading
                var content = (
                    <table className="table table-striped table-bordered table-condensed">
                        <tbody>
                            <tr style={{textAlign: "center"}}>
                                <td colSpan="6"><Loader/></td>
                            </tr>
                        </tbody>
                    </table>
                );

                // Cards found and not loading anymore
                if(!this.state.loading && this.state.cards.length){
                    content = (
                        <table className="table table-striped table-bordered">
                            <tbody>
                                <tr>
                                    <th> </th>
                                    <th>First name</th>
                                    <th>Surname</th>
                                    <th>Company</th>
                                    <th>Expiry date</th>
                                </tr>
                                {this.state.cards.map(function(card){
                                    return <CardListItem key={"card"+card.id}
                                                         id={card.id}
                                                         type={card.card_type}
                                                         last4={card.last4}
                                                         firstname={card.firstname}
                                                         surname={card.surname}
                                                         expiry_month={card.expiry_month}
                                                         company={card.company}
                                                         expiry_year={card.expiry_year}
                                                         isDefault={card.isDefault}/>;
                                })}
                            </tbody>
                        </table>
                    );
                }else if(!this.state.loading && !this.state.cards.length){ // No cards saved in the system
                    content = (
                        <table className="table table-striped table-bordered table-condensed">
                            <tbody>
                                <tr style={{textAlign: "center"}}>
                                    <td colSpan="6">No cards saved</td>
                                </tr>
                            </tbody>
                        </table>
                    );
                }

                return content;
            }
        });

        // Displays an alert if the user has not linked a card
        var CardStoreAlert = React.createClass({
            getInitialState: function(){
                return {
                    cards:[],
                    loading: true
                };
            },
            componentDidMount: function(){
                var target = this;
                Synchronise.Cloud.run("getCardsListForUser", {realtime: true}, {
                    success: function(cards){
                        target.setState({cards: cards});
                    },
                    always: function(){
                        target.setState({
                            loading: false
                        });
                    }
                });
            },
            render: function(){
                var content = <div></div>;

                if(!this.state.cards.length && !this.state.loading){
                    content = (
                        <div className="col-xs-12">
                            <div className="alert alert-info" role="alert">Save your card now to avoid any disruption of your service.</div>
                        </div>
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
            getInitialState: function(){
                return {
                    isSettingAsDefault : false,
                    removing           : false
                };
            },
            changeDefaultCard: function(event){
                event.preventDefault();

                var target = this;
                    target.setState({isSettingAsDefault: true});

                Synchronise.Cloud.run("setDefaultCard", {id_card: this.props.id}, {
                    always: function(){
                        target.setState({isSettingAsDefault: false});
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    }
                });
            },
            deleteCard: function(event){
                event.preventDefault();

                var target = this;

                if(!target.state.removing){
                    target.setState({removing:true});
                    Synchronise.Cloud.run("deleteCard", {id_card:this.props.id}, {
                        always: function(){
                            target.setState({removing: false});
                        },
                        error: function(err){
                            new ModalErrorParse(err);
                        }
                    });
                }
            },
            render: function(){
                var isDefault = (<a alt="Set card as default" onClick={this.changeDefaultCard}>Set as default</a>);
                if(this.props.isDefault){
                    isDefault = (<span className='label label-primary'>Default</span>);
                }

                var isSettingAsDefault = "";
                if(this.state.isSettingAsDefault){
                    isSettingAsDefault = "Saving...";
                }

                var deleteButton = (<td></td>);
                if(!this.props.isDefault){
                    if(this.state.removing){
                        deleteButton = (<td><button className="btn btn-default btn-xs">Deleting...</button></td>);
                    }else{
                        deleteButton = (<td><button className="btn btn-default btn-xs" onClick={this.deleteCard}>Delete</button></td>);
                    }
                }

                return (
                    <tr>
                        <td><img src={"https://images.synchronise.io/cards/"+this.props.type+".png"} alt={this.props.type}/> ({this.props.last4}) {isDefault} {isSettingAsDefault}</td>
                        <td>{this.props.firstname}</td>
                        <td>{this.props.surname}</td>
                        <td>{this.props.company}</td>
                        <td>{this.props.expiry_month+"/"+this.props.expiry_year}</td>
                        {deleteButton}
                    </tr>
                );
            }
        });

        ReactDOM.render(<CardsList/>, document.getElementById("CardList"));
        ReactDOM.render(<CardStoreAlert/>, document.getElementById("CardStoreAlert"));
    });

    dependenciesLoader(["$", "React", "_", "Stripe", "Loader"], function(){
        // Displays a form to add a new card
        var CardForm = React.createClass({
            getInitialState: function(){
                return {
                    saving       : false,
                    first_name   : "",
                    surname      : "",
                    card_number  : "",
                    card_expiry  : {
                        month : "",
                        year  : ""
                    },
                    card_expiry_field_value: "",
                    card_cvc     : "",
                    company      : ""
                };
            },
            componentDidMount: function(){
                $('#collapseCardForm').on('shown.bs.collapse', function () {
                    $('#collapseCardForm input').first().focus();
                })
            },
            submit: function(event){
                event.preventDefault();
                if(!this.state.saving){
                    var target = this;

                    if($.payment.validateCardNumber(target.state.card_number) &&
                       $.payment.validateCardExpiry(target.state.card_expiry.month, target.state.card_expiry.year) &&
                       $.payment.validateCardCVC(target.state.card_cvc, $.payment.cardType(target.state.card_number))){

                        target.setState({saving: true});

                        Stripe.card.createToken({
                            number    : target.state.card_number,
                            cvc       : target.state.card_cvc,
                            exp_month : target.state.card_expiry.month,
                            exp_year  : target.state.card_expiry.year
                        }, function(status, token){
                            if(status){
                                Synchronise.Cloud.run("saveCardInfo", {
                                    token      : token.id,
                                    firstname : target.state.first_name,
                                    surname    : target.state.surname,
                                    company    : target.state.company,
                                    type       : $.payment.cardType(target.state.card_number),
                                    exp_month  : target.state.card_expiry.month,
                                    exp_year   : target.state.card_expiry.year
                                }, {
                                    success: function(){
                                        target.setState({
                                            first_name  : "",
                                            surname     : "",
                                            card_number : "",
                                            card_expiry : {
                                                month : "",
                                                year  : ""
                                            },
                                            card_expiry_field_value: "",
                                            card_cvc    : "",
                                            company     : ""
                                        });

                                        $('#collapseCardForm').collapse('hide');
                                        fbq('track', 'AddPaymentInfo');
                                    },
                                    error: function(err){
                                        new ModalErrorParse(err);
                                    },
                                    always: function(){
                                        target.setState({saving: false});
                                    }
                                });
                            }else{
                                new ModalErrorParse("An error occured while trying to process your card");
                            }
                        });
                    }
                }
            },
            handleCompanyName: function(event){
                var target = this;
                    target.setState({company: event.target.value});
            },
            handleFirstName: function(event){
                var target = this;
                    target.setState({first_name: event.target.value});
            },
            handleSurname: function(event){
                var target = this;
                    target.setState({surname: event.target.value});
            },
            handleCardNumber: function(event){
                $('[data-numeric]').payment('restrictNumeric');
                $('input.cc-num').payment('formatCardNumber');

                var target = this;
                    target.setState({card_number: event.target.value});
            },
            handleCardExpiry: function(event){
                $('[data-numeric]').payment('restrictNumeric');
                $('input.cc-exp').payment('formatCardExpiry');

                var target = this;
                    target.setState({card_expiry_field_value: event.target.value});

                var expiry = $.payment.cardExpiryVal(event.target.value);

                var month = "";
                var year  = "";

                if(!isNaN(expiry["month"])){
                    month = expiry["month"];
                }

                if(!isNaN(expiry["year"])){
                    year = expiry["year"];
                }

                target.setState({card_expiry: {
                    month : month,
                    year  : year
                }});
            },
            handleCardCVC: function(event){
                var target = this;
                    target.setState({card_cvc: event.target.value});

                $('input.cc-cvc').payment('formatCardCVC');
            },
            render: function(){
                var identifiedForm      = "";
                var identifiedFirstName = "";
                var identifiedSurname   = "";
                var identifiedCardNum   = "";
                var identifiedCardExp   = "";
                var identifiedCardCVC   = "";
                var identifiedCompany   = "";

                if(this.state.company.length){
                    identifiedCompany = "identified";
                }

                if(this.state.first_name.length){
                    identifiedFirstName = "identified";
                }

                if(this.state.surname.length){
                    identifiedSurname = "identified";
                }

                if($.payment.validateCardNumber(this.state.card_number)){
                    identifiedCardNum = "identified";
                }

                if($.payment.validateCardExpiry(this.state.card_expiry.month, this.state.card_expiry.year)){
                    identifiedCardExp = "identified";
                }

                if($.payment.validateCardCVC(this.state.card_cvc, $.payment.cardType(this.state.card_number))){
                    identifiedCardCVC = "identified";
                }

                if($.payment.validateCardNumber(this.state.card_number) &&
                   $.payment.validateCardExpiry(this.state.card_expiry.month, this.state.card_expiry.year) &&
                   $.payment.validateCardCVC(this.state.card_cvc, $.payment.cardType(this.state.card_number))){
                    identifiedForm = "identified";
                    identifiedCompany   = "";
                    identifiedFirstName = "";
                    identifiedSurname   = "";
                    identifiedCardNum   = "";
                    identifiedCardExp   = "";
                    identifiedCardCVC   = "";
                }

                var labelSubmitButton = "Save card";
                var messageWhileSaving = "";
                if(this.state.saving){
                    labelSubmitButton = "Saving...";
                    messageWhileSaving = (<p>Please be patient, this can take a while</p>);
                }

                return (
                    <form acceptCharset="UTF-8"
                          className={"simple_form cardInfo well "+identifiedForm}
                          action="#"
                          id="payment-form">

                        <i className="fa fa-lock secureIcon"></i>

                        <fieldset className="cardInfo__personalDetails">
                            <div className="input string required cardInfo_companyname form-row">
                                <label className="string required" htmlFor="cardInfo_firstname">Company</label>
                                <input aria-required="true"
                                       className={"string required form-control paymentInput " + identifiedCompany}
                                       id="cardInfo_company"
                                       maxLength="60"
                                       name="cardInfo[company]"
                                       placeholder="Company LTD"
                                       size="60"
                                       type="text"
                                       value={this.state.company}
                                       onChange={this.handleCompanyName}/>
                            </div>

                            <div className="input string required cardInfo_firstname form-row">
                                <label className="string required" htmlFor="cardInfo_firstname">First Name</label>
                                <input aria-required="true"
                                       className={"string required form-control paymentInput " + identifiedFirstName}
                                       id="cardInfo_firstname"
                                       maxLength="60"
                                       name="cardInfo[firstname]"
                                       placeholder="e.g. Joe"
                                       required="required"
                                       size="60"
                                       type="text"
                                       value={this.state.first_name}
                                       onChange={this.handleFirstName}/>
                            </div>

                            <div className="input string required cardInfo_surname form-row">
                                <label className="string required"
                                       htmlFor="cardInfo_surname">Surname</label>
                                <input aria-required="true"
                                       className={"string required form-control paymentInput " + identifiedSurname}
                                       id="cardInfo_surname"
                                       maxLength="60"
                                       name="cardInfo[surname]"
                                       placeholder="e.g. Bloggs"
                                       required="required"
                                       size="60"
                                       type="text"
                                       value={this.state.surname}
                                       onChange={this.handleSurname}/>
                            </div>
                        </fieldset>

                        <fieldset className="cardInfo__cardDetails">
                            <span className="payment-errors"></span>

                            <div className="form-row cardInfo__cc-num">
                                <label htmlFor="cc-num">
                                    <span>Card Number</span>
                                </label>

                                <div className="cc-num__wrap">
                                    <input id="cc-num"
                                           type="tel"
                                           className={"paymentInput cc-num unknown form-control " + identifiedCardNum}
                                           placeholder="•••• •••• •••• ••••"
                                           autocompletetype="cc-number"
                                           required="required"
                                           value={this.state.card_number}
                                           onChange={this.handleCardNumber}/>
                                       <span className="cardimage" aria-hidden="true"></span>
                                </div>
                            </div>

                            <div className="row">
                                <div className="form-row cardInfo__cc-exp input col-lg-6 col-md-6 col-sm-6 col-xs-6">
                                    <label htmlFor="cc-exp">
                                        <span>Expires</span>
                                    </label>
                                    <input id="cc-exp"
                                           type="tel"
                                           className={"paymentInput cc-exp cc-exp__demo form-control " + identifiedCardExp}
                                           placeholder="MM / YY"
                                           size="10"
                                           autocompletetype="cc-exp"
                                           required="required"
                                           value={this.state.card_expiry_field_value}
                                           onChange={this.handleCardExpiry}/>
                                </div>

                                <div className="form-row cardInfo__cc-cvc input col-lg-6 col-md-6 col-sm-6 col-xs-6">
                                    <label htmlFor="cc-cvc">
                                        <span>CVC</span>
                                    </label>
                                    <input id="cc-cvc"
                                           type="tel"
                                           className={"paymentInput cc-cvc cc-cvc__demo form-control " +identifiedCardCVC}
                                           placeholder="CVC"
                                           autocompletetype="cc-cvc"
                                           required="required"
                                           value={this.state.card_cvc}
                                           onChange={this.handleCardCVC}/>
                                </div>
                            </div>

                            <div className="cardInfo__submission col-lg-12 col-md-12 col-sm-12 col-xs-12" style={{textAlign: "center"}}>
                                <button className="btn btn-primary" onClick={this.submit}>{labelSubmitButton}</button>
                                {messageWhileSaving}
                            </div>
                        </fieldset>
                    </form>
                );
            }
        });

        ReactDOM.render(<CardForm/>, document.getElementById("CardForm"));

        // Displays a form to add a coupon code
        var CouponCodeForm = React.createClass({
            getInitialState: function(){
                return {
                    coupon: "",
                    saving: false
                };
            },
            couponChanged: function(event){
                var target = this;
                    target.setState({coupon: event.target.value});
            },
            applyCoupon: function(){
                var target = this;
                if(!target.state.saving && this.state.coupon.length){
                    target.setState({saving: true});

                    Synchronise.Cloud.run("applyCoupon", {coupon: this.state.coupon}, {
                        success: function(){
                            var modal = new Modal();
                                modal.title("Coupon");
                                modal.content("Your coupon has been applied successfully.");
                                modal.footer("", true);
                                modal.show();
                        },
                        error: function(err){
                            new ModalErrorParse(err);
                        },
                        always: function(){
                            target.setState({saving: false, coupon: ""});
                        }
                    });
                }
            },
            render: function(){
                var labelForButton = "Add coupon";
                if(this.state.saving){
                    labelForButton = "Saving...";
                }

                return (
                    <div style={{textAlign: "center"}}>
                        <div className="col-xs-12 col-sm-8 col-md-6 col-sm-offset-2 col-md-offset-3">
                            <input type="text" className="form-control" value={this.state.coupon} onChange={this.couponChanged}/>
                            <button className="btn btn-primary" style={{marginTop: "10px"}} onClick={this.applyCoupon}>{labelForButton}</button>
                        </div>
                    </div>
                );
            }
        });

        ReactDOM.render(<CouponCodeForm/>, document.getElementById("CouponCodeForm"));
    });
}());
