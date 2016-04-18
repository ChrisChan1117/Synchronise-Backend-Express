var SettingsTab;
dependenciesLoader(["React", "ReactDOM", "$", "_", "Loader"], function(){
    // Props
    // - (string)identifier: The unique identifier of the workflow
    // - (string)name: The name of the Workflow
    // - (boolean)loading: Whether or not the workflow is still loading
    // - (function)changeName: Callback to trigger when the name of the Workflow changes
    SettingsTab = React.createClass({
        getInitialState: function(){
            return {};
        },
        componentDidMount: function(){

        },
        render: function(){
            var content = <Loader/>
            if(!this.props.loading){
                content = (
                    <div className="col-xs-12 card">
                        <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                            <div className="form-group">
                                <label>Workflow name</label>
                                <input onChange={this.props.changeName} type="text" className="form-control input-lg" value={this.props.name} placeholder="Be creative..."/>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                            <div className="form-group">
                                <label>Identifier</label>
                                <input defaultValue={this.props.identifer} className="form-control input-lg" type="text" readOnly placeholder="Identifier"/>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div role="tabpanel" className="tab-pane fade col-lg-12" id="settingsTab">
                    {content}
                </div>
            );
        }
    });
});
