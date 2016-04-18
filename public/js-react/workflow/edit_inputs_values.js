var WorkflowInputValues;
dependenciesLoader(["React", "ReactDOM", "$", "_"], function(){
    // Props
    // - (function)inputValueChanged: Callback to trigger when the value of an input changes
    // - (array)inputs: The list of inputs expected by the workflow
    // - (object)inputsStatus:  The status of each inputs (error, success, pending...). This is used to display a red line underneath if the value given is incorrect for example
    // - (object)inputsValues: The actual values of the inputs given by the user.
    WorkflowInputValues = React.createClass({
        getInitialState: function(){
            return {};
        },
        componentDidMount: function(){

        },
        render: function(){
            var target = this;
            var noContent = "";
            var content = "";
            if(target.props.inputs.length){
                content = (
                    <div className="card col-xs-12">
                        {target.props.inputs.map(function(row){
                            return (
                                <div className={"form-group input-xs col-lg-4 col-xs-12"} key={"inputsForRightBar"+row.name}>
                                    <label style={{marginBottom: "0px"}}>{row.name}</label>
                                        <input type="text"
                                               value={target.props.inputsValues[row.name]}
                                               style={{height: "initial"}}
                                               onChange={target.props.inputValueChanged.bind(null, row.name)}
                                               className="form-control"/>
                                </div>
                            );
                        })}
                    </div>
                );
            }

            return (
                <div id="inputsValues" className="row-fluid"><div className="col-xs-12">{noContent}{content}</div></div>
            );
        }
    });
});
