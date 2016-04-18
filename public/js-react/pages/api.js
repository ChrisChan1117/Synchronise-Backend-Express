(function(){
    dependenciesLoader(["React", "ReactDOM"], function(){
        var ApiKey = React.createClass({
            getInitialState: function(){
                // Keyboard shortcut for displaying the API Public Key
                Mousetrap.bind('mod+s', function(e) {
                    e.preventDefault();
                    this.displayPassword();
                });

                return {
                    isDisplayed: false,
                    password: ""
                };
            },
            displayPassword: function(){
                var _this = this;
                modalMessage.getPublicKey("Will be used to decrypt your Public Key", function(publicKey){
                    if(publicKey){
                        _this.setState({
                            isDisplayed: true,
                            password: publicKey
                        });
                    }
                });
            },
            selectPassword: function(e){
                e.target.setSelectionRange(0, e.target.value.length);
            },
            render: function(){
                return (
                    <div className="row-fluid">
                        <div className="col-lg-3 col-md-3 col-sm-1 col-xs-1"></div>
                        <div className="col-lg-6 col-md-6 col-sm-10 col-xs-10 api_key_container">
                            <input type="text" className="input-lg form-control" value={this.state.password} readOnly onClick={this.selectPassword} /><br/>
                            <button className="btn btn-default cbutton cbutton--effect-novak" onClick={this.displayPassword}><u>S</u>how Public Key</button>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-1 col-xs-1"></div>
                    </div>
                );
            }
        });

        ReactDOM.render(<ApiKey />, document.getElementById('api_key'));
    });
}());
