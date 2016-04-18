var Setting;

dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "urlH"], function(){
    // Displays the tab set the setting of a component
    Setting = React.createClass({
        getInitialState: function(){
            return {
                public_key           : "",
                loading_key          : false,
                publishing           : false,
                cancellingSubmission : false,
                name                 : "",
                description          : "",
                published            : false,
                approved             : false,
                stateButtonAddTags   : "",
                tagFieldValue        : ""
            };
        },
        componentDidMount: function(){
            var target = this;

            // This part cannot be realtime updated because it causes collisions with the user typing in the input for the name
            Synchronise.Cloud.run("loadComponent", {id: urlH.getParam("id")}, {
                success: function(data){
                    if(target.isMounted()){
                        target.setState({name: data.component.name, description: data.component.description});
                    }
                    document.title = data.component.name;
                }
            });

            // This part needs to be realtime updated
            Synchronise.Cloud.run("loadComponent", {id: urlH.getParam("id"), realtime: true}, {
                success: function(data){
                    if(target.isMounted()){
                        target.setState({
                            published : data.component.published,
                            approved  : data.component.approved,
                            isForked  : data.component.isForked,
                            publishing : false,
                            cancellingSubmission: false
                        });
                    }
                }
            });
        },
        nameChanged: function(event){
            var target = this;
                target.setState({name: event.target.value});
            document.title = event.target.value;

            Synchronise.Cloud.run("updateComponent", {id: urlH.getParam("id"), data:{name:event.target.value}}, {
                success: function(){
                    target.setState({error: false});
                }
            });
        },
        descriptionChanged: function(event){
            var target = this;
                target.setState({description: event.target.value});

            Synchronise.Cloud.run("updateComponent", {id: urlH.getParam("id"), data:{description:event.target.value}}, {
                success: function(){
                    target.setState({error: false});
                }
            });
        },
        publishComponent: function(){
            var target = this;
                target.setState({publishing: true});

            Synchronise.Cloud.run("updateComponent", {id: urlH.getParam("id"), data:{published:true}}, {});
        },
        cancelSubmission: function(){
            var target = this;
                target.setState({cancellingSubmission: true});

            Synchronise.Cloud.run("updateComponent", {id: urlH.getParam("id"), data:{published:false}}, {
                always: function(){
                    target.setState({cancellingSubmission: false});
                }
            });
        },
        addTagsButton: function(event){
            var target = this;
            if(target.state.stateButtonAddTags == "active"){
                target.setState({stateButtonAddTags: ""});
            }else{
                target.setState({stateButtonAddTags: "active"});
                $("#addTags").focus();
            }
        },
        tagFieldKeyDown: function(event){
            var target = this;
            if(event.key == "Enter"){
                if(target.state.tagFieldValue.length){
                    var value = target.state.tagFieldValue;
                    target.props.addTag(value);
                    target.setState({tagFieldValue: "", stateButtonAddTags: ""});
                    $("#addTag").blur();
                }
            }
        },
        tagFieldOnChange: function(event){
            var target = this;
                target.setState({tagFieldValue: event.target.value});
        },
        render: function(){
            var target = this;

            var compName = <Loader/>;
            if(!this.state.loading){
                compName = (
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <label>Component name</label>
                            <input type="text"
                                   onChange={this.nameChanged}
                                   value={this.state.name}
                                   className="form-control input-lg"
                                   placeholder="Sending an email, sending a push notification..."/>
                        </div>
                    </div>
                );
            }

            var compDescription = <Loader/>;
            if(!this.state.loading){
                compDescription = (
                    <div className="col-xs-12">
                        <div className="form-group">
                            <label>Component description</label>
                            <textarea type="text"
                                   onChange={this.descriptionChanged}
                                   value={this.state.description}
                                   className="form-control input-lg"
                                   placeholder="This component allows you to do this and that. You can send it some parameters to do this thing or that thing."></textarea>
                        </div>
                    </div>
                );
            }

            var compIdentifier = "";
            if(!this.state.loading){
                compIdentifier = (
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <label>Identifier</label>
                            <input className="form-control input-lg"
                                   type="text"
                                   value={this.props.component.id}
                                   onFocus={this.onFocusIdentifier}
                                   readOnly
                                   placeholder="Identifier"/>
                        </div>
                    </div>
                );
            }

            var contentForMarketplace = "";
            if(!this.state.published && !this.state.approved){
                var button = (<button className="btn btn-primary" onClick={this.publishComponent}>Publish component</button>);
                if(this.state.publishing){
                    button = (<button className="btn btn-primary" disabled="disabled">Publishing</button>);
                }

                contentForMarketplace = (
                    <div>
                        <p>If you think your component could be beneficial to other developers you can publish it on our marketplace.</p>
                        {button}
                    </div>
                );
            }else if(this.state.published && !this.state.approved){
                var button = (<button className="btn btn-danger" onClick={this.cancelSubmission}>Cancel submission</button>);

                if(this.state.cancellingSubmission){
                    button = (<button className="btn btn-danger" disabled="disabled">Cancel submission</button>);
                }

                contentForMarketplace = (
                    <div>
                        <label className="label label-primary">Waiting for validation</label>
                        <p>Your component is currently being examined by our team.
                           We verify every component individually to ensure that other developers will not have any issues using it.
                           We might need to contact you if we need further information</p>
                        <hr/>
                        {button}
                    </div>
                );
            }else{
                contentForMarketplace = (
                    <div>
                        <label className="label label-success">Your component is live</label>
                        <p>Your component has been approved and is now live on our marketplace</p>
                        <a className="btn btn-success" href={"/marketplace/project/"+this.props.component.id_project}>See on marketplace</a>
                    </div>
                );

                /*
                <hr/>
                <div className="col-xs-4 col-xs-offset-2">
                    <a className="btn btn-block btn-social btn-facebook" style={{display: "inline-block"}}>
                       <span className="fa fa-facebook"></span> Share on Facebook
                    </a>
                </div>

                <div className="col-xs-4">
                    <a className="btn btn-block btn-social btn-twitter" style={{display: "inline-block"}}>
                       <span className="fa fa-twitter"></span> Tweet
                    </a>
                </div>
                */
            }

            var contentForTags = "";
            if(this.state.loading){
                contentForTags = <Loader/>;
            }else{
                if(this.props.component){
                    contentForTags = (
                        <div id="tags">
                            <p>Sometimes it becomes difficult to find a component because there are too many in a project. Worry no more we have you covered.</p>
                            <div>
                                {this.props.component.tags.map(function(row, index){
                                    return (
                                        <span className="input" key={"tag"+row+index}><span className="label label-primary name">{row}</span><span className="remove"><i className="fa fa-times" style={{cursor: "pointer"}} onClick={target.props.removeTag.bind(null, row)}></i></span></span>
                                    );
                                })}
                                <div id="addTagsButton" className={this.state.stateButtonAddTags} onClick={this.addTagsButton}>
                                    <i className={"fa fa-plus "+this.state.stateButtonAddTags}> Add a tag</i>
                                </div>
                                <input type="text"
                                       id="addTags"
                                       placeholder="Type tag name then press return"
                                       value={this.state.tagFieldValue}
                                       className={"form-control "+this.state.stateButtonAddTags}
                                       onKeyDown={this.tagFieldKeyDown}
                                       onChange={this.tagFieldOnChange}/>
                            </div>
                        </div>
                    );
                }
            }

            return (
                <div className="row">
                    <div className="col-xs-12">
                        <div className="row-fluid">
                            <div className="col-xs-12 card">
                                {compName}{compIdentifier}{compDescription}
                            </div>

                            <div className="col-xs-12 card" style={{textAlign: "center"}}>
                                <legend>Marketplace</legend>
                                {contentForMarketplace}
                            </div>

                            <div className="col-xs-12 card" style={{textAlign: "center"}}>
                                <legend>Tags</legend>
                                {contentForTags}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    });
});
