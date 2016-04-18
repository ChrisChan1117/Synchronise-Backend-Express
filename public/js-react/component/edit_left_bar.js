var LeftBar;

dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "urlH", "Code", "Export", "Setting"], function(){
    // Displays the left bar (Component name, identifier, inputs, code, outputs)
    LeftBar = React.createClass({
        nameChanged: function(event){
            var target = this;
                target.setState({name: event.target.value});

            Synchronise.Cloud.run("updateComponent", {id: urlH.getParam("id"), data:{name:event.target.value}}, {});
        },
        componentDidMount: function(){
            var alreadyRefreshed = false;

            $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                if($(e.relatedTarget).attr('aria-controls') != "code" && !alreadyRefreshed){
                    alreadyRefreshed = true;
                    $('.CodeMirror').each(function(i, el){
                        el.CodeMirror.refresh();
                    });
                }
            });
        },
        render: function(){
            var exportNotInTabPanel = "";
            var tabpanelContent = "";

            if(this.props.component.is_forked){
                exportNotInTabPanel = (
                    <div id="export">
                        <Export loading={this.props.loading}
                                component={this.props.component}/>
                    </div>
                );
            }else{
                tabpanelContent = (
                    <div className="tab-content">
                        <div role="tabpanel" className="tab-pane active" id="code">
                            <Code loading={this.props.loading}
                                  addInput={this.props.addInput}
                                  typeChangedForInput={this.props.typeChangedForInput}
                                  removeInput={this.props.removeInput}
                                  addOutput={this.props.addOutput}
                                  typeChangedForOutput={this.props.typeChangedForOutput}
                                  changeValueIs_optional={this.props.changeValueIs_optional}
                                  removeOutput={this.props.removeOutput}
                                  component={this.props.component}/>
                        </div>

                        <div role="tabpanel" className="tab-pane" id="setting">
                            <Setting loading={this.props.loading}
                                     addTag={this.props.addTag}
                                     removeTag={this.props.removeTag}
                                     component={this.props.component}/>
                        </div>

                        <div role="tabpanel" className="tab-pane" id="export">
                            <Export loading={this.props.loading}
                                    component={this.props.component}/>
                        </div>
                    </div>
                );
            }

            return (
                <div className="row">
                    <div className="col-xs-12">
                        {tabpanelContent}
                        {exportNotInTabPanel}
                    </div>
                </div>
            );
        }
    });
});
