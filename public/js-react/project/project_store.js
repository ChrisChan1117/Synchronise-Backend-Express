var ProjectModalStore;

dependenciesLoader(["React", "ReactDOM", "_", "Loader"], function(){
    ProjectModalStore = React.createClass({
        getInitialState: function(){
            return {
                loading : false,
                isSubmitting: false,
                isPublishing: false,
                bg_color: "",
                txt_color: "",
                icon_flts: "",
                icon: "",
                name: "",
                colorPickers : [],
                published: false,
                community: false
            };
        },
        componentDidMount: function(){
            var target = this;
                target.setState({ loading : true });

            if(this.props.id_project){
                Synchronise.Cloud.run("getProject", {id_project: this.props.id_project, realtime: true}, {
                    success: function(project){
                        if(target.isMounted()){
                            var colorProperties = ["bg_color", "txt_color"];
                            var colorPickers = [];

                            _.each(colorProperties, function(row){
                                var picker = $(ReactDOM.findDOMNode(target)).find("."+row).colorpicker();
                                    picker.on('changeColor.colorpicker', function(event){
                                        var params = {id_project: project.id};
                                            params[row] = event.color.toHex();

                                        target.setState(params);
                                        Synchronise.Cloud.run("createOrUpdateProject", params);
                                    });
                                colorPickers.push(picker);
                            });

                            target.setState({
                                bg_color: project.bg_color,
                                txt_color: project.txt_color,
                                icon_flts: project.icon_flts,
                                icon: project.icon,
                                name: project.name,
                                colorPickers: colorPickers,
                                published: project.published,
                                community: project.community
                            });
                        }
                    },
                    error: function(err){
                        new ModalErrorParse(err, function(){
                            target.closeModal();
                        });
                    },
                    always: function(){
                        if(target.isMounted()){
                            target.setState({ loading : false, isSubmitting: false, isPublishing: false});
                            $('[data-toggle="tooltip"]').tooltip('destroy');
                            $('[data-toggle="tooltip"]').tooltip();
                        }
                    }
                });
            }
        },
        componentWillUnmount: function(){
            _.each(this.state.colorPickers, function(picker){
                picker.colorpicker("destroy");
            });
        },
        submitProjectToTheStore: function(value){
            var target = this;
            if(!this.state.isSubmitting){
                target.setState({isSubmitting: true});
                Synchronise.Cloud.run("createOrUpdateProject", {id_project: this.props.id_project, published: value}, {});
            }
        },
        setPublished: function(value){
            var target = this;
            if(!this.state.isPublishing){
                target.setState({isPublishing: true});
                Synchronise.Cloud.run("createOrUpdateProject", {id_project: this.props.id_project, community: value}, {});
            }
        },
        render: function(){
            var target = this;
            var content = "";

            var submissionContent = "";
            var titleSubmission = "";
            var submitButton = "";
            var setPublicButton = "";
            var marketPlacePageButton = "";
            if(this.state.published){
                var labelUnpublishProjectButton = "Unpublish";
                if(this.state.isSubmitting){
                    labelUnpublishProjectButton = "Unpublishing...";
                }

                titleSubmission = (<legend>Market Place <label className="label label-success pull-right" style={{fontSize: "50%", marginTop: "10px"}}>Project published</label></legend>);
                submitButton = (<div style={{textAlign: "center"}}><button className="btn btn-warning"
                                                                           onClick={this.submitProjectToTheStore.bind(null, false)}
                                                                           data-toggle="tooltip"
                                                                           data-placement="top"
                                                                           title="The project will no longer be visible on the market place. Developers that have used or created components for this project, will still have access to the resources they had used before unpublication.">{labelUnpublishProjectButton}</button></div>);
                marketPlacePageButton = (<div style={{textAlign: "center"}}><a href={"/marketplace/project/"+this.props.id_project} className="btn btn-primary">Go to marketplace</a></div>);
            }else{
                var labelSubmitProjectButton = "Submit my Project";
                if(this.state.isSubmitting){
                    labelSubmitProjectButton = "Submitting...";
                }

                titleSubmission = (<legend>Submit to the MarketPlace</legend>);
                submitButton = (<div style={{textAlign: "center"}}><button className="btn btn-primary" onClick={this.submitProjectToTheStore.bind(null, true)}>{labelSubmitProjectButton}</button></div>);
            }

            if(this.state.community){
                var labelPublishingProjectButton = "Set private";
                if(this.state.isPublishing){
                    labelPublishingProjectButton = "Unpublishing...";
                }
                setPublicButton = (<div style={{textAlign: "center"}}><button className="btn btn-warning"
                                                                              onClick={this.setPublished.bind(null, false)}
                                                                              data-toggle="tooltip"
                                                                              data-placement="top"
                                                                              title="Other developers will no longer be able to create and publish new components for this project. However, existing components will keep their current publication status.">{labelPublishingProjectButton}</button></div>);
            }else{
                var labelPublishingProjectButton = "Set public";
                if(this.state.isPublishing){
                    labelPublishingProjectButton = "Publishing...";
                }
                setPublicButton = (<div style={{textAlign: "center"}}><button className="btn btn-success"
                                                                              onClick={this.setPublished.bind(null, true)}
                                                                              data-toggle="tooltip"
                                                                              data-placement="top"
                                                                              title="Making a project public allow other developers to contribute to it by creating new components. The contributors will not be able to edit the components you have made, but they will be able to create and publish new ones.">{labelPublishingProjectButton}</button></div>);
            }

            submissionContent = (
                <div className="col-xs-12">
                    {titleSubmission}<br/>
                    {marketPlacePageButton}<br/>
                    {setPublicButton}<br/>
                    {submitButton}
                </div>
            );

            if(this.state.loading){
                content = <Loader />;
            }else{
                content = (
                    <div className="row-fluid store">
                        <div className="col-xs-12">
                            <p>If you think your project could be beneficial to the rest of the community you can make it available on the Market Place. We only require you to define few esthetical elements in order to keep the consistency of our platform. Choosing the right visual elements can help your project stand out from the rest of the projects on the market.</p>
                        </div>

                        <div className="col-md-6 col-sm-12 col-xs-12" style={{textAlign: "center"}}>
                            <legend>Settings</legend>

                            <div className="form-group">
                                <label>Background color</label>&nbsp;
                                <input type="text"
                                       className="bg_color"
                                       defaultValue={this.state.bg_color}/>
                            </div>

                            <div className="form-group">
                                <label>Text color</label>&nbsp;
                                <input type="text"
                                       className="txt_color"
                                       defaultValue={this.state.txt_color}/>
                            </div>

                            {submissionContent}
                        </div>

                        <div className="col-md-6 col-sm-12 col-xs-12 preview">
                            <legend style={{textAlign: "center"}}>Preview</legend>
                            <p style={{textAlign: "center"}}>The following blocks will help you to see how your project will look like on the rest of the platform.</p>

                            <ul className="nav nav-tabs" role="tablist">
                                <li role="presentation" className="active"><a href="#project" aria-controls="project" role="tab" data-toggle="tab">Project</a></li>
                                <li role="presentation"><a href="#workflow" aria-controls="workflow" role="tab" data-toggle="tab">Workflow</a></li>
                                <li role="presentation"><a href="#marketPlace" aria-controls="marketPlace" role="tab" data-toggle="tab">Market Place</a></li>
                            </ul>

                            <div className="tab-content">
                                <div role="tabpanel"
        						     className="tab-pane active"
                                     style={{backgroundColor: "#edecec"}}
        							 id="project">
                                    <div style={{backgroundColor: "#edecec", display: "-webkit-box", marginTop: "20px"}}>
                                        <div className="col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-10 col-sm-offset-1 col-xs-12 project">
                                            <div className="card display" style={{backgroundColor: this.state.bg_color, color: this.state.txt_color, borderRadius: "5px", marginTop: "35px", minHeight: "150px", maxHeight: "150px"}}>
                                                <div className="settings"><i className="fa fa-cog"></i></div>
                                                <div className="delete"><i className="fa fa-trash"></i></div>
                                                <div className="team"><i className="fa fa-users"></i></div>
                                                <div style={{opacity: "1", textAlign: "center", width: "100%"}}><img src={this.state.icon} style={{width: "50px", borderRadius: "5px", marginTop: "-35px"}}/></div>
                                                <center><h3 style={{color: this.state.txt_color}}>{this.state.name}</h3></center>
                                            </div>
                                        </div>
                                    </div>
        						</div>

        					    <div role="tabpanel"
        							 className="tab-pane"
        							 id="workflow">
                                     <div style={{backgroundColor: "#edecec", marginTop: "30px", paddingTop: "10px"}}>
                                        <div className="row-fluid" style={{textAlign: "center"}}><button className="btn btn-primary">Run</button></div>
                                        <div className="row-fluid" style={{textAlign: "center", marginBottom: "10px"}}>
                                            <ul className="nav nav-tabs" role="tablist">
                                                <li role="presentation" className="active" style={{display: "inline-block", float: "none"}}><a role="tab" data-toggle="tab">Workflow</a></li>
                                                <li role="presentation" style={{display: "inline-block", float: "none"}}><a role="tab" data-toggle="tab">Settings</a></li>
                                            </ul>
                                        </div>

                                        <div className="row">
                                            <div className="card col-lg-10 col-lg-offset-1 col-md-8 col-md-offset-2 col-sm-6 col-sm-offset-3 col-xs-12 " style={{minHeight: "230px"}}>
                                                <center><input type="text" placeholder="Search by name" className="form-control" style={{marginBottom: "10px"}}/></center>
                                                <div className="card workflow" style={{background: this.state.bg_color, color: this.state.txt_color}}>
                                                    <img src={this.state.icon} style={{width: "50px", height: "50px", borderRadius: "5px"}}/>
                                                    <span className="title">{this.state.name}</span>
                                                </div>
                                                <div className="card" style={{minHeight: "50px", border: "1px solid " + this.state.bg_color, marginTop: "-30px"}}>
                                                    <span style={{color: "#777", fontWeight: "bold"}}>A component</span>
                                                </div>
                                            </div>
                                        </div>
                                     </div>
        						</div>

        						<div role="tabpanel"
        							 className="tab-pane"
        							 id="marketPlace">
                                    <div style={{backgroundColor: "#edecec", marginTop: "30px", padding: "0"}}>
                                        <div className="row">
                                            <div className="card col-xs-10 col-xs-offset-1" style={{minHeight: "150px", background: this.state.bg_color, color: this.state.txt_color, borderRadius: "5px", marginTop: "20px"}}>
                                                <div style={{height: "75px", width: "100%", textAlign: "center", lineHeight: "75px"}}>
                                                    <img src={this.state.icon} style={{width: "50px", borderRadius: "5px"}}/>
                                                </div>

                                                <div style={{height: "75px", width: "100%", textAlign: "center", lineHeight: "75px"}}>
                                                    <h3 style={{color: this.state.txt_color}}>{this.state.name}</h3>
                                                </div>
                                            </div>
                                        </div>
                                     </div>
        						</div>
        					</div>
                        </div>
                    </div>
                );
            }

            return (
                <div role="tabpanel" className={"tab-pane fade in store " + this.props.state} id="store">
                    {content}
                </div>
            );
        }
    });
});
