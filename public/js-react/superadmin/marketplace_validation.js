dependenciesLoader(["Synchronise", "urlH", "$", "React", "ReactDOM", "Loader", "_"], function(){
    var MarketplaceValidation = React.createClass({
        displayName: "MarketplaceValidation",
        getInitialState: function(){
            return {
                loading: false,
                loaded : false,
                data: {
                    components: [],
                    workflows : []
                }
            };
        },
        componentDidMount: function(){
            var target = this;

            $(ReactDOM.findDOMNode(this)).on('click', '#loadMarkplaceValidation', function(){
                target.loadData();
            })
        },
        loadData: function(){
            var target = this;
                target.setState({loading: true});

            Synchronise.Cloud.run("superadminLoadMarketplaceValidationData", {realtime: true}, {
                success: function(data){
                    target.setState({data: data});
                },
                error: function(err){
                    new ModalErrorParse(err);
                },
                always: function(){
                    target.setState({loading: false, loaded: true});
                }
            });
        },
        render: function(){
            var content = "";

            if(!this.state.loaded && !this.state.loading){
                content = (
                    <div style={{textAlign: "center"}}>
                        <button className="btn btn-primary" onClick={this.loadData}>Load data</button>
                    </div>
                );
            }else if(this.state.loading){
                content = (
                    <div style={{textAlign: "center"}}>
                        <Loader/>
                    </div>
                );
            }else{
                content = (
                    <div>
                        <div className="card">
                            <legend>Components</legend>
                        </div>

                        {this.state.data.components.map(function(row){
                            return <MarketplaceValidationComponentItem key={row.id+"componentItem"} data={row}/>
                        })}

                        <div className="card">
                            <legend>Workflows</legend>
                        </div>
                    </div>
                );
            }

            return content;
        }
    });

    var MarketplaceValidationComponentItem = React.createClass({
        displayName: "MarketplaceValidationComponentItem",
        getInitialState: function(){
            return {
                loading : false,
                loaded  : false,
                opened  : false,
                project : false,
                user    : false
            };
        },
        componentDidMount: function(){
            var target = this;
        },
        toggleComponentDisplay: function(){
            var target = this;
                target.setState({opened: !target.state.opened});

            target.loadData();
        },
        loadData: function(){
            var target = this;
            if(!target.state.loaded && !target.state.loading){
                target.setState({loading: true});

                Synchronise.Cloud.run("getProject", {id_project: this.props.data.id_project}, {
                    success: function(data){
                        target.setState({project: data});
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({loaded: true, loading: false});
                    }
                });

                Synchronise.Cloud.run("userObject", {user_id: this.props.data.user_id}, {
                    success: function(data){
                        target.setState({user: data});
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({loaded: true});
                    }
                });
            }
        },
        approveComponent: function(){
            var target = this;
            if(!this.state.approving){
                target.setState({approving: true});

                Synchronise.Cloud.run("superadminApproveComponent", {id: this.props.data.id}, {
                    error: function(err){
                        new ModalErrorParse(err);
                    }
                });
            }
        },
        render: function(){
            var projectContent = "";
            if(this.state.project){
                var urlProject = "";
                if(this.state.project.url){
                    urlProject = (<a href={this.state.project.url} style={{color: this.state.project.txt_color}}>{this.state.project.url}</a>);
                }

                var descriptionProject = "";
                if(this.state.project.url){
                    descriptionProject = (<p style={{color: this.state.project.txt_color}}>{this.state.project.description}</p>);
                }

                var descriptionComponent = "";
                if(this.props.data.description){
                    descriptionComponent = (
                        <div>
                            <b>Description</b>
                            <p>{this.props.data.description}</p>
                        </div>
                    );
                }

                projectContent = (
                    <div>
                        <legend>Project</legend>
                        <div className="well" style={{background: this.state.project.bg_color, borderRadius: "5px"}}>
                            <legend style={{color: this.state.project.txt_color}}><img src={this.state.project.icon} height="25px" style={{borderRadius: "5px"}}/> {this.state.project.name}</legend>
                            {urlProject}
                            {descriptionProject}
                        </div>
                    </div>
                );
            }

            var userContent = "";
            if(this.state.user){
                var avatar = "";
                if(this.state.user.avatar){
                    avatar = (<img src={this.state.user.avatar} width="50px" className="img-circle" />);
                }

                var formattedTotalRequests = this.state.user.requests_executed;
                if(formattedTotalRequests > 1000 && formattedTotalRequests < 1000000){
                    formattedTotalRequests = Math.round(formattedTotalRequests/1000) + "K";
                }else if(formattedTotalRequests > 1000000 && formattedTotalRequests < 1000000000){
                    formattedTotalRequests = Math.round(formattedTotalRequests/1000000) + "M";
                }else if(formattedTotalRequests > 1000000000){
                    formattedTotalRequests = Math.round(formattedTotalRequests/1000000000) + "B";
                }

                var formattedTotalBonusRequests = this.state.user.bonus_requests;
                if(formattedTotalBonusRequests > 1000 && formattedTotalBonusRequests < 1000000){
                    formattedTotalBonusRequests = Math.round(formattedTotalBonusRequests/1000) + "K";
                }else if(formattedTotalBonusRequests > 1000000 && formattedTotalBonusRequests < 1000000000){
                    formattedTotalBonusRequests = Math.round(formattedTotalBonusRequests/1000000) + "M";
                }else if(formattedTotalBonusRequests > 1000000000){
                    formattedTotalBonusRequests = Math.round(formattedTotalBonusRequests/1000000000) + "B";
                }

                var stripeContent = "";
                if(this.state.user.id_stripe){
                    stripeContent = (
                        <div>
                            <b>Stripe</b><br/>
                            {this.state.user.id_stripe}<br/>
                            <a className="btn btn-primary" href={"https://dashboard.stripe.com/customers/"+this.state.user.id_stripe} target="_blank">Open dashboard</a>
                        </div>
                    );
                }

                var referrerContent = "";
                if(this.state.user.referral){
                    referrerContent = (
                        <div>
                            <b>Referrer ID</b><br/>
                            {this.state.user.referral}
                        </div>
                    );
                }

                userContent = (
                    <div>
                        <legend>User</legend>
                        <div className="well">
                            {avatar}
                            <h5>{this.state.user.name}</h5>
                            <div>
                                <b>Email</b><br/>
                                {this.state.user.email}
                            </div>
                            <div>
                                <b>Username</b><br/>
                                {this.state.user.username}
                            </div>
                            <div>
                                <b>Total requests executed</b><br/>
                                {formattedTotalRequests}
                            </div>
                            <div>
                                <b>Bonus requests</b><br/>
                                {formattedTotalBonusRequests}
                            </div>
                            {stripeContent}
                            {referrerContent}
                            <div>
                                <b>Type login</b><br/>
                                {this.state.user.type_login}
                            </div>
                        </div>
                    </div>
                );
            }

            var labelForApproveButton = "Approve component";
            if(this.state.approving){
                labelForApproveButton = "Approving";
            }

            var content = (
                <div className="container-fluid">
                    <div className="card">
                        <a onClick={this.toggleComponentDisplay} role="button" data-toggle="collapse" href={"#component"+this.props.data.id} aria-expanded="false" aria-controls={"#component"+this.props.data.id}>{this.props.data.name}</a>
                        <div className="collapse" id={"component"+this.props.data.id} style={{marginTop: "10px"}}>
                            <div className="row">
                                <div className="col-xs-12">
                                    <div className="col-xs-8">
                                        <legend>Component</legend>
                                        <div>
                                            <b>Title</b>
                                            <p>{this.state.project.name}</p>
                                        </div>
                                        {descriptionComponent}

                                        <div style={{textAlign: "center"}}>
                                            <div className="btn-group" style={{textAlign: "center"}}>
                                                <a className="btn btn-primary" target="_blank" href={"/component/edit?id="+this.props.data.id}>Explore component</a>
                                                <button className="btn btn-success" onClick={this.approveComponent}>{labelForApproveButton}</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-xs-4">
                                        {projectContent}
                                        {userContent}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

            return content;
        }
    });

    var isAllowedThisSection;
    _.each(Synchronise.User.current().roles, function(row){
        if(row.name == "superadmin"
        || row.name == "admin"
        || row.name == "marketplaceValidation"){
            isAllowedThisSection = true;
        }
    });

    if(isAllowedThisSection){
        ReactDOM.render(<MarketplaceValidation/>, document.getElementById("MarketplaceValidation"));
    }
});
