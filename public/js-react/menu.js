var displayGetFreeRequestsModal;
(function(){
    dependenciesLoader(["React", "ReactDOM", "Synchronise", "$", "urlH" ,"md5"], function(){
        var referralLink = "https://www.synchronise.io/";
        if(Synchronise.User.current()){
            referralLink+= '?referral='+Synchronise.User.current().id;
        }

        // Display the "Get Free Requests" modal
        function displayGetFreeRequests(callbackWhenLoaded){
            referralLink = "https://www.synchronise.io/?referral="+Synchronise.User.current().id;
            var modal = new Modal();
                modal.title("Free requests");
                var string = "<div class='col-lg-6'><legend>Invite your friends <img src='/images/emojiFriend.png' style='height: 20px;'/></legend><h4 style='text-align:center'>10,000 requests</h4>Get <b>10,000</b> requests everytime a friends signup. There is no limit on the amount of friend you can invite.<div style='text-align:center; margin-top: 10px'><a class='btn btn-block btn-social shareOnMessenger' style='background: white; box-shadow: none; border: 1px solid darkgray'><span class='fa'><img src='/images/messenger.png' style='width: 30px; height: 30px'/></span> Send via Messenger</a><a href='https://twitter.com/intent/tweet?text=Stop reinventing the wheel! Reusable cloud components are there.&url=" + referralLink + "&hashtags=cloud,app&via=synchroniseio' class='btn btn-block btn-social btn-twitter' style='border: 0px; box-shadow: none;'><span class='fa fa-twitter'></span> Post a Tweet</a><input type='text' class='form-control' value='" + referralLink + "'></div></div>";
                    string+= "<div class='col-lg-6'><legend>Add a payment method <img src='/images/emojiPaymentMethod.png' style='width: 25px'/></legend><h4 style='text-align:center'>20,000 requests</h4>Add a payment method and we'll give you an extra <b>20,000</b> requests and you <b>won't</b> be charged, ever, until you decide to switch to a payed plan. <br/><br/>Why? When you save a payment method you give us a strong sign that you believe in our platform and that means a lot to us. This is our way of saying thank you for your support. <div style='text-align:center; margin-top: 10px'><a class='btn btn-primary' href='/billing?tab=paymentMethods'>Add payment method</a></div></div>";

                modal.content(string);
                modal.show();
            callbackWhenLoaded();
        }

        displayGetFreeRequestsModal = displayGetFreeRequests;

        $(document).on('click', '.shareOnMessenger', function(){
            FB.ui({
                method: 'send',
                link: referralLink,
            });
        });

        ///// TOP MENU /////
        // Displays a modal to login or signup the user
        var LoginSignupModal = React.createClass({
            displayName: "LoginSignupModal",
            getInitialState: function(){
                return {
                    email          : "",
                    password       : "",
                    name           : "",
                    emailValid     : false,
                    passwordValid  : false,
                    nameValid      : false,

                    isCheckingForm : false,
                    recoveringPassword: false,
                    errorMessage   : "",
                    actionToDo     : "",
                    isLoging       : false,
                    isSigning      : false
                };
            },
            onInputChange: function(fieldName, event){
                var data = {};
                    data[fieldName] = event.target.value;

                switch(fieldName){
                    case "email":{
                        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            		    data.emailValid = re.test(event.target.value);
                    }
                        break;

                    case "password":
                        data.passwordValid = (event.target.value.length>6);
                        break;

                    case "name":
                        data.nameValid = (event.target.value.length>0);
                        break;
                }

                this.setState(data);
            },
            onKeyPress: function(e){
                var key = e.which || e.keyCode;

                var canSubmit = false;
                if(this.state.emailValid && this.state.password){
                    canSubmit = true;
                }

                if(canSubmit && key == 13){
                    this.submitForm(e);
                }
            },
            signup: function(){
                var target = this;
                if(this.state.actionToDo == "signup" &&
                   this.state.emailValid             &&
                   this.state.passwordValid          &&
                   this.state.nameValid              &&
                   !this.state.isSigning){
                        target.setState({isSigning: true, actionToDo: "login"});

                        Synchronise.Cloud.run('signup', {
                            email    : this.state.email,
                            password : this.state.password,
                            name     : this.state.name
                        }, {
                            success: function(result) {
                                mixpanel.track("signedUpManual");
                                target.login();
                                fbq('track', 'CompleteRegistration');
                            },
                            error: function(error) {
                                target.setState({errorMessage: error.message});
                            },
                            always: function(){
                                target.setState({isSigning: false});
                            }
                        });
                }
            },
            login: function(){
                var target = this;

                if(!target.state.isLoging            &&
                    this.state.actionToDo == "login" &&
                    this.state.emailValid            &&
                    this.state.passwordValid){

                    this.setState({isLoging: true});

                    Synchronise.User.logIn(target.state.email, target.state.password, {
        	            success: function(data){
                            mixpanel.track("loggedInManual");
                            // Animate the connection
                            $('html, body').animate({
                                opacity: 0
                            }, 300);

                            $('html, body').addClass('scaleOut');

        	                if(urlH.getParam('backuri')){
        	                    window.location.href = decodeURIComponent('/'+urlH.getParam('backuri'));
        	                }else{
        	                    window.location.href = '/dashboard';
        	                }
        	            },
        	            error: function(error){
        	                target.props.modal.shake();
                            target.setState({isLoging: false});
        	            }
        	        });
                }
            },
            submitForm: function(event){
                var target = this;

                event.preventDefault();

                if(!this.state.isCheckingForm && this.state.emailValid){
                    this.setState({isCheckingForm: true, errorMessage: ""});

                    Synchronise.Cloud.run('shouldLoginOrSignup', {email:this.state.email}, {
        			    success: function(result) {
                            target.setState({actionToDo: result.status});

        			        if(result.status == 'login'){
        			        	target.login();
        			        }else if(result.status == 'signup'){
        			            if(target.state.nameValid){
        			            	target.signup();
        			            }
        			        }else{
        			        	target.setState({errorMessage: "An error occured. Please try again!"});
        			        }
        			    },
        			    error: function(error) {
        			        target.setState({errorMessage: error.error});
        			    },
                        always: function(){
                            target.setState({isCheckingForm: false});
                        }
    			    });
                }
            },
            forgottenPassword: function(){
                var target = this;

                if(!target.state.recoveringPassword){
                    if(!target.state.emailValid){
                        $(ReactDOM.findDOMNode(target)).find('#loginSignupEmail').focus();
                        $(ReactDOM.findDOMNode(target)).find('#loginSignupEmail').effect("shake");
                    }else{
                        target.setState({recoveringPassword: true});
                        Synchronise.Cloud.run("recoverPassword", {email: target.state.email}, {
                            success: function(){
                                target.setState({successMessage: "An email with further instructions has been sent to you"});
                            },
                            error: function(err){
                                target.setState({errorMessage: err});
                            },
                            always: function(){
                                target.setState({recoveringPassword: false});
                            }
                        });
                    }
                }
            },
            render: function(){
                var target = this;

                var classButton = "fa-plane";
                if(this.state.isCheckingForm || this.state.isLoging){
                    classButton = "fa-cog fa-spin";
                }

                var errorBanner = "";
                if(this.state.errorMessage){
                    errorBanner = (<div className="alert alert-danger" role="alert">{this.state.errorMessage}</div>);
                }

                var successBanner = "";
                if(this.state.successMessage){
                    successBanner = (<div className="alert alert-success" role="alert">{this.state.successMessage}</div>);
                }

                var classForEmail = "";
                if(this.state.email.length && !this.state.emailValid){
                    classForEmail = "has-error";
                }else if (this.state.email.length && this.state.emailValid) {
                    classForEmail = "has-success";
                }

                var classForPassword = "";
                if(this.state.password.length && !this.state.passwordValid){
                    classForPassword = "has-error";
                }else if (this.state.password.length && this.state.passwordValid) {
                    classForPassword = "has-success";
                }

                var classForName = "";
                if(this.state.name.length && !this.state.nameValid){
                    classForName = "has-error";
                }else if (this.state.name.length && this.state.nameValid) {
                    classForName = "has-success";
                }

                var contentName = "";
                if(this.state.actionToDo == "signup"){
                    contentName = (
                        <div className={"form-group " + classForName}>
                            <label htmlFor="loginSignupName">Name</label>
                            <input id="loginSignupName"
                                   type="text"
                                   className="form-control"
                                   placeholder="We would love to know your name"
                                   tabIndex="3"
                                   value={this.state.name}
                                   onKeyPress={target.onKeyPress}
                                   onChange={this.onInputChange.bind(null, "name")}/>
                        </div>
                    );
                }

                var labelForRecoverPassword = "Forgot password?";
                if(this.state.recoveringPassword){
                    labelForRecoverPassword = "Recovering...";
                }

                return (
                    <div className="row-fluid">
                        {errorBanner}
                		{successBanner}
                		<form role="form" action="#">
                			<div className={"form-group " + classForEmail}>
                				<label htmlFor="loginSignupEmail">Email</label>
                				<input id="loginSignupEmail"
                                       type="email"
                                       className="form-control"
                                       placeholder="Email address"
                                       tabIndex="1"
                                       value={target.state.email}
                                       onKeyPress={target.onKeyPress}
                                       onChange={target.onInputChange.bind(null, "email")}/>
                			</div>

                			<div className={"form-group " + classForPassword}>
                				<label htmlFor="loginSignupPassword">Password</label>
                				<input id="loginSignupPassword"
                                       type="password"
                                       className="form-control"
                                       placeholder="Password"
                                       tabIndex="2"
                                       value={target.state.password}
                                       onKeyPress={target.onKeyPress}
                                       onChange={target.onInputChange.bind(null, "password")}/>
                				<span className="help-block"><span>6 characters min</span><a href="#" className="pull-right" id="recoverPassword"></a></span>
                			</div>

                            <div style={{textAlign:"right", display: "none"}}>
                                <a onClick={this.forgottenPassword}>{labelForRecoverPassword}</a>
                            </div>

                			{contentName}

                			<div style={{textAlign: "center"}}>
                				<a className="btn btn-default btn-social"
                                   type="submit"
                                   tabIndex="4"
                                   onClick={target.submitForm}>Login/Signup</a>
                			</div>
                		</form>
                	</div>
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
            getInitialState: function(){
                return {
                    loaded:false
                };
            },
            componentDidMount: function(){
                var target = this;
                Synchronise.User.fetchCurrent(function(user){
                    target.setState({loaded: true});
                });
            },
            render: function(){
                var content = "";

                if(this.state.loaded){
                    if(Synchronise.User.current()){
                        content = <NavBarRightConnected/>;
                    }else{
                        content = <NavBarRightOffline/>;
                    }
                }

                return (
                    <div>
                        {content}
                    </div>);
            }
        });

        // Displays the login/signup button
        var NavBarRightOffline = React.createClass({
            displayName: "NavBarRightOffline",
            getInitialState: function(){
                return {
                    modalDisplayed: false,
                    modal         : ""
                };
            },
            toggleModal: function(event){
                if(event){
                    event.preventDefault();
                }

                if(this.state.modalDisplayed){
                    this.state.modal.hide();
                }else{
                    this.state.modal.show();
                    mixpanel.track("loginModalShown");
                }

                this.setState({modalDisplayed: !this.state.modalDisplayed});
            },
            modalClosed: function(){
                this.setState({modalDisplayed: false});
            },
            componentDidMount: function(){
                var target = this;

                Mousetrap.bind('mod+l', function(e) {
    		    	if(typeof(user) == "undefined"){
    			    	e.preventDefault();
    			        target.toggleModal(e);
    		        }
    		    });

                var modal = new Modal('globalModal');
        		    modal.title('One click away from amazingness');
        		    modal.footer('', false); // No special content but displays the close button
                    modal.didDisappear(function(){
                        target.modalClosed();
                    });

                this.setState({modal: modal});

                // The user has tried to access a restricted area and was not logged-in
                // We display the login modal immediatly
                if(typeof(urlH.getParam('display')) != "undefined"){
    	            if(urlH.getParam('display') == "login"){
    	                modal.show();
                        this.setState({modalDisplayed: true});
    	            }
    	        }

                modal.didAppear(function(){
                    $("#globalModal").find("input")[0].focus();
                });

                ReactDOM.render(<LoginSignupModal modal={modal} modalDidClose={this.modalClosed}/>, document.getElementById('globalModal').getElementsByClassName('modal-body')[0]);

                $('.loginSignupButton').click(function(){
                    target.toggleModal();
                });
            },
            isMacintosh: function(){
                return navigator.platform.indexOf('Mac') > -1;
            },
            isWindows: function(){
                return navigator.platform.indexOf('Win') > -1;
            },
            render: function(){
                var shortcut = "";

                if(this.isMacintosh()){
                    shortcut = (<span>(Cmd+l)</span>);
                }

                if(this.isWindows()){
                    shortcut = (<span>(Ctrl+l)</span>);
                }

                var content = "";
                if(document.location.pathname != "/" && document.location.pathname != ""){
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
                    content = (
                        <div>
                            <ul className="nav navbar-nav navbar-right">
                                <li className="hidden-xs" style={{borderLeft: "1px solid white"}}>
                                    <a href="#"
                                       onClick={this.toggleModal}><u>L</u>ogin/Signup {shortcut}</a>
                                </li>

                                <li className="visible-xs">
                                    <a href="#"
                                       onClick={this.toggleModal}><u>L</u>ogin/Signup {shortcut}</a>
                                </li>
                            </ul>
                        </div>
                    );
                }else{
                    content = (
                        <ul className="nav navbar-nav navbar-right">
                            <li className="active"><a href="#home">Home</a></li>
                            <li><a href="#product">Product</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                            <li><a href="/marketplace">Market Place</a></li>
                            <li><a href="/docs">Docs</a></li>
                            <li><a href="/help">Help</a></li>

                            <li className="hidden-xs">
                                <a href="#"
                                   onClick={this.toggleModal}><u>L</u>ogin/Signup</a>
                            </li>

                            <li className="visible-xs">
                                <a href="#"
                                   onClick={this.toggleModal}><u>L</u>ogin/Signup</a>
                            </li>
                        </ul>
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
            getInitialState: function(){
                return {
                    unreadNotifications: {
                        "account"  : 0,
                        "settings" : 0,
                        "billing"  : 0
                    },
                    shortcuts : []
                };
            },
            logout: function(){
                Synchronise.User.logOut();
                modalMessage.show('See you soon');
                window.location.href="/logout";
            },
            componentDidMount: function(){
                var target = this;
                $('[data-toggle=tooltip]').tooltip();

                Synchronise.Cloud.run("unreadNotification", {realtime: true, cacheFirst: true}, {
                    success: function(data){
                        var account = _.reduce(data, function(prev, row){
                            if(row.type == "account"){
                                return prev+row.quantity;
                            }else{
                                return prev+0;
                            }
                        }, 0);

                        var settings = _.reduce(data, function(prev, row){
                            if(row.type == "settings"){
                                return prev+row.quantity;
                            }else{
                                return prev+0;
                            }
                        }, 0);

                        var billing = _.reduce(data, function(prev, row){
                            if(row.type == "billing"){
                                return prev+row.quantity;
                            }else{
                                return prev+0;
                            }
                        }, 0);

                        target.setState({
                            unreadNotifications: {
                                "account"  : account,
                                "settings" : settings,
                                "billing"  : billing
                            }
                        });
                    }
                });

                Synchronise.LocalStorage.get("shortcutsMenu", function(shortcuts){
                    target.setState({shortcuts: shortcuts});
                }, [], true);
            },
            addShortcut: function(){
                var target = this;
                var modal = new ModalAskInput("What name do you want to give to your shortcut?", function(name){
                    if(name){
                        var shortcuts = target.state.shortcuts;
                        var date = new Date();
                            shortcuts.push({
                                name: name,
                                link: urlH.currentUrl(),
                                id  : date.getTime()
                            });

                        Synchronise.LocalStorage.set("shortcutsMenu", shortcuts);
                    }
                });
                modal.title("Add shortcut");
            },
            render: function(){
                var notificationsBilling = (<span></span>);
                if(this.state.unreadNotifications.billing){
                    notificationsBilling = (<span className="notification">{this.state.unreadNotifications.billing}</span>);
                }

                return (
                    <ul className="nav navbar-nav navbar-right">
                        <li id="shortcuts hidden-xs">
                            <a type="button"
                               data-toggle="tooltip"
                               data-placement="bottom"
                               href="#"
                               title="Add a shortcut to this page"
                               onClick={this.addShortcut}><i className="fa fa-star" style={{color: "#D9AF02"}}></i></a>
                        </li>

                        <SubscriptionPlan/>
                        <FreeTierProgress/>

                        <li className="dropdown">
                            <MenuUserLabel />
                            <ul className="dropdown-menu" role="menu">
                                <li><a href="/billing?tab=bills">Invoices</a></li>
                                <li><a href="/billing?tab=planTab">Subscription</a></li>
                                <li><a href="/billing?tab=paymentMethods">Payment methods {notificationsBilling}</a></li>
                                <li className="divider"></li>
                                <li><a onClick={this.logout} className="logout">Logout</a></li>
                            </ul>
                        </li>
                    </ul>
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
            getInitialState: function(){
                var username = "";
                if(Synchronise.User.current()){
                    if(Synchronise.User.current().isAdmin()){
                        username = Synchronise.User.current().name + " (Admin)";
                    }else {
                        username = Synchronise.User.current().name;
                    }
                }

                return {
                    username: username,
                    notifications: []
                };
            },
            componentDidMount: function(){
                var target = this;
                Synchronise.Cloud.run("unreadNotification", {realtime: true, cacheFirst: true}, {
                    success: function(data){
                        target.setState({
                            notifications: data
                        });
                    }
                });
            },
            render: function(){
                var notifications = (<span></span>);

                if(this.state.notifications.length){
                    notifications = (<span className="notification">{this.state.notifications.length}</span>);
                }

                var avatarUser = "";
                if(Synchronise.User.current().avatar){
                    avatarUser = ""
                }else{
                    avatarUser = 'https://www.gravatar.com/avatar/' + md5(Synchronise.User.current().email);
                }

                var avatarImage = "";
                if(avatarUser !== ""){
                    avatarImage = (<img src={avatarUser} style={{width: "20px", borderRadius: "100%", border: "1.5px solid white", boxShadow: "0 1px 1px rgba(0, 0, 0, .15)"}}/>);
                }

                return (
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown">{avatarImage} {this.state.username} {notifications} <span className="caret"></span></a>
                );
            }
        });

        var SubscriptionPlan = React.createClass({
            displayName: "SubscriptionPlan",
            render: function(){
                var plan = (
                    <div style={{display: "inline-block"}}>
                        <a href="/billing?tab=planTab"><img src={"/images/" + Synchronise.User.current().subscription + ".png"} alt="Plan" style={{height: "30px", width: "30px", marginTop: "0px"}}/></a>
                    </div>
                );

                var style = {lineHeight: "64px", paddingLeft: "10px", marginRight: "10px", borderLeft: "1px dotted rgba(255,255,255,0.5)"};

                if(Synchronise.User.current().subscription != "earth"){
                    style.borderRight = "1px dotted rgba(255,255,255,0.5)";
                    style.paddingRight = "10px";
                }

                return (
                    <li style={style} className="hidden-xs"><div style={{display: "inline-block"}}><small style={{color: "white"}}>Plan</small></div> {plan}</li>
                );
            }
        });

        var FreeTierProgress = React.createClass({
            displayName: "FreeTierProgress",
            getInitialState: function(){
                return {
                    loadingReferralModal: false
                };
            },
            getFreeRequests: function(){
                var target = this;
                    target.setState({loadingReferralModal: true});
                displayGetFreeRequests(function(){
                    target.setState({loadingReferralModal: false});
                });
            },
            render: function(){
                var plan = Synchronise.User.current().subscription;
                var content = (<span></span>);
                var progress = "";

                var requests_allowed = 10000+parseInt(Synchronise.User.current().bonus_requests);
                var requests_left    = requests_allowed-parseInt(Synchronise.User.current().requests_executed);
                var percentageLeft   = Math.min((requests_left/requests_allowed)*100, 100);

                if(requests_left/1000>=1){
                    requests_left = Math.round(requests_left/1000)+"K";
                }

                var freeRequestButtonLabel = "Free requests";
                if(this.state.loadingReferralModal){
                    freeRequestButtonLabel = "Loading...";
                }

                if(plan == "earth"){
                    if(requests_left){
                        progress = (
                            <div className="progress" style={{marginBottom: "0px", width: "50px", display: "inline-block", lineHeight: "32px", marginRight: "10px"}}>
                                <div className="progress-bar progress-bar-warning" role="progressbar" aria-valuenow={percentageLeft} aria-valuemin="0" aria-valuemax="100" style={{width: percentageLeft+"%", borderRadius: "0"}}></div>
                            </div>
                        );

                        content = (
                            <li className="hidden-xs" style={{lineHeight: "64px", borderRight: "1px dotted rgba(255,255,255,0.5)"}}>
                                <div style={{position: "absolute", top: "-13px", right: "10px"}}>
                                    <button className="btn btn-xs btn-warning" style={{marginRight: "10px"}} onClick={this.getFreeRequests}>{freeRequestButtonLabel}</button>
                                </div>

                                <div style={{marginBottom:"-13px", marginTop: "13px"}}>
                                    <div style={{display: "inline-block", marginRight: "0px"}}><small style={{color: "white"}}>Requests:</small></div>
                                    <div style={{display: "inline-block", lineHeight: "32px", marginRight: "5px"}}>{requests_left}</div>{progress}
                                </div>
                            </li>
                        );

                    }else{
                        content = (<li className="hidden-xs" style={{lineHeight: "64px", borderRight: "1px dotted rgba(255,255,255,0.5)"}}><button className="btn btn-xs btn-warning" style={{marginRight: "10px"}} onClick={this.getFreeRequests}>{freeRequestButtonLabel}</button></li>);
                    }
                }

                return content;
            }
        });

        ReactDOM.render(<NavBarRight/>, document.getElementById("navBarRight"));

        // Displays a banner when the connection to the server (socket) is lost
        var ConnectionLostBanner = React.createClass({
            displayName: "ConnectionLostBanner",
            getInitialState: function(){
                return {
                    disconnected : true,
                    style: {marginTop: "-25px"}
                };
            },
            componentDidMount: function(){
                var target = this;

                Synchronise.Connection.Lost(function(reason){
                    target.setState({disconnected: true});
                });

                Synchronise.Connection.Connected(function(){
                    target.setState({
                        disconnected: false,
                        style:{marginTop: "0px"}
                    });
                });
            },
            render: function(){
                var content = (<div></div>);
                if(this.state.disconnected){
                    content = (
                        <div id="connectionLostBanner" style={this.state.style}>
                            <div className="content">Oops, sounds like we have lost the connection with the server. Reconnecting...</div>
                        </div>
                    );
                }

                return (<div>{content}</div>);
            }
        });

        ReactDOM.render(<ConnectionLostBanner/>, document.getElementById("ConnectionLostBanner"));

        // Displays the branding of Synchronise
        var HeaderBranding = React.createClass({
            displayName: "HeaderBranding",
            render: function(){
                var brand = "";
                if(!this.props.collapsed){
                    brand = (<a className="navbar-brand hidden-xs" href="/">ynchronise</a>);
                }else{
                    brand = (<a className="navbar-brand hidden-xs" href="/"></a>);
                }

                var loginSignupButton = "";
                if(!Synchronise.User.current()){
                    loginSignupButton = (<div className="visible-xs pull-left" style={{position: "absolute", top: "17px", left: "15px"}}><button className="loginSignupButton btn btn-xs btn-default">Login/Signup</button></div>);
                }

                return (
                    <div className="navbar-header">
                        <div className="hidden-xs" style={{left: "0", top: "0", position: "absolute"}}><img src="/images/synchroniseSquare.png" style={{height: "64px", marginLeft: "10px"}} /></div>
                        <div className="visible-xs" style={{left: "0", top: "0", width:"100%", position: "absolute", textAlign: "center"}}>
                            {loginSignupButton}
                            <a href="/"><img src="/images/synchroniseSquare.png" style={{height: "64px", marginLeft: "10px"}} /></a>
                        </div>
                        <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#sde-navbar-collapse">
                            <span className="sr-only">Toggle navigation</span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                        </button>
                        {brand}
                    </div>
                );
            }
        });

        // Links of the TopMenu
        var TopMenu = React.createClass({
            displayName: "TopMenu",
            getInitialState: function(){
                return { shortcuts: [] };
            },
            componentDidMount: function(){
                var target = this;

                Synchronise.LocalStorage.get("shortcutsMenu", function(shortcuts){
                    target.setState({shortcuts: shortcuts});
                }, [], true);

                $(window).resize(function(){
                    target.resizeInterface();
                });
            },
            resizeInterface: function(){
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
            render: function(){
                var target = this;

                var shortcuts = "";
                if(target.state.shortcuts.length){
                    shortcuts = <Shortcuts shortcuts={target.state.shortcuts}/>;
                }

                var content = "";
                if(Synchronise.User.current()){
                    /*
                    <li className={this.props.buttonsStates.blog}><a href="/blog">Blog</a></li>
                    */
                    content = (
                        <div>
                            <ul className="nav navbar-nav">
                                <li className={this.props.buttonsStates.dashboard}><a href="/dashboard"><u>D</u>ashboard</a></li>
                                <li className={this.props.buttonsStates.marketplace}><a href="/marketplace">Marketplace</a></li>
                                <li className={this.props.buttonsStates.docs}><a href="/docs">Docs</a></li>
                                <li className={this.props.buttonsStates.help}><a href="/help">H<u>e</u>lp</a></li>
                                <li className="changelogArea" style={{marginTop: "17px"}}></li>
                            </ul>
                            {shortcuts}
                        </div>
                    );
                }else{
                    /*
                    <li className={this.props.buttonsStates.blog}><a href="/blog">Blog</a></li>
                    */
                    content = (
                        <ul className="nav navbar-nav">
                            <li className={this.props.buttonsStates.home}><a href="/">Home</a></li>
                            <li><a href="/#product">Product</a></li>
                            <li><a href="/#pricing">Pricing</a></li>
                            <li className={this.props.buttonsStates.marketplace}><a href="/marketplace">Marketplace</a></li>
                            <li className={this.props.buttonsStates.docs}><a href="/docs">Docs</a></li>
                            <li className={this.props.buttonsStates.help}><a href="/help">H<u>e</u>lp</a></li>
                        </ul>
                    );
                }

                return content;
            }
        });

        var Shortcuts = React.createClass({
            displayName: "Shortcuts",
            componentDidMount: function(){
                var target = this;

                $("#sde-navbar-collapse .shortcut").draggable({
                    revert: true,
                    drag: function(event, object) {
                        var element = $(event.target);
                        if(object.position.top > $('#sde-navbar-collapse').height()){
                            element.addClass("willRemove");
                        }else{
                            element.removeClass("willRemove");
                        }
                    },
                    stop: function(event, object) {
                        var element = $(event.target);

                        if(object.position.top > $('#sde-navbar-collapse').height()){
                            var newArray = target.props.shortcuts;
                                newArray.splice(element.index(), 1);

                            Synchronise.LocalStorage.set("shortcutsMenu", newArray);

                            element.css({
                                opacity: 0.3
                            });
                        }else{
                            element.removeClass("willRemove");
                        }
                    }
                });
            },
            render: function(){
                var target = this;

                return (
                    <ul className="nav navbar-nav">
                        {target.props.shortcuts.map(function(row){
                            return (
                                <li className="hidden-xs shortcut draggable ui-draggable ui-draggable-handle" key={row.id}>
                                    <a href={row.link} data-id={row.id}><i className="fa fa-star"></i> {row.name}</a>
                                </li>
                            );
                        })}
                    </ul>
                );
            }
        });

        ///// SIDE MENU /////
        var Backbutton = React.createClass({
            displayName: "Backbutton",
            render: function(){
                var content = "";
                if(this.props.collapsed){
                    content = <li className="back_button"><a href={this.props.url}><i className="fa fa-chevron-left"></i></a></li>;
                }else{
                    content = <li className="back_button"><a href={this.props.url}><i className="fa fa-chevron-left"></i> {this.props.label}</a></li>;
                }
                return content;
            }
        });

        var SuperAdminBlock = React.createClass({
            displayName: "SuperAdminBlock",
            render: function(){
                var content = "";
                if(this.props.collapsed){
                    content = (
                        <li className={this.props.active} data-toggle="tooltip" data-placement="right" title="SuperAdmin" data-container="#page-wrapper">
                            <a href="/superadmin"><i className="fa fa-fw fa-cog"></i></a>
                        </li>
                    );
                }else{
                    content = (
                        <li className={this.props.active}>
                            <a href="/superadmin"><i className="fa fa-fw fa-cog"></i> SuperAdmin</a>
                        </li>
                    );
                }
                return content;
            }
        });

        var SideMenu = React.createClass({
            displayName: "SideMenu",
            getInitialState: function(){
                return {
                    collapsed: false
                };
            },
            componentDidUpdate: function(){
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
            componentDidMount: function(){
                var target = this;

                target.resizeMenu();

                $(window).resize(function(){
                    target.resizeMenu();
                });

                var user = Synchronise.User.current();
            },
            resizeMenu: function(){
                var target = this;
                var maxHeight = 0;

                if(!target.props.collapsed){
                    var windowHeight = $(window).height();
                    var navbarHeight = $('.navbar').height();
                    //var suggestionBlock = $(ReactDOM.findDOMNode(target)).find('.suggestionBlock').height();
                    var margin = 10;

                    maxHeight = windowHeight-(navbarHeight);
                }else{
                    var windowHeight = $(window).height();
                    var navbarHeight = $('.navbar').height();
                    //var suggestionBlock = 30;
                    var margin = 10;

                    maxHeight = windowHeight-(navbarHeight+40);
                }

                $(ReactDOM.findDOMNode(target)).find('.side-nav').css('maxHeight', maxHeight+'px');
            },
            collapseMenu: function(){
                var target = this;
                var newValue = !target.props.collapsed;

                Synchronise.LocalStorage.set("dashboardMenuCollapsed", newValue);

                $(ReactDOM.findDOMNode(target)).find('.collapseMenu i').attr("class", "fa fa-refresh fa-2 fa-spin");
            },
            render: function(){
                var backButton = "";
                if(urlH.getParam('backuri')){
                    backButton = <Backbutton url={decodeURIComponent(urlH.getParam('backuri'))}
                                             label={decodeURIComponent(urlH.getParam('backlabel'))}
                                             collapsed={this.props.collapsed} />;
                }

                var superAdminBlock = "";
                if(Synchronise.User.current()){
                    if(Synchronise.User.current().isAdmin()){
                        superAdminBlock = <SuperAdminBlock collapsed={this.props.collapsed}
                                                           active={this.props.buttonsStates.superadmin}/>;
                    }
                }

                var menuContent = "";
                var className = "";
                if(this.props.collapsed){
                    className = "collapsed"
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
                if(!this.props.collapsed){
                    menuContent = (
                        <ul className="nav navbar-nav side-nav">
                            {backButton}
                            <li className={this.props.buttonsStates.subdashboard}>
                                <a href="/dashboard"><i className="fa fa-fw fa-dashboard"></i> <u>D</u>ashboard</a>
                            </li>
                            <li className={this.props.buttonsStates.component}>
                                <a href="/component"><i className="fa fa-puzzle-piece"></i> C<u>o</u>mponents</a>
                            </li>
                            <li className={this.props.buttonsStates.workflow}>
                                <a href="/workflow"><i className="fa fa-random workFlowIcon"></i> Workflows</a>
                            </li>
                            <li className={this.props.buttonsStates.project}>
                                <a href="/project"><i className="fa fa fa-cubes"></i> <u>P</u>rojects</a>
                            </li>
                            {superAdminBlock}
                        </ul>
                    );
                }else{
                    menuContent = (
                        <ul className="nav navbar-nav side-nav">
                            {backButton}
                            <li className={this.props.buttonsStates.subdashboard} data-toggle="tooltip" data-placement="right" title="Dashboard" data-container="#page-wrapper">
                                <a href="/dashboard"><i className="fa fa-fw fa-dashboard"></i></a>
                            </li>
                            <li className={this.props.buttonsStates.component} data-toggle="tooltip" data-placement="right" title="Components" data-container="#page-wrapper">
                                <a href="/component"><i className="fa fa-puzzle-piece"></i></a>
                            </li>
                            <li className={this.props.buttonsStates.workflow} data-toggle="tooltip" data-placement="right" title="Workflows" data-container="#page-wrapper">
                                <a href="/workflow"><i className="fa fa-random workFlowIcon"></i></a>
                            </li>
                            <li className={this.props.buttonsStates.project} data-toggle="tooltip" data-placement="right" title="Projects" data-container="#page-wrapper">
                                <a href="/project"><i className="fa fa fa-cubes"></i></a>
                            </li>
                            {superAdminBlock}
                        </ul>
                    );
                }

                var suggestionBlock = "";
                if(!this.props.collapsed){
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

                return (
                    <div>
                        <div className={"SideMenu collapse navbar-collapse navbar-ex1-collapse hidden-xs "+className}>
                            {menuContent}
                            <div className="collapseMenu"><i className="fa fa-caret-square-o-left fa-2" onClick={this.collapseMenu}></i></div>
                            {suggestionBlock}
                        </div>

                        <div id="mobile_dashboard_side_nav" className="visible-xs">
                            <ul className="list-inline">
                                <li className={this.props.buttonsStates.subdashboard}>
                                    <a href="/dashboard"><i className="fa fa-fw fa-dashboard"></i> Dashboard</a>
                                </li>
                                <li className={this.props.buttonsStates.component}>
                                    <a href="/component"><i className="fa fa-puzzle-piece"></i> Components</a>
                                </li>
                                <li className={this.props.buttonsStates.workflow}>
                                    <a href="/workflow"><i className="fa fa-random workFlowIcon"></i> Workflows</a>
                                </li>
                                <li className={this.props.buttonsStates.project}>
                                    <a href="/project"><i className="fa fa fa-cubes"></i> Projects</a>
                                </li>
                                {superAdminBlock}
                            </ul>
                            <hr/>
                        </div>
                    </div>
                );
            }
        });

        Synchronise.LocalStorage.get("dashboardMenuCollapsed", function(collapsed){
            $('#wrapper').css('opacity', 1);

            if(collapsed){
                $("#wrapper").addClass("collapsed");
                $(".navbar").addClass("collapsed");
            }else{
                $("#wrapper").removeClass("collapsed");
                $(".navbar").removeClass("collapsed");
            }

            if(document.location.pathname != "/" && document.location.pathname != ""){
                ReactDOM.render(<HeaderBranding collapsed={collapsed}/>, document.getElementById("headerBrand"));
                ReactDOM.render(<TopMenu collapsed={collapsed}
                                         buttonsStates={navbarButtonsState}/>, document.getElementById("topMenu"));
            }

            // navbarButtonsState is only available when we are on the dashboard
            if(typeof(navbarButtonsState) != "undefined"){
                if(navbarButtonsState.dashboard == "active"){
                    ReactDOM.render(<SideMenu buttonsStates={navbarButtonsState}
                                              collapsed={collapsed}/>, document.getElementById("SideMenu"));
                }
            }else{
                if(document.location.pathname != "/" && document.location.pathname != ""){
                    ReactDOM.render(<SideMenu collapsed={collapsed}/>, document.getElementById("SideMenu"));
                }
            }
        }, false, true);
    });
}());
