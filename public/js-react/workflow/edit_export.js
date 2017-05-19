var Export;
dependenciesLoader(["$", "React", "ReactDOM", "_", "Loader", "urlH"], function(){
    jQuery.fn.selectText = function(){
        this.find('input').each(function() {
            if($(this).prev().length == 0 || !$(this).prev().hasClass('p_copy')) {
                $('<p class="p_copy" style="position: absolute; z-index: -1;"></p>').insertBefore($(this));
            }
            $(this).prev().html($(this).val());
        });
        var doc = document;
        var element = this[0];
        if (doc.body.createTextRange) {
            var range = document.body.createTextRange();
            range.moveToElementText(element);
            range.select();
        } else if (window.getSelection) {
            var selection = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };

    // Displays the export block of a workflow
    // Props:
    // - (string)id
    // - (boolean)loading
    // - (object)inputs
    Export = React.createClass({
        displayName: "Export",
        getInitialState: function(){
            return {
                public_key  : "",
                loading_key : false
            };
        },
        componentDidMount: function(){
            var needToCreatePublicKey = false;
            var target = this;
                target.setState({loading_key: true});

            if(!Synchronise.User.current().public_key){
                needToCreatePublicKey = true;
            }

            if(needToCreatePublicKey){
                Synchronise.Cloud.run("createPublicKey", {"type": "javascript"}, {
                    success: function(key){
                        target.setState({public_key: key.status});
                        Synchronise.User.fetchCurrent(); // Refresh local data
                        Synchronise.init(key.status);
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({loading_key: false});
                    }
                });
            }else{
                var pk = Synchronise.User.current().public_key;
                target.setState({public_key: pk});
                Synchronise.init(pk);
            }
        },
        selectUniqueIdentifier: function(){
            $(ReactDOM.findDOMNode(this)).find('.queryUniqueIdentifier').selectText();
        },
        render: function(){
            var public_key_javascript = "Loading...";
            var public_key_nodejs     = "Loading...";
            if(this.state.public_key){
                public_key_javascript = this.state.public_key;
                public_key_nodejs = this.state.public_key;
            }

            var implementIt = "";

            var content = <Loader/>;
            if(!this.props.loading && this.props.id){
                content = (
                    <div>
                        {implementIt}
                        <div>
                            <p style={{fontSize: "20px", fontWeight: "bold", textAlign: "center"}}>
                                <span>Workflow unique identifier </span>&nbsp;&nbsp;
                                <span className="code" onClick={this.selectUniqueIdentifier} style={{cursor: "pointer"}}>
                                    <code className="plain queryUniqueIdentifier">{this.props.id}</code>
                                </span>
                            </p>

                            <ul className="nav nav-tabs" role="tablist">
                                <li role="presentation" className="active">
                                    <a href="#javascript" aria-controls="javascript" role="tab" data-toggle="tab">Javascript</a>
                                </li>

                                <li role="presentation">
                                    <a href="#nodejs" aria-controls="nodejs" role="tab" data-toggle="tab">Node.JS</a>
                                </li>

                                <li role="presentation">
                                    <a href="#rest" aria-controls="rest" role="tab" data-toggle="tab">REST</a>
                                </li>
                            </ul>

                            <br/>

                            <div className="tab-content">
                                <div role="tabpanel" className="tab-pane active" id="javascript">
                                    <center><a className="btn btn-info btn-sm" href="/docs#79b8a5e0-4de5-4dec-a4c4-df989d686607 ">Javascript Client library documentation</a></center><br/>
                                    <ExportJavascript workflow_id={this.props.id} public_key={public_key_javascript} inputs={this.props.inputs}/>
                                </div>
                                <div role="tabpanel" className="tab-pane" id="nodejs">
                                    <center><a className="btn btn-info btn-sm" href="/docs#8a46492d-0f9c-4280-b199-c2dfe10b4dba">Node.JS Client library documentation</a></center><br/>
                                    <ExportNodeJS workflow_id={this.props.id} public_key={public_key_nodejs} inputs={this.props.inputs}/>
                                </div>
                                <div role="tabpanel" className="tab-pane" id="rest">
                                    <center><a className="btn btn-info btn-sm" href="/docs#b382c473-6652-426b-9075-b5dd8b6659df">REST API documentation</a></center><br/>
                                    <ExportREST workflow_id={this.props.id} public_key={public_key_nodejs} inputs={this.props.inputs}/>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            return content;
        }
    });

    // Props:
    // - (string)public_key_content: The public key of the developer for javascript
    // - (string)workflow_id: The component id
    // - (object)inputs: The inputs required for the workflow
    var ExportJavascript = React.createClass({
        displayName: "ExportJavascript",
        selectImport: function(){
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function(){
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        selectExecute: function(){
            $(ReactDOM.findDOMNode(this)).find('.execute').selectText();
        },
        render: function(){
            var paramsFormatted = "";
            for(var i = 0; i < this.props.inputs.length; i++){
                var row = this.props.inputs[i];
                if(i != 0){
                    paramsFormatted+= ", ";
                }

                paramsFormatted += row.name + ":";
                switch (row.type[0]) {
                    case "text":
                        paramsFormatted += '""';
                        break;

                    case "number":
                        paramsFormatted += '0';
                        break;

                    case "json":
                        paramsFormatted += '{}';
                        break;

                    case "date":
                        paramsFormatted += '"' + new Date().toISOString() + '"';
                        break;

                    case "bool":
                        paramsFormatted += ' true';
                        break;
                }

                if(i == this.props.inputs.length-1){
                    paramsFormatted+= "\n";
                }
            }

            return (
                <ol>
                    <li>
                        <legend>Import the Synchronise.JS library in your project</legend>
                        <div className="code import" onClick={this.selectImport} style={{cursor: "pointer"}}><code className="plain">&lt;</code><code className="keyword">script</code> <code className="color1">src</code><code className="plain">=</code><code className="string">"/js/1.0.min.js"</code><code className="plain">&gt;&lt;/</code><code className="keyword">script</code><code className="plain">&gt;</code></div>
                    </li>

                    <li>
                        <legend>Initialize the library with your Public Key</legend>
                        <div className="code init" onClick={this.selectInit} style={{cursor: "pointer"}}><code className="keyword">Synchronise</code><code className="plain">.init(</code><code className="string">"{this.props.public_key}"</code><code className="plain">);</code></div>
                    </li>

                    <li>
                        <legend>Execute the Workflow</legend>
                        <div className="code execute" onClick={this.selectExecute} style={{cursor: "pointer"}}>
                            <code className="keyword">Synchronise</code>
                            <code className="plain">.Workflow.run(</code><code className="string">"{this.props.workflow_id}"</code>
                            <code className="plain">, {`{`}<br/>&nbsp;&nbsp;&nbsp;&nbsp;{paramsFormatted}{`}, {`}</code><br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;<code className="keyword">success</code>
                                <code className="plain">: {`function`}(</code>
                                    <code className="keyword">data</code>
                                    <code className="plain">){`{`}</code><br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code className="plain">console.log(data);</code><br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;<code className="plain">},</code><br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;<code className="keyword">error</code>
                                <code className="plain">: {`function`}(</code>
                                    <code className="keyword">err</code>
                                    <code className="plain">){`{`}</code><br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code className="plain">console.log(err);</code><br/>
                                    &nbsp;&nbsp;<code className="plain">&nbsp;&nbsp;},</code><br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;<code className="keyword">always</code>
                                <code className="plain">: {`function`}(</code>
                                    <code className="plain">){`{`}</code>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code className="plain"></code><br/>
                                    &nbsp;&nbsp;<code className="plain">&nbsp;&nbsp;}</code><br/>
                                <code className="plain">});</code>
                        </div>
                    </li>
                </ol>
            );
        }
    });

    var ExportNodeJS = React.createClass({
        displayName: "ExportNodeJS",
        selectImport: function(){
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function(){
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        selectExecute: function(){
            $(ReactDOM.findDOMNode(this)).find('.execute').selectText();
        },
        render: function(){
            var paramsFormatted = "";
            for(var i = 0; i < this.props.inputs.length; i++){
                var row = this.props.inputs[i];
                if(i != 0){
                    paramsFormatted+= ", ";
                }

                paramsFormatted += row.name + ":";
                switch (row.type[0]) {
                    case "text":
                        paramsFormatted += '""';
                        break;

                    case "number":
                        paramsFormatted += '0';
                        break;

                    case "json":
                        paramsFormatted += '{}';
                        break;

                    case "date":
                        paramsFormatted += '"' + new Date().toISOString() + '"';
                        break;

                    case "bool":
                        paramsFormatted += ' true';
                        break;
                }

                if(i == this.props.inputs.length-1){
                    paramsFormatted+= "\n";
                }
            }

            return (
                <ol>
                    <li>
                        <legend>Import the Synchronise NPM package in your project</legend>
                        <div className="code import" onClick={this.selectImport} style={{cursor: "pointer"}}><code className="plain">npm install synchronise</code></div>
                    </li>


                    <li>
                        <legend>Require the package and initialize it with your Public Key</legend>
                        <div className="code init" onClick={this.selectInit} style={{cursor: "pointer"}}><code className="plain">var </code><code className="keyword">Synchronise</code> = <code className="plain">require(</code><code className="string">"synchronise"</code><code className="plain">)(</code><code className="string">"{this.props.public_key}"</code><code className="plain">);</code></div>
                    </li>

                    <li>
                        <legend>Execute the Workflow</legend>
                        <div className="code execute" onClick={this.selectExecute} style={{cursor: "pointer"}}>
                            <code className="keyword">Synchronise</code>
                            <code className="plain">.Workflow.run(</code><code className="string">"{this.props.workflow_id}"</code>
                            <code className="plain">, {`{`}<br/>&nbsp;&nbsp;&nbsp;&nbsp;{paramsFormatted}{`}, {`}</code><br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;<code className="keyword">success</code>
                                <code className="plain">: {`function`}(</code>
                                    <code className="keyword">data</code>
                                    <code className="plain">){`{`}</code><br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code className="plain">console.log(data);</code><br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;<code className="plain">},</code><br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;<code className="keyword">error</code>
                                <code className="plain">: {`function`}(</code>
                                    <code className="keyword">err</code>
                                    <code className="plain">){`{`}</code><br/>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code className="plain">console.log(err);</code><br/>
                                    &nbsp;&nbsp;<code className="plain">&nbsp;&nbsp;},</code><br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;<code className="keyword">always</code>
                                <code className="plain">: {`function`}(</code>
                                    <code className="plain">){`{`}</code>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code className="plain"></code><br/>
                                    &nbsp;&nbsp;<code className="plain">&nbsp;&nbsp;}</code><br/>
                                <code className="plain">});</code>
                        </div>
                    </li>
                </ol>
            );
        }
    });

    var ExportREST = React.createClass({
        displayName: "ExportREST",
        selectExecute: function(){
            $(ReactDOM.findDOMNode(this)).find('.execute').selectText();
        },
        render: function(){
            var paramsFormatted = "";
            for(var i = 0; i < this.props.inputs.length; i++){
                var row = this.props.inputs[i];
                if(i != 0){
                    paramsFormatted+= ", ";
                }

                paramsFormatted += '"' + row.name + '":';
                switch (row.type[0]) {
                    case "text":
                        paramsFormatted += '""';
                        break;

                    case "number":
                        paramsFormatted += '0';
                        break;

                    case "json":
                        paramsFormatted += '{}';
                        break;

                    case "date":
                        paramsFormatted += '"' + new Date().toISOString() + '"';
                        break;

                    case "bool":
                        paramsFormatted += ' true';
                        break;
                }
            }

            return (
                <ol>
                    <li>
                        <legend>Execute the Component</legend>
                        <div className="code execute" onClick={this.selectExecute} style={{cursor: "pointer"}}><code className="plain">
                        <code className="keyword">curl -X POST</code> \ <br/>
                        <code className="keyword">-H</code> <code className="string">"x-synchronise-public-key: {this.props.public_key}"</code> \ <br/>
                        <code className="keyword">-H</code> <code className="string">"Content-Type: application/json"</code> \ <br/>
                        <code className="keyword">-d</code> <code className="string">'{`{`}"id":"{this.props.workflow_id}", {paramsFormatted}}'</code> \ <br/>
                        <code className="keyword">https{`://`}api.synchronise.io/workflow/run</code>
                        </code></div>
                    </li>
                </ol>
            );
        }
    });
});
