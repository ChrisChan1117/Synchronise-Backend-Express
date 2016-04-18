var Code;

dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "TimeAgo", "CodeMirror", "urlH", "InputType"], function(){
    var interval = window.setInterval(function(){
        if(typeof(CodeMirror.modes.javascript) != "undefined" &&
           typeof(CodeMirror.hint) != "undefined"){
            execute();
            window.clearInterval(interval);
        }
    }, 0);

    function execute(){
        // ----------------------------------- INPUTS -----------------------------------------------------
        // Props:
        // - (boolean)isOwner: Whether or not the current user is the owner of the component
        // - (array)inputs: the list of inputs of the component
        // - (function)typeChangedForInput: Callback to trigger when the type of an input changes
        // - (function)removeInput: Callback to trigger when an input is removed
        // - (function)changeValueIs_optional: Callback to trigger when an input goes from optional to none optional
        var Inputs = React.createClass({
            getInitialState: function(){
                return {
                    stateAddButton : "",
                    fieldValue     : ""
                };
            },
            addButton: function(){
                var target = this;
                if(target.state.stateAddButton == "active"){
                    target.setState({stateAddButton: ""});
                }else{
                    target.setState({stateAddButton: "active"});
                    $("#addInput").focus();
                }
            },
            inputChange: function(event){
                var target = this;
                    target.setState({fieldValue: event.target.value});
            },
            inputKeyDown: function(event){
                var target = this;
                if(event.key == "Enter"){
                    if(target.state.fieldValue.length){
                        var value = target.state.fieldValue.replace(/[^A-Z0-9]+/ig, "_");
                        target.props.addInput(value);
                        target.setState({fieldValue: "", stateAddButton: ""});
                        $("#addInput").blur();
                    }
                }
            },
            render: function(){
                var target = this;

                var inputsExplanation = "";
                if(this.props.isOwner){
                    inputsExplanation = (
                        <div style={{marginTop: "15px", textAlign: "center"}}>
                            <small style={{whiteSpace: "normal", fontSize: "small", fontFamily: "monospace"}}>Inputs are special parameters that your component can receive. They are accessible using the keyword <code>Input</code><br/> Ex: <code>Input.anInputName</code><br/> See the<a href="https://www.synchronise.io/docs?#80d15352-5e3e-486a-bcea-6cb64a2a9b30" alt="Documentation inputs"> Documentation</a> for more information.</small>
                        </div>
                    );
                }

                var addInputButton = "";
                if(this.props.isOwner){
                    addInputButton = (
                        <div id="addInputButton" className={this.state.stateAddButton} onClick={this.addButton}>
                            <i className={"fa fa-plus "+this.state.stateAddButton}> <div style={{display: "inline-block"}}>Add Input</div></i>
                        </div>
                    );
                }

                return (
                    <div className="col-xs-12">
                        <div className="card inline-form">
                            <div className="title">Inputs</div>
                            {this.props.inputs.map(function(row){
                                return <InputType inputName={row.name}
                                                  inputType={row.type}
                                                  typeChangedForField={target.props.typeChangedForInput}
                                                  remove={target.props.removeInput}
                                                  displayOptionalButton={true}
                                                  isOptional={row.is_optional}
                                                  changeOptional={target.props.changeValueIs_optional.bind(null, row)}
                                                  key={"input"+row.name}/>;
                            })}
                            <center>
                                {addInputButton}
                                <input type="text"
                                       id="addInput"
                                       value={this.state.fieldValue}
                                       className={"form-control "+this.state.stateAddButton}
                                       onKeyDown={this.inputKeyDown}
                                       typeChangedForField={target.props.typeChangedForInput}
                                       placeholder="Type input name then press return"
                                       onChange={this.inputChange}/>
                            </center>

                            {inputsExplanation}
                        </div>

                        <div id="separatorInputCode"></div>
                    </div>
                );
            }
        });

        // ----------------------------------- OUTPUTS -----------------------------------------------------
        // Props
        // - (boolean)isOwner: Whether or not the current user is the owner of the component
        // - (function)addOutput: Callback to trigger when an output is added
        // - (array)outputs: The list of outputs of the component
        // - (function)typeChangedForOutput: Callback to trigger when an output's type changes
        // - (function)removeOutput: Callback to trigger when an output is removed
        var Outputs = React.createClass({
            getInitialState: function(){
                return {
                    stateAddButton : "",
                    fieldValue     : ""
                };
            },
            addButton: function(){
                var target = this;
                if(target.state.stateAddButton == "active"){
                    target.setState({stateAddButton: ""});
                }else{
                    target.setState({stateAddButton: "active"});
                    $("#addOutput").focus();
                }
            },
            inputChange: function(event){
                var target = this;
                    target.setState({fieldValue: event.target.value});
            },
            inputKeyDown: function(event){
                var target = this;
                if(event.key == "Enter"){
                    if(target.state.fieldValue.length){
                        var value = target.state.fieldValue.replace(/[^A-Z0-9]+/ig, "_");
                        target.props.addOutput(value);
                        target.setState({fieldValue: "", stateAddButton: ""});
                        $("#addOutput").blur();
                    }
                }
            },
            render: function(){
                var target = this;

                var outputExplanation = "";
                if(this.props.isOwner){
                    outputExplanation = (
                        <div style={{textAlign: "center"}}>
                            <small style={{whiteSpace: "normal", fontSize: "small", fontFamily: "monospace"}}>Outputs are special parameters that your component can return. You can set the value of an Output using the keyword <code>Output</code><br/> Ex:<code>Output.anOutputName</code><br/>See the <a href="https://www.synchronise.io/docs?#41593f3d-227d-41d3-8ba5-b42359421bae" alt="Documentation outputs">Documentation</a> for more information</small>
                        </div>
                    );
                }

                var addOutputButton = "";
                if(this.props.isOwner){
                    addOutputButton = (
                        <div id="addOutputButton" className={this.state.stateAddButton} onClick={this.addButton}>
                           <i className={"fa fa-plus "+this.state.stateAddButton}> <div style={{display: "inline-block"}}>Add Output</div></i>
                        </div>
                    );
                }

                return (
                    <div className="col-xs-12">
                        <div id="separatorOutputCode"></div>

                        <div className="card inline-form">
                            <div className="title">Outputs</div>
                                {this.props.outputs.map(function(row){
                                    return <InputType inputName={row.name}
                                                      inputType={row.type}
                                                      typeChangedForField={target.props.typeChangedForOutput}
                                                      remove={target.props.removeOutput}
                                                      key={"output"+row.name}/>;
                                })}

                                <center>
                                    {addOutputButton}
                                    <input type="text"
                                           id="addOutput"
                                           value={this.state.fieldValue}
                                           className={"form-control "+this.state.stateAddButton}
                                           onKeyDown={this.inputKeyDown}
                                           typeChangedForField={target.props.typeChangedForOutput}
                                           placeholder="Type output name then press return"
                                           onChange={this.inputChange}/>
                                </center>

                                {outputExplanation}
                        </div>
                    </div>
                );
            }
        });

        // ----------------------------------- BLOC OF CODE -----------------------------------------------------
        // Displays the Tab to edit the code
        // Props
        // - (object)component: The component's data
        // - (array)inputs: The list of inputs
        // - (function)typeChangedForInput: Callback to trigger when an input's type changes
        // - (function)changeValueIs_optional: Callback to trigger when an input goes from optional to none optional
        // - (function)removeInput: Callback to trigger when an input is removed
        // - (function)addInput: Callback to trigger when an input is added
        // - (array)outputs: The list of outputs
        // - (function)typeChangedForOutput: Callback to trigger when an output's type changes
        // - (function)removeOutput: Callback to trigger when an output is removed
        // - (function)addOutput: Callback to trigger when an output is added
        Code = React.createClass({
            getInitialState: function(){
                return {
                    saving             : false,
                    intervalNameTyping : false,
                    query              : false,
                    code               : "",
                    codeMirror         : false,
                    error              : false,
                    name               : "",
                    queryComponent     : false,
                    lastHint           : new Date() // Last time someone typed something on the keyboard
                };
            },
            componentDidMount: function(){
                var target = this;
                // DEFINE THE CODE EDITOR
                // Displays errors in the code
                function parseErrors(r,e){for(var a=0;a<r.length;a++){var i=r[a];if(i){var c,n;if(c=[],i.evidence){var o=c[i.line];if(!o){var t=i.evidence;o=[],Array.prototype.forEach.call(t,function(r,e){"	"===r&&o.push(e+1)}),c[i.line]=o}if(o.length>0){var s=i.character;o.forEach(function(r){s>r&&(s-=1)}),i.character=s}}var v=i.character-1,f=v+1;i.evidence&&(n=i.evidence.substring(v).search(/.\b/),n>-1&&(f+=n)),i.description=i.reason,i.start=i.character,i.end=f,e.push({message:i.description,severity:i.severity,from:CodeMirror.Pos(i.line-1,v),to:CodeMirror.Pos(i.line-1,f)})}}}

                CodeMirror.registerHelper("lint", "javascript", function(text, options){
                    if (!window.JSHINT) return [];
                    JSHINT(text, options, options.globals);
                    var errors = JSHINT.data().errors, result = [];
                    if (errors) parseErrors(errors, result);
                    return result;
                });

                var code = CodeMirror.fromTextArea(document.getElementById('code_editor'), {
                    mode              : "javascript",
                    theme             : "material",
                    lineNumbers       : true,
                    autofocus         : true,
                    tabSize           : 6,
                    gutters           : ["CodeMirror-lint-markers", "CodeMirror-foldgutter"],
                    lint              : true,
                    foldGutter        : true,
                    matchBrackets     : true,
                    autoCloseBrackets : true,
                    styleActiveLine   : true
                });
                code.on("change", target.codeChanged);

                CodeMirror.hint.javascript = function(cm) {
                    var Pos = CodeMirror.Pos;
                    var pos = code.getCursor();
                    var tok = code.getTokenAt(pos);

                    var inner = {
                        list: [],
                        from: Pos(pos.line, tok.start),
                        to: Pos(pos.line, tok.end)
                    };

                    /* Default javascript language words */
                    inner.list = inner.list.concat(["abstract","arguments","boolean","break","byte","case","catch","char","class*","const","continue","debugger","default","delete","do","double","else","enum*","eval","export*","extends*","false","final","finally","float","for","function","goto","if","implements","import*","in","instanceof","int","interface","let","long","native","new", "null","package","private","protected","public","return","short","static","super*","switch","synchronized","this","throw","throws","transient","true","try","typeof","var","void","volatile","while","with","yield"]);
                    inner.list = _.filter(inner.list, function(row){
                        return row.startsWith(tok.string);
                    });

                    var WORD = /[\w$]+/, RANGE = 500;

                    function anyword(options){
                        var word = options && options.word || WORD;
                        var range = options && options.range || RANGE;
                        var cur = code.getCursor(), curLine = code.getLine(cur.line);
                        var end = cur.ch, start = end;

                        while (start && word.test(curLine.charAt(start - 1))) --start;
                        var curWord = start != end && curLine.slice(start, end);

                        var list = options && options.list || [], seen = {};
                        var re = new RegExp(word.source, "g");
                        for (var dir = -1; dir <= 1; dir += 2) {
                          var line = cur.line, endLine = Math.min(Math.max(line + dir * range, code.firstLine()), code.lastLine()) + dir;
                          for (; line != endLine; line += dir) {
                            var text = code.getLine(line), m;
                            while (m = re.exec(text)) {
                              if (line == cur.line && m[0] === curWord) continue;
                              if ((!curWord || m[0].lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, m[0])) {
                                seen[m[0]] = true;
                                list.push(m[0]);
                              }
                            }
                          }
                        }

                        return list;
                    }

                    var customWords = ["mailgun", "twilio", "xero", "crypto", "Lazy", "_l", "IFTTTMaker", "clearbit", "stripe", "Buffer", "Promise", "_"];
                        // With uppercase
                        customWords = customWords.concat(_.map(target.props.component.inputs, function(row){
                            return {text: "Input."+row.name, displayText: "Input."+row.name, trigger: ["Input."+row.name, row.name]};
                        }));

                        customWords = customWords.concat(_.map(target.props.component.outputs, function(row){
                            return {text: "Output."+row.name, displayText: "Output."+row.name, trigger: ["Input."+row.name, row.name]};
                        }));

                        customWords.push({text: 'success();', displayText: "success();"});
                        customWords.push({text: 'progress(1, "message");', displayText: 'progress({step_number}, {message})'});
                        customWords.push({text: 'error("", 200);', displayText: "error({message}, {error_code})"});
                        customWords.push({text: 'console.log("");', displayText: "console.log"});
                        customWords.push({
                            text: 'request({\n  url: "",\n  json: true,\n  method: "get"\n}, function(err, response, body){\n  if(err){\n    error(err, 201);\n  }else{\n    success(body);\n  }\n});',
                            displayText: 'request',
                            trigger: ["request", "rest"]
                        });
                        customWords.push({
                            text: 'request({\n  url: "http://myurl.com",\n  json: true,\n  method: "get"\n}, function(err, response, body){\n  if(err){\n    error(err, 201);\n  }else{\n    success(body);\n  }\n});',
                            displayText: 'http request',
                            trigger: "http"
                        });
                        customWords.push({
                            text: 'request({\n  url: "https://myurl.com",\n  json: true,\n  method: "get"\n}, function(err, response, body){\n  if(err){\n    error(err, 201);\n  }else{\n    success(body);\n  }\n});',
                            displayText: 'https secure request',
                            trigger: "https"
                        });
                        customWords.push({
                            text: 'request({\n  url: "",\n  json: true,\n  method: "get"\n}, function(err, response, body){\n  if(err){\n    error(err, 201);\n  }else{\n    success(body);\n  }\n});',
                            displayText: 'http request with "get" method',
                            trigger: "http"
                        });
                        customWords.push({
                            text: 'request({\n  url: "",\n  json: true,\n  method: "post"\n}, function(err, response, body){\n  if(err){\n    error(err, 201);\n  }else{\n    success(body);\n  }\n});',
                            displayText: 'http request with "post" method',
                            trigger: "post"
                        });
                        customWords.push({
                            text: 'request({\n  url: "",\n  json: true,\n  method: "put"\n}, function(err, response, body){\n  if(err){\n    error(err, 201);\n  }else{\n    success(body);\n  }\n});',
                            displayText: 'http request with "put" method',
                            trigger: "put"
                        });
                        customWords.push({
                            text: 'request({\n  url: "",\n  json: true,\n  method: "delete"\n}, function(err, response, body){\n  if(err){\n    error(err, 201);\n  }else{\n    success(body);\n  }\n});',
                            displayText: 'http request with "delete" method',
                            trigger: "delete"
                        });

                    inner.list = inner.list.concat(_.filter(anyword({list: customWords}), function(row){
                        if(typeof(row) == "object"){
                            var match = false;
                            if(row.text.toLowerCase().startsWith(tok.string.toLowerCase())){
                                match = true;
                            }
                            if(typeof(row.trigger) == "string"){
                                if(row.trigger.toLowerCase().startsWith(tok.string.toLowerCase())){
                                    match = true;
                                }
                            }else if (typeof(row.trigger) != "undefined") {
                                _.each(row.trigger, function(row2){
                                    if(row2.toLowerCase().startsWith(tok.string.toLowerCase())){
                                        match = true;
                                    }
                                })
                            }

                            return match;
                        }else{
                            return row.startsWith(tok.string);
                        }
                    }));

                    return inner;
                };

                code.on("keyup", function (cm, event) {
                    if (!cm.state.completionActive && /*Enables keyboard navigation in autocomplete list*/
                        event.keyCode >= 48 && /* Only letters or numbers */
                        event.keyCode <= 90
                    ) {
                        CodeMirror.commands.autocomplete(cm, null, {completeSingle: false});
                    }
                });

                this.setState({codeMirror: code});

                var interval = window.setInterval(function(){
                    if(target.props.component){
                        target.state.codeMirror.setValue(target.props.component.code);
                        target.state.codeMirror.refresh();
                        window.clearInterval(interval);
                    }
                }, 1);

                var query = Synchronise.Cloud.run("loadComponent", {id: urlH.getParam("id"), realtime: true}, {
                    success: function(data){
                        if(!target.state.saving && target.isMounted()){
                            target.setState({name: data.name});
                        }
                    },
                    always: function(){
                        if(target.isMounted()){
                            target.setState({loading: false});
                        }
                    }
                });

                target.setState({query: query});

                if(target.state.needToSave && !target.state.saving){
                    target.setState({needToSave: false, saving: true});

                    Synchronise.Cloud.run("updateComponent", {id: urlH.getParam("id"), data:{code:target.state.code}}, {
                        success: function(){
                            target.setState({error: false});
                        },
                        always: function(){
                            target.setState({saving: false});
                        },
                        error: function(err){
                            target.setState({error: err.err});
                        }
                    });
                }
            },
            // Select all the text on focus on the identifier
            onFocusIdentifier: function(event){
                $(event.target).select();
            },
            codeChanged: function(event){
                var answered = false;
                var target = this;
                    target.setState({
                        code       : event.getValue(),
                        needToSave : true,
                        saving     : true
                    });

                Synchronise.Cloud.run("updateComponent", {id: urlH.getParam("id"), data:{code: event.getValue()}}, {
                    success: function(){},
                    always: function(){
                        target.setState({saving: false});
                        answered = true;
                    }
                });

                window.setTimeout(function(){
                    if(!answered){
                        target.codeChanged(event);
                    }
                }, 5000);
            },
            inputAdded: function(fieldName){
                target.props.addInput(fieldName);
            },
            render: function(){
                var savingStatus = "";
                var inputs = "";
                var outputs = "";
                if(!this.state.loading){
                    var right = "19px";
                    var marginTop = "-35px";

                    if(this.state.codeMirror){
                        // Only one line of code or less
                        if(this.state.codeMirror.lineCount() <= 1){
                            right = "73px";
                            marginTop = "-23px";
                        }
                    }

                    if(this.props.component.user_id == Synchronise.User.current().id){
                        if(this.state.saving){
                            savingStatus = (<span className="label label-primary" style={{position: "absolute", right: right, marginTop: marginTop, zIndex: 1}}>Saving</span>);
                        }else{
                            if(!this.state.error){
                                savingStatus = (<span className="label label-success" style={{position: "absolute", right: right, marginTop: marginTop, zIndex: 1}}>Saved</span>);
                            }else{
                                savingStatus = (<span className="label label-danger" style={{position: "absolute", right: right, marginTop: marginTop, zIndex: 1}}>Syntax error</span>);
                            }
                        }
                    }

                    if(this.props.component){
                        inputs = (
                            <div className="row-fluid" id="inputs">
                                <Inputs inputs={this.props.component.inputs}
                                        typeChangedForInput={this.props.typeChangedForInput}
                                        changeValueIs_optional={this.props.changeValueIs_optional}
                                        removeInput={this.props.removeInput}
                                        isOwner={this.props.component.user_id == Synchronise.User.current().id}
                                        addInput={this.props.addInput}/>
                            </div>
                        );

                        outputs = (
                            <div className="row-fluid" id="outputs">
                                <br/>
                                <Outputs outputs={this.props.component.outputs}
                                         typeChangedForOutput={this.props.typeChangedForOutput}
                                         removeOutput={this.props.removeOutput}
                                         isOwner={this.props.component.user_id == Synchronise.User.current().id}
                                         addOutput={this.props.addOutput}/>
                            </div>
                        );
                    }
                }

                var language = "";
                var right = "19px";
                var marginTop = "-18px";
                if(this.state.codeMirror){
                    // Only one line of code or less
                    if(this.state.codeMirror.lineCount() <= 1){
                        marginTop = "-23px";
                    }
                }
                language = (<span className="label label-default" style={{ position: "absolute", marginTop: marginTop, right: right, zIndex: 1}}>Node.JS</span>);

                return (
                    <div className="row">
                        <div className="col-xs-12">
                            {inputs}

                            <div className="row">
                                <div className="col-xs-12">
                                    <textarea id="code_editor"></textarea>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-xs-12" style={{textAlign: "right"}}>
                                    {savingStatus}
                                    {language}
                                </div>
                            </div>

                            {outputs}
                        </div>
                    </div>
                );
            }
        });
    }
});
