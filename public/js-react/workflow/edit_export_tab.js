var ExportTab;
dependenciesLoader(["React", "ReactDOM", "$", "_", "Loader", "Export"], function(){
    // Displays the export block of a workflow
    // Props:
    // - (string)id
    // - (boolean)loading
    // - (object)inputs
    ExportTab = React.createClass({
        getInitialState: function(){
            return {};
        },
        componentDidMount: function(){

        },
        render: function(){
            var content = <Loader/>
            if(!this.props.loading){
                content = (
                    <div className="col-xs-12 card" id="export">
                        <Export id={this.props.id} loading={this.props.loading} inputs={this.props.inputs} />
                    </div>
                );
            }

            return (
                <div role="tabpanel" className="tab-pane fade col-lg-12" id="exportTab">
                    {content}
                </div>
            );
        }
    });
});
