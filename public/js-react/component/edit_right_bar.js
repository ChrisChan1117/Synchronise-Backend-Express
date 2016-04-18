var RightBar;

dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "TimeAgo", "CodeMirror", "urlH", "Typeahead"], function(){
    // Displays the results of the execution of the component
    // Props :
    // - (string)status: the status of the execution
    // - (number)exec_time: The duration of the last execution
    // - (string)results: The results string
    var Results = React.createClass({
        getInitialState: function(){
            return {
                codeMirror: false
            };
        },
        componentDidMount: function(){
            /*var code = CodeMirror.fromTextArea(document.getElementById('results'), {
                mode        : "javascript",
                theme       : "material",
                lineNumbers : false,
                readOnly    : true,
                lint        : false
            });

            this.setState({codeMirror: code});*/
        },
        componentWillReceiveProps: function(props){
            var target = this;
            // Formats the displays of the JSON if necessary
            if(props.hasOwnProperty('results')){
                if(typeof(props.results) == "object"){
                    $(ReactDOM.findDOMNode(target)).find('#results').JSONView(props.results);
                }else{
                    $(ReactDOM.findDOMNode(target)).find('#results').text(props.results);
                }
            }
        },
        render: function(){
            var classForStatus = "";
            var duration = "";
            switch (this.props.status) {
                case "success":
                    classForStatus = "success";
                    duration = this.props.exec_time+"s";
                    break;

                case "error":
                    classForStatus = "danger";
                    break;

                case "loading":
                    classForStatus = "primary";
                    break;

                case "timeout":
                    classForStatus = "info";
                    break;

                case "progress":
                    classForStatus = "info";
                    break;
            }

            var labelForStatus = this.props.status.charAt(0).toUpperCase() + this.props.status.slice(1);

            if(this.state.codeMirror){
                var results = this.props.results;
                if(typeof(results) == "object"){
                    results = JSON.stringify(results);
                }
                this.state.codeMirror.setValue(results);
            }

            var loaderForResults = "";
            var opacityForResults = 1;
            if(this.props.status == "loading"){
                loaderForResults = (<Loader/>);
                opacityForResults = 0;
            }

            return (
                <div className="row">
                    <div className="col-xs-12">
                        <legend>Result <div className="pull-right"><span style={{fontWeight: "100", fontSize: "small", marginRight: "5px"}}>{duration}</span><span className={"label label-" + classForStatus} style={{fontSize: "10px", "marginTop": "11px"}}>{labelForStatus}</span></div></legend>
                        {loaderForResults}
                        <div id="results" className="card" style={{opacity: opacityForResults}}>Execute the component to see the results</div>
                    </div>
                </div>
            );
        }
    });

    // Displays the messages from the console log on the server
    // Props:
    // - (string)logs: The logs to display
    var Console = React.createClass({
        getInitialState: function(){
            return {
                codeMirror: false
            };
        },
        componentDidMount: function(){
            var code = CodeMirror.fromTextArea(document.getElementById('console'), {
                mode        : "javascript",
                theme       : "material",
                lineNumbers : true,
                readOnly    : true,
                lint        : false,
                lineNumbers : false
            });

            this.setState({codeMirror: code});
        },
        render: function(){
            if(this.state.codeMirror){
                var string = "";
                {this.props.logs.map(function(row, index){
                    if(index != 0){
                        string += "\n";
                    }
                    string += row.message.toString();
                })}
                this.state.codeMirror.setValue(string);
            }

            return (
                <div className="row">
                    <div className="col-xs-12">
                        <legend>Console</legend>
                        <textarea id="console"></textarea>
                    </div>
                </div>
            );
        }
    });

    /*
    Props:
    - (object)component: The Component object
    - (boolean)loading : Wether or not the component is still loading
    */
    var InputsForRightBar = React.createClass({
        getInitialState: function(){
            return {
                valuesForInputs : {}
            };
        },
        componentDidMount: function(){
            if(this.props.component){
                var target = this;
            }
        },
        inputChanged: function(name, event){
            var valuesForInputs = this.state.valuesForInputs;
            var value;
            if(event.hasOwnProperty('target')){
                value = event.target.value;
            }else{
                value = event;
            }

            valuesForInputs[name] = {
                name: name,
                value: value
            };

            this.props.valuesForInputs(valuesForInputs);
        },
        render: function(){
            var target = this;
            var inputs = "";

            if(this.props.component){
                inputs = (
                    <div className="col-xs-12">
                        {target.props.component.inputs.map(function(row, index){
                            var value = "";
                            if(target.state.valuesForInputs.hasOwnProperty(row.name)){
                                value = target.state.valuesForInputs[row.name].value;
                            }
                            var style = "";
                            var explanationError = "";
                            _.each(target.props.missing, function(row2){
                                if(row2.name == row.name){
                                    style = "has-error has-feedback";
                                }
                            });

                            _.each(target.props.incorrect, function(row2){
                                if(row2.expected.name == row.name){
                                    style = "has-error has-feedback";
                                    explanationError = "Expected: " + _.last(row2.expected.type) + " - Given : " + row2.given.type;
                                }
                            });

                            var stringVersionOfTheTypeOfTheInput = _.reduce(row.type, function(initial, next){
                                return initial+" - "+next;
                            });

                            var optionalLabel = "";
                            var styleForInputLabel = {fontSize: "75%", color: "white", paddingLeft: "3px", paddingRight: "3px", paddingBottom: "1px", borderRadius: "5px"};
                            if(row.is_optional){
                                optionalLabel = (<span style={_.extend({backgroundColor: "#9c27b0"}, styleForInputLabel)}>optional</span>);
                            }

                            return (
                                <div className={"form-group input-xs " + style} key={"inputsForRightBar"+row.name}>
                                    <label style={{marginBottom: "0px"}}><span style={_.extend({backgroundColor: "darkgray"}, styleForInputLabel)}>{stringVersionOfTheTypeOfTheInput}</span> {optionalLabel} <span style={_.extend({backgroundColor: "#2196f3"}, styleForInputLabel)}>{row.name}</span></label>
                                        <input type="text"
                                               value={value}
                                               style={{height: "initial"}}
                                               onChange={target.inputChanged.bind(null, row.name)}
                                               className="form-control"/>
                                       {explanationError}
                                </div>
                            );
                        })}
                    </div>
                );
            }

            /*
            <Typeahead onSelected={target.inputChanged.bind(null, row.name)}
                       typeContent="text"
                       className="form-control"
                       options={_.map(_.filter(target.state.cacheInput, function(cacheInput){
                           return ((cacheInput.name_input == row.name) && (stringVersionOfTheTypeOfTheInput == cacheInput.type_data))
                       }), function(cacheInput){
                           return {
                               value : cacheInput.data,
                               text  : cacheInput.data
                           };
                       })}
                       onChange={target.inputChanged.bind(null, row.name)}
                       openedOnfocus={true}/>
            */

            /*
            <p style={{textAlign: "center"}}>Store values in a <b>profile</b> to avoid re-typing them all the time</p>
            <div className="col-lg-12" style={{textAlign: "center"}}>
                <button className="btn btn-xs btn-default">Create profile</button>
            </div>
            <div className="col-lg-12">
                <select className="form-control">
                    <option>Test</option>
                </select>
            </div>
            */
            var content = (<div></div>);
            if(this.props.component){
                if(this.props.component.inputs.length){
                    content = (
                        <div className="row-fluid">
                            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 card">
                                <p style={{textAlign: "center"}}>Try some values for the inputs</p>
                                {inputs}
                            </div>
                        </div>);
                }
            }

            return content;
        }
    });

    // Displays the right bar (Run button, Results status, Console)
    RightBar = React.createClass({
        getInitialState: function(){
            return {
                running         : false,
                execution_start : new Date(),
                logs            : [],
                status          : "",
                timeout         : false,
                results         : "",
                missing         : [], // Missing parameters when executed
                incorrect       : [], // Parameters when incorrect types when executed
                valuesForInputs : {}
            };
        },
        componentDidMount: function(){
            var target = this;

            // Save the state of tabs in the url query
            $(ReactDOM.findDOMNode(this)).find('.nav-tabs').on('shown.bs.tab', function (e) {
                urlH.insertParam('tab', $(e.target).attr('aria-controls'));
            });

            // A tab is available in the url query, we switch to it directly
            if(urlH.getParam('tab')){
                $(ReactDOM.findDOMNode(this)).find('.nav-tabs a[aria-controls=' + urlH.getParam('tab') + ']').tab('show');
            }
        },
        formatInput: function(type, string){
            switch (type) {
                case "text":
                    return string;
                    break;

                case "number":
                    return Number(string);
                    break;

                case "bool":
                    return Boolean(string);
                    break;

                case "date":
                    return new Date(string);
                    break;

                case "json":
                    var json = "{}";
                    try {
                        return JSON.parse(string);
                    } catch (e) {
                        return "";
                    }
                    break;
            }
        },
        runComponent: function(){
            var target = this;
            if(this.state.timeout){
                window.clearTimeout(this.state.timeout);
            }

            /*if(!this.state.running){*/
                var target = this;
                    target.setState({logs:[], results: "", status: "loading", missing: [], incorrect: [], execution_start: new Date()});

                var answered = false;

                var inputs = {};

                _.each(Object.keys(target.state.valuesForInputs), function(key){
                    var inputFromComponent;
                    _.each(target.props.component.inputs, function(row){
                        if(row.name == key){
                            inputFromComponent = row;
                        }
                    });

                    if(inputFromComponent){
                        inputs[key] = target.formatInput(inputFromComponent.type[0], target.state.valuesForInputs[key].value);
                    }else{
                        var copyValuesForInputs = target.state.valuesForInputs;
                        delete copyValuesForInputs[key];
                        target.setState({valuesForInputs: copyValuesForInputs});
                    }
                });


                // Scroll to the results
                $('html, body').animate({
                    scrollTop: $(ReactDOM.findDOMNode(target)).find('#results').offset().top
                }, 300);

                Synchronise.Cloud.run("executeComponent", _.extend({id_component: urlH.getParam("id")}, inputs), {
                    success: function(data){
                        var exec_time = (new Date().getTime()-target.state.execution_start.getTime())/1000;
                        target.setState({status: "success", results: data, execution_time: exec_time});
                        answered = true;
                    },
                    error: function(err){
                        if(err.code == 102){
                            target.setState({missing: err.missing});
                        }else if (err.code == 101) {
                            target.setState({incorrect: err.incorrect});
                        }

                        target.setState({status: "error", results: err});
                        answered = true;
                    },
                    always: function(){
                    },
                    progress: function(){
                        target.setState({status: "progress"});
                    },
                    log: function(message){
                        var date = new Date();
                        var logs = target.state.logs;
                            logs.push({
                                date: date,
                                id: "log"+date.getTime(),
                                message: message
                            });

                        target.setState({logs: logs});
                    }
                });

                var timeout = window.setTimeout(function(){
                    if(!answered){
                        target.setState({status: "timeout"});
                    }
                    window.clearTimeout(timeout);
                }, 20000);

                target.setState({timeout: timeout});
            /*}*/
        },
        valuesForInputs: function(valuesForInputs){
            this.setState({valuesForInputs: valuesForInputs});
        },
        render: function(){
            var content = (
                <div id="rightBar">
                    <Loader/>
                </div>
            );

            var tabsForSections = "";
            var classForContentRightBar = "card";
            var urlForDocumentation = "/docs#a93231e6-dbda-4eee-a610-4c544b956647"; // Clients documentation
            if(!this.props.component.is_forked && this.props.component.user_id == Synchronise.User.current().id){
                tabsForSections = (
                    <div className="col-xs-12">
                        <ul className="nav nav-tabs" role="tablist" style={{textAlign: "center"}}>
                            <li role="presentation" className="active" style={{float: "none", display: "inline-block "}}><a href="#code" aria-controls="code" role="tab" data-toggle="tab">Code</a></li>
                            <li role="presentation" style={{float: "none", display: "inline-block "}}><a href="#setting" aria-controls="setting" role="tab" data-toggle="tab">Settings</a></li>
                            <li role="presentation" style={{float: "none", display: "inline-block "}}><a href="#export" aria-controls="export" role="tab" data-toggle="tab">Export</a></li>
                        </ul>
                    </div>
                );

                classForContentRightBar = "";
                urlForDocumentation = "/docs#864c8a50-d32c-41d7-b63d-7571efc874ac"; // Component documentation
            }

            var labelTryIt = "";
            if(this.props.component.is_forked){
                labelTryIt = (
                    <legend>Try it</legend>
                );
            }

            if(!this.props.loading){
                content = (
                    <div id="rightBar" className="row">
                        <div className="col-xs-12">
                            <div className="row" style={{marginBottom: "20px"}}>
                                <div style={{position: "absolute", right: "0px", marginTop: "0px", zIndex: 999, opacity: 0}} className="handIndicator"><img src="https://images.synchronise.io/handPointingLeft.png"/></div>
                                <div className="col-xs-12" style={{textAlign: "center"}}>
                                    <button className="btn btn-primary" onClick={this.runComponent}>Run</button>
                                    <a className="btn btn-info" href={urlForDocumentation} style={{marginLeft: "5px"}} target="_blank">Documentation</a>
                                </div>

                                {tabsForSections}
                            </div>

                            {labelTryIt}
                            <div className="row">
                                <div className="col-xs-12">
                                    <InputsForRightBar component={this.props.component}
                                                       missing={this.state.missing}
                                                       incorrect={this.state.incorrect}
                                                       valuesForInputs={this.valuesForInputs}/>
                                </div>
                            </div>

                            <div className={classForContentRightBar}>
                                <Results results={this.state.results}
                                         exec_time={this.state.execution_time}
                                         status={this.state.status}/>

                                <Console logs={this.state.logs}/>
                            </div>
                        </div>
                    </div>
                );
            }

            return content;
        }
    });
});
