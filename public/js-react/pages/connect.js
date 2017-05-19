dependenciesLoader(["React", "ReactDOM", "$", "Loader", "Synchronise"], function(){
    var Connect = React.createClass({
        getInitialState: function(){
            return {
                public_key: ""
            };
        },
        componentDidMount: function(){
            Synchronise.LocalStorage.set("visitedConnect", true);

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
        render: function(){
            return (
                <div className="card">
                    <div>
                        <center><i className="fa fa-plug" style={{fontSize: "4em", color: "black"}}></i></center>
                        <legend style={{fontWeight: "100%", fontSize: "3em", textAlign: "center"}}>Connect</legend>
                    </div>

                    <div>
                        <p style={{fontSize: "1.5em", textAlign: "center"}}>Integrating our platform only takes a few seconds. You only need to do it once and for all!</p>
                    </div>

                    <div id="export">
                        <ul className="nav nav-tabs" role="tablist">
                            <li role="presentation" className="active"><a href="#javascript" aria-controls="javascript" role="tab" data-toggle="tab">Javascript</a></li>
                            <li role="presentation"><a href="#nodejs" aria-controls="nodejs" role="tab" data-toggle="tab">Node.JS</a></li>
                            <li role="presentation"><a href="#rest" aria-controls="rest" role="tab" data-toggle="tab">REST</a></li>
                        </ul>

                        <div className="tab-content" style={{marginTop: "20px"}}>
                            <div role="tabpanel" className="tab-pane fade in active" id="javascript"><ExportJavascript public_key={this.state.public_key}/></div>
                            <div role="tabpanel" className="tab-pane fade" id="nodejs"><ExportNodeJS public_key={this.state.public_key}/></div>
                            <div role="tabpanel" className="tab-pane fade" id="rest"><ExportREST public_key={this.state.public_key}/></div>
                        </div>
                    </div>
                </div>
            );
        }
    });

    // Props:
    // - (string)public_key: The public key of the developer for javascript
    var ExportJavascript = React.createClass({
        displayName: "ExportJavascript",
        selectImport: function(){
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function(){
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        render: function(){
            return (
                <ol>
                    <li>
                        <legend>Import the Synchronise.JS library in your app/project</legend>
                        <div className="code import" style={{cursor: "pointer"}} onClick={this.selectImport}><code className="plain">&lt;</code><code className="keyword">script</code> <code className="color1">src</code><code className="plain">=</code><code className="string">"/js/1.0.min.js"</code><code className="plain">&gt;&lt;/</code><code className="keyword">script</code><code className="plain">&gt;</code></div>
                    </li>

                    <li>
                        <legend>Initialize the library with your Public Key</legend>
                        <div className="code init" style={{cursor: "pointer"}} onClick={this.selectInit}><code className="keyword">Synchronise</code><code className="plain">.init(</code><code className="string">"{this.props.public_key}"</code><code className="plain">);</code></div>
                    </li>
                </ol>
            );
        }
    });

    // Props:
    // - (string)public_key: The public key of the developer for nodejs
    var ExportNodeJS = React.createClass({
        displayName: "ExportNodeJS",
        selectImport: function(){
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function(){
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        render: function(){
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
                </ol>
            );
        }
    });

    // Props:
    // - (string)public_key: The public key of the developer for rest
    var ExportREST = React.createClass({
        displayName: "ExportREST",
        selectImport: function(){
            $(ReactDOM.findDOMNode(this)).find('.import').selectText();
        },
        selectInit: function(){
            $(ReactDOM.findDOMNode(this)).find('.init').selectText();
        },
        render: function(){
            return (
                <div>
                    <center>The requests you make to our REST API need to be authenticated using your PUBLIC KEY.<br/>
                    All requests have to be executed using HTTPS, we do not provide an HTTP endpoint.</center>

                    <div className="code"><code className="plain">https://api.synchronise.io/[component|workflow]/run</code></div>

                    <ol style={{marginTop: "20px"}}>
                        <li>
                            <legend>Example request for component</legend>
                            <div className="code import" onClick={this.selectImport} style={{cursor: "pointer"}}><code className="plain">
                            <code className="keyword">curl -X POST</code> \ <br/>
                            <code className="keyword">-H</code> <code className="string">"x-synchronise-public-key: {this.props.public_key}"</code> \ <br/>
                            <code className="keyword">-H</code> <code className="string">"Content-Type: application/json"</code> \ <br/>
                            <code className="keyword">-d</code> <code className="string">'{`{`}"id":ID_COMPONENT, ... ANY OTHER PARAMETERS TO SEND}'</code> \ <br/>
                            <code className="keyword">https{`://`}api.synchronise.io/component/run</code>
                            </code></div>
                        </li>


                        <li>
                            <legend>Example request for workflow</legend>
                            <div className="code init" onClick={this.selectInit} style={{cursor: "pointer"}}><code className="plain">
                            <code className="keyword">curl -X POST</code> \ <br/>
                            <code className="keyword">-H</code> <code className="string">"x-synchronise-public-key: {this.props.public_key}"</code> \ <br/>
                            <code className="keyword">-H</code> <code className="string">"Content-Type: application/json"</code> \ <br/>
                            <code className="keyword">-d</code> <code className="string">'{`{`}"id":ID_WORKFLOW, ... ANY OTHER PARAMETERS TO SEND}'</code> \ <br/>
                            <code className="keyword">https{`://`}api.synchronise.io/workflow/run</code>
                            </code></div>
                        </li>
                    </ol>
                </div>
            );
        }
    });

    ReactDOM.render(<Connect/>, document.getElementById('connect'));
});
