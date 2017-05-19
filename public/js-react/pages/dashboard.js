dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader"], function(){
    var Dashboard = React.createClass({
        getInitialState: function(){
            return {
                tasks: [{
                    name: "signup",
                    text: (<span><i className="fa fa-child"></i> Signup</span>),
                    status: 1,
                    link: "",
                    handIndicator: false
                }, {
                    name: "connect",
                    text: (<span><i className="fa fa-plug"></i> Integrate in your app/project</span>),
                    status: 0,
                    link: "/connect",
                    handIndicator: false
                }, {
                    name: "project",
                    text: (<span><i className="fa fa-cubes"></i> Create a Project</span>),
                    status: 0,
                    link: "/project?displayModalCreate=true",
                    handIndicator: false
                }, {
                    name: "component",
                    text: (<span><i className="fa fa-puzzle-piece"></i> Create a Component</span>),
                    status: 0,
                    link: "/component?displayModalCreate=true",
                    handIndicator: false
                }, {
                    name: "workflow",
                    text: (<span><i className="fa fa-random workFlowIcon"></i> Create a Workflow</span>),
                    status: 0,
                    link: "/workflow?displayModalCreate=true",
                    handIndicator: false
                }, {
                    name: "friend",
                    text: (<span><i className="fa fa-beer"></i> Invite a friend <span className="pull-right hidden-xs" style={{fontSize: "1em"}}>(+10K free requests)</span></span>),
                    status: 0,
                    link: "#",
                    handIndicator: false,
                    onClick: displayGetFreeRequestsModal
                }, {
                    name: "marketplace",
                    text: (<span><i className="fa fa-shopping-cart"></i> Visit the Market Place</span>),
                    status: 0,
                    link: "/marketplace",
                    handIndicator: false
                }, {
                    name: "payment",
                    text: (<span><i className="fa fa-credit-card"></i> Save a payment method <span className="pull-right hidden-xs" style={{fontSize: "1em"}}>(+20K free requests)</span></span>),
                    status: 0,
                    link: "/billing?tab=paymentMethods&openCardForm=true",
                    handIndicator: false
                }],
                currentHandIndicatorStatus: false,
                loadingComponents: false,
                lastComponents: [],
                templateForProject: {}
            };
        },
        componentDidMount: function(){
            var target = this;

            // CHECK STATUS PROJECT
            Synchronise.Cloud.run("countProject", {realtime: true, cacheFirst: true}, {
                success: function(count){
                    if(count>0){ target.setStatusForTask(1, "project"); }else{ target.setStatusForTask(0, "project"); }
                }
            });

            // CHECK STATUS COMPONENT
            Synchronise.Cloud.run("countComponent", {realtime: true, cacheFirst: true}, {
                success: function(count){
                    if(count.count>0){
                        target.setStatusForTask(1, "component");
                        Synchronise.Cloud.run("lastComponentsForUser", {cacheFirst: true, realtime: true}, {
                            success: function(comps){
                                target.setState({lastComponents: comps, loadingComponents: true});

                                var amountProjectsLoaded = 0;
                                var projectsCurrentlyFetching = []; // Avoid loading the same project multiple times
                                for (var i = 0; i < comps.length; i++) {
                                    var row = comps[i];

                                    // The icon is not already in the current array of the dashboard
                                    // and the icon is not already loading
                                    if(projectsCurrentlyFetching.indexOf(row.id_project) == -1){
                                        projectsCurrentlyFetching.push(row.id_project);
                                        target.loadDataForProject(row.id_project, function(){
                                            amountProjectsLoaded++;
                                            if(amountProjectsLoaded>=comps.length){
                                                target.setState({loadingComponents: false});
                                            }
                                        });
                                    }else{
                                        amountProjectsLoaded++;
                                    }
                                }
                            },
                        });
                    }else{ target.setStatusForTask(0, "component");}
                }
            });

            // CHECK STATUS WORKFLOW
            Synchronise.Cloud.run("countWorkflow", {realtime: true, cacheFirst: true}, {
                success: function(count){
                    if(count.count>0){ target.setStatusForTask(1, "workflow"); }else{ target.setStatusForTask(0, "workflow");}
                }
            });

            // CHECK STATUS PROJECT
            Synchronise.Cloud.run("countReferrals", {realtime: true, cacheFirst: true}, {
                success: function(count){
                    if(count>0){ target.setStatusForTask(1, "friend"); }else{ target.setStatusForTask(0, "friend");}
                }
            });

            // CHECK MARKETPLACE VISIT
            Synchronise.LocalStorage.get("visitedMarketplace", function(visited){
                if(visited){
                    target.setStatusForTask(1, "marketplace");
                }else{
                    target.setStatusForTask(0, "marketplace");
                }
            }, false, true);

            // CHECK MARKETPLACE VISIT
            Synchronise.LocalStorage.get("visitedConnect", function(visited){
                if(visited){
                    target.setStatusForTask(1, "connect");
                }else{
                    target.setStatusForTask(0, "connect");
                }
            }, false, true);

            Synchronise.Cloud.run("getCardsListForUser", {realtime: true, cacheFirst: true}, {
                success: function(cards){
                    if(cards.length){
                        target.setStatusForTask(1, "payment");
                    }else{
                        target.setStatusForTask(0, "payment");
                    }
                },
            });

            window.setTimeout(function(){
                target.moveHand();
            }, 1500);
        },
        loadDataForProject: function(id_project, callback){
            var target = this;
            if(!target.state.templateForProject.hasOwnProperty('row.id_project')){
                Synchronise.Cloud.run("getProject", {cacheFirst: true, realtime: true, id_project: id_project}, {
                    success: function(project){
                        var templateForProject = target.state.templateForProject;
                            templateForProject[project.id] = {};
                            templateForProject[project.id].icon = project.icon;
                            templateForProject[project.id].backgroundColor = project.bg_color;
                            templateForProject[project.id].textColor = project.txt_color;

                        target.setState({templateForProject: templateForProject});
                    },
                    always: function(){
                        callback();
                    }
                });
            }
        },
        moveHand: function(){
            var target = this;

            var newPosition = "";
            if(target.state.currentHandIndicatorStatus){
                newPosition = "0px";
            }else{
                newPosition = "-20px";
            }

            $(ReactDOM.findDOMNode(this)).find('#tutorialList').find('.handIndicator').animate({
                right: newPosition,
                opacity: 1
            }, 300, 'easeOutBack', function(){
                target.setState({currentHandIndicatorStatus: !target.state.currentHandIndicatorStatus});
                target.moveHand();
            });
        },
        setStatusForTask: function(status, task){
            var target = this;
            var tasks = target.state.tasks.slice(0);
            var handPositionFound = false;
            for(var i = 0; i < tasks.length; i++){
                var row = tasks[i];
                if(row.name == task){
                    row.status = status;
                }

                if(!row.status){
                    if(!handPositionFound){
                        row.handIndicator = true;
                        handPositionFound = true;
                    }else{
                        row.handIndicator = false;
                    }
                }else{
                    row.handIndicator = false;
                }

                target.setState({tasks: tasks});
            }
        },
        render: function(){
            var target = this;
            var lastProjects = <Loader/>;

            if(!target.state.loadingComponents && target.state.lastComponents.length){
                lastProjects = (
                    <div className="card">
                        <div className="row">
                            <div className="col-lg-12" id="lastComponentsList">
                                <legend>Components</legend>
                                {this.state.lastComponents.map(function(row){
                                    if(target.state.templateForProject[row.id_project]){
                                        var icon = "";
                                        if(target.state.templateForProject.hasOwnProperty(row.id_project)){
                                            icon = (<img src={target.state.templateForProject[row.id_project].icon} style={{width: "20px", borderRadius: "2px"}}/>);
                                        }

                                        var bgColor = target.state.templateForProject[row.id_project].backgroundColor;

                                        return (
                                            <a href={"/component/edit?id="+row.id}><div className="component" style={{background: bgColor, borderColor: bgColor}}>{icon} <span className="name" style={{color: target.state.templateForProject[row.id_project].textColor}}>{row.name}</span></div></a>
                                        );
                                    }else{
                                        return (<div></div>)
                                    }
                                })}
                            </div>
                        </div>
                    </div>
                );
            }else if(!target.state.loadingComponents && !target.state.lastComponents.length){
                lastProjects = "";
            }

            return (
                <div className="row-fluid" style={{paddingTop: "50px"}}>
                    <div className="col-lg-5">
                        {lastProjects}

                        <div className="card" id="tutorialList">
                            <legend>Let&#39;s get you started!</legend>
                            {this.state.tasks.map(function(row, index){
                                var status = "";
                                if(row.status){
                                    status = "success";
                                }
                                var handIndicator = "";

                                if(row.handIndicator){
                                    handIndicator = (
                                        <div style={{position: "absolute", right: "-20px", marginTop: "-57px", zIndex: 999, opacity: 0}} className="handIndicator"><img src="/images/handPointingLeft.png"/></div>
                                    );
                                }
                                return (<a href={row.link} onClick={row.onClick} style={{textDecoration: "none"}}><div key={"task"+index} className={"taskToDo "+status}>{row.text}</div>{handIndicator}</a>);
                            })}
                        </div>
                    </div>
                    <div className="col-lg-7" style={{overflowX: "hidden"}}>
                        <MarketPlaceBlock/>
                        <HelpBlock/>
                    </div>
                </div>
            );
        }
    });


    var HelpBlock = React.createClass({
        startChat: function(){
            Intercom('showNewMessage');
        },
        componentDidMount: function(){
            var disqus_config = function () {
                this.page.url = '/dashboard';
                this.page.identifier = 'dashboard';
                this.page.title = 'Home';
            };

            (function() {
                var d = document, s = d.createElement('script');
                s.src = '//synchronise.disqus.com/embed.js';

                s.setAttribute('data-timestamp', +new Date());
                (d.head || d.body).appendChild(s);
            })();
        },
        render: function(){
            return (
                <div className="row">
                    <div className="col-xs-12" style={{minHeight: "135px"}}>
                        <legend>Here to help you</legend>
                        <div style={{textAlign: "center"}}>
                            <a href="/docs" style={{marginRight: "10px"}} className="btn btn-info">Documentation</a>
                            <a onClick={this.startChat} style={{marginRight: "10px"}} className="btn btn-primary">Chat</a>
                            <a href="/help" style={{marginRight: "10px"}} className="btn btn-warning">Community</a>
                        </div>
                    </div>

                    <div className="col-xs-12">
                        <div id="disqus_thread"></div>
                    </div>
                </div>
            );
        }
    });

    var MarketPlaceBlock = React.createClass({
        getInitialState: function(){
            return {
                items: [],
                loading: true,
                intervalSlideshow: false
            };
        },
        componentDidMount: function(){
            var target = this;
            Synchronise.Cloud.run("marketPlaceHeaderCarousel", {cacheFirst: true}, {
                success: function(data){
                    target.setState({
                        items: _.filter(data.blocks, function(row){
                            return row.type == "project"
                        })
                    });
                    target.slideshow();
                },
                always: function(){
                    target.setState({loading: false});
                }
            });
        },
        slideshow: function(){
            var dom = $(ReactDOM.findDOMNode(this));
                dom.find('.blocks').css({
                    minWidth: $(window).width(),
                    maxWidth: $(window).width(),
                    width: $(window).width()
                });

            var window_focus = true;
            $(window).focus(function() {
                window_focus = true;
            }).blur(function() {
                window_focus = false;
            });

            var intervalSlideshow = window.setInterval(function(){
                if(window_focus){
                    var firstItem = dom.find('.blocks').find('.bloc').first().clone();
                    dom.find('.blocks').append(firstItem);

                    var marginLeft = parseInt(dom.find('.blocks').find('.bloc').first().css('width'))*-1;
                    dom.find('.blocks').find('.bloc').first().animate({
                        marginLeft: marginLeft + "px",
                        opacity: "0.5"
                    }, 300, 'easeInOutBack');

                    window.setTimeout(function(){
                        dom.find('.blocks').find('.bloc').first().remove();
                    }, 600);
                }
            }, 2000);

            target.setState({intervalSlideshow: intervalSlideshow});
        },
        componentWillUnmount: function(){
            window.clearInterval(this.state.intervalSlideshow);
        },
        render: function(){
            var content = <Loader/>;
            if(!this.state.loading){
                content = (
                    <div className="blocks">
                        {this.state.items.map(function(row, index){
                            return <MarketPlaceBlockItem id={row.id} key={"HeaderSlideshowBlock"+row.id+index}/>;
                        })}
                    </div>
                );
            }
            return (
                <div style={{marginBottom: "30px"}}>
                    <legend>Marketplace <div className="pull-right"><a className="btn btn-xs btn-success" href="/marketplace">Visit market place</a></div></legend>
                    <div id="marketPlace">
                        {content}
                    </div>
                </div>
            );
        }
    });

    // ID of the project
    var MarketPlaceBlockItem = React.createClass({
        getInitialState: function(){
            return {
                loading: false,
                backgroundColor: "",
                logoUrl: "",
                colorText: "",
                nameProject: "",
                failed: false
            };
        },
        componentDidMount: function(){
            var target = this;
            Synchronise.Cloud.run("getProject", {id_project: this.props.id, cacheFirst: true}, {
                success: function(data){
                    if(data){
                        target.setState({
                            backgroundColor: data.bg_color,
                            logoUrl: data.icon,
                            colorText: data.txt_color,
                            nameProject: data.name
                        });
                    }else{
                        target.setState({
                            failed: true
                        });
                    }
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
            var content = "";
            if(this.state.loading){
                content = (<div><Loader/></div>);
            }else if(!this.state.failed){
                content = (
                    <div className="block">
                        <a href={"/marketplace/project/"+this.props.id} alt={this.state.nameProject+" project page"}>
                            <div className="card" style={{background: this.state.backgroundColor}}>
                                <div className="logoProject">
                                    <img src={this.state.logoUrl} />
                                </div>
                                <div className="nameProject">
                                    <h3 style={{color: this.state.colorText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{this.state.nameProject}</h3>
                                </div>
                            </div>
                        </a>
                    </div>
                );
            }
            return content;
        }
    });

    ReactDOM.render(<Dashboard />, document.getElementById('dashboard'));
});
