(function(){
    dependenciesLoader(["React", "ReactDOM", "Synchronise", "Skype"], function(){
        ///// TOP MENU /////
        var NavBarRight = React.createClass({
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

        var NavBarRightOffline = React.createClass({
            render: function(){
                return (
                    <ul className="nav navbar-nav navbar-right">
                        <li>
                            <a href="#" id="loginSignup" className="loginSignup"><u>L</u>ogin/Signup</a>
                        </li>
                    </ul>
                );
            }
        });

        var NavBarRightConnected = React.createClass({
            componentDidMount: function(){
                $('[data-toggle=tooltip]').tooltip();
            },
            render: function(){
                return (
                    <ul className="nav navbar-nav navbar-right">
                        <li>
                            <a type="button" data-toggle="tooltip" data-placement="bottom" href="#" title="To trigger a shortcut press ctrl (cmd on mac) + the letter of the shortcut. For example ctrl + u will send you to the Query page. All the letters underscored on the interface are shortcuts you can trigger."><i className="fa fa-question-circle"></i> Shortcuts</a>
                        </li>

                        <li className="dropdown">
                            <MenuUserLabel />
                            <ul className="dropdown-menu" role="menu">
                                <li><a href="#">Account</a></li>
                                <li><a href="#">Settings</a></li>
                                <li><a href="#">Billing</a></li>
                                <li className="divider"></li>
                                <li><a href="#" className="logout">Logout</a></li>
                            </ul>
                        </li>
                    </ul>
                );
            }
        });

        var MenuUserLabel = React.createClass({
            getInitialState: function(){
                if(Synchronise.User.current().isAdmin()){
                    return { username: Synchronise.User.current().name + " (Admin)"};
                }else {
                    return { username: Synchronise.User.current().name };
                }
            },
            render: function(){
                return (
                    <a href="#" className="dropdown-toggle" data-toggle="dropdown">Welcome {this.state.username} <span className="caret"></span></a>
                );
            }
        });

        ReactDOM.render(<NavBarRight/>, document.getElementById("navBarRight"));

        // CONNECTION LOST MESSAGE
        var ConnectionLostBanner = React.createClass({
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
                            <div className="content">Oops, sounds like we have lost the connection with the server. Reconnecting ...</div>
                        </div>
                    );
                }

                return (<div>{content}</div>);
            }
        });

        ReactDOM.render(<ConnectionLostBanner/>, document.getElementById("ConnectionLostBanner"));

        ///// SIDE MENU /////
        var Backbutton = React.createClass({
            render: function(){
                return (<li className="back_button"><a href={this.props.url}><i className="fa fa-chevron-left"></i> {this.props.label}</a></li>);
            }
        });

        var SuperAdminBlock = React.createClass({
            render: function(){
                return (
                    <li className="<%= navbarButtonsState.superadmin %>">
                        <a href="/superadmin"><i className="fa fa-fw fa-cog"></i> SuperAdmin</a>
                    </li>
                );
            }
        });

        var SideMenu = React.createClass({
            componentDidMount: function(){
                var target = this;

                Skype.ui({
                  "name": "chat",
                  "element": "SkypeButton_Call_synchroniseio_1",
                  "participants": ["synchroniseio"],
                  "imageSize": 24
                });

                target.resizeMenu();

                $(window).resize(function(){
                    target.resizeMenu();
                });
            },
            resizeMenu: function(){
                var target = this;

                var windowHeight = $(window).height();
                var navbarHeight = $('.navbar').height();
                var suggestionBlock = $(ReactDOM.findDOMNode(this)).find('.suggestionBlock').height();
                var margin = 10;
                var maxHeight = windowHeight-(navbarHeight+suggestionBlock+10);

                $(ReactDOM.findDOMNode(this)).find('.side-nav').css('maxHeight', maxHeight+'px');
            },
            render: function(){
                var backButton = "";
                if(urlH.getParam('backuri')){
                    backButton = <Backbutton url={decodeURIComponent(urlH.getParam('backuri'))} label={decodeURIComponent(urlH.getParam('backlabel'))}/>;
                }

                var superAdminBlock = "";
                if(Synchronise.User.current().isAdmin()){
                    superAdminBlock = <SuperAdminBlock />;
                }

                return (
                    <div>
                        <div className="collapse navbar-collapse navbar-ex1-collapse hidden-xs">
                            <ul className="nav navbar-nav side-nav">
                                {backButton}
                                <li className={this.props.buttonsStates.subdashboard}>
                                    <a href="/dashboard"><i className="fa fa-fw fa-dashboard"></i> <u>D</u>ashboard</a>
                                </li>
                                <li className={this.props.buttonsStates.query}>
                                    <a href="/query"><i className="fa fa-fw fa-random"></i> Q<u>u</u>eries</a>
                                </li>
                                <li className={this.props.buttonsStates.project}>
                                    <a href="/project"><i className="fa fa fa-cubes"></i> <u>P</u>rojects</a>
                                </li>
                                <li className={this.props.buttonsStates.component}>
                                    <a href="/component"><i className="fa fa-puzzle-piece"></i> C<u>o</u>mponents</a>
                                </li>
                                <li className={this.props.buttonsStates.database}>
                                    <a href="/database"><i className="fa fa-fw fa-database"></i> Data<u>b</u>ases</a>
                                </li>
                                <li className={this.props.buttonsStates.analytics}>
                                    <a href="/analytics"><i className="fa fa-fw fa-line-chart"></i> <u>A</u>nalytics</a>
                                </li>
                                <li className={this.props.buttonsStates.api}>
                                    <a href="/api"><i className="fa fa-fw fa-key"></i> API <u>k</u>eys</a>
                                </li>
                                {superAdminBlock}
                            </ul>

                            <div className="suggestionBlock">
                              <div className="content">
                                    <h3>Customer feedback</h3>
                                    <h5>Have a suggestion ? Encounter an evil bug ? We want to improve that. Let us know what we can do.</h5>
                                    <div className="row">
                                        <div className="col-lg-6" style={{textAlign: "center"}}>
                                            <button className="btn btn-primary btn-xs">Feedback</button>
                                        </div>

                                        <div className="col-lg-6" style={{textAlign: "center"}}>
                                            <div id="SkypeButton_Call_synchroniseio_1" style={{textAlign: "center"}}></div>
                                        </div>
                                    </div>
                              </div>
                            </div>

                            <div id="SkypeButton_Call_synchroniseio_1" style={{textAlign: "center", position: "absolute", bottom: "40px", width: "100%"}}></div>
                        </div>

                        <div id="mobile_dashboard_side_nav" className="visible-xs">
                            <ul className="list-inline">
                                <li className={this.props.buttonsStates.subdashboard}>
                                    <a href="/dashboard"><i className="fa fa-fw fa-dashboard"></i> Dashboard</a>
                                </li>
                                <li className={this.props.buttonsStates.query}>
                                    <a href="/query"><i className="fa fa-fw fa-random"></i> Queries</a>
                                </li>
                                <li className={this.props.buttonsStates.project}>
                                    <a href="/project"><i className="fa fa fa-cubes"></i> Projects</a>
                                </li>
                                <li className={this.props.buttonsStates.component}>
                                    <a href="/component"><i className="fa fa-puzzle-piece"></i> Components</a>
                                </li>
                                <li className={this.props.buttonsStates.database}>
                                    <a href="/database"><i className="fa fa-fw fa-database"></i> Databases</a>
                                </li>
                                <li className={this.props.buttonsStates.analytics}>
                                    <a href="/analytics"><i className="fa fa-fw fa-line-chart"></i> Analytics</a>
                                </li>
                                <li className={this.props.buttonsStates.api}>
                                    <a href="/api"><i className="fa fa-fw fa-key"></i> API keys</a>
                                </li>
                                {superAdminBlock}
                            </ul>
                            <hr/>
                        </div>
                    </div>
                );
            }
        });

        // navbarButtonsState is only available when we are on the dashboard
        if(typeof(navbarButtonsState) != "undefined"){
            ReactDOM.render(<SideMenu buttonsStates={navbarButtonsState}/>, document.getElementById("SideMenu"));
        }else{
            ReactDOM.render(<SideMenu/>, document.getElementById("SideMenu"));
        }
    });
}());
