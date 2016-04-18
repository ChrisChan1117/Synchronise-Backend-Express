(function(){
    dependenciesLoader(["$", "React", "ReactDOM", "Loader", "TimeAgo", "_"], function(){
        // DISPLAY ITEMS FOR THE DIFFERENT TYPES OF QUERY WE CAN CREATE
        var items = [{name:"item1", target:"insert"},
                     {name:"item2", target:"retrieve"},
                     {name:"item3", target:"update"},
                     {name:"item4", target:"delete"}];

        // Animate the buttons on click on the "Create query button"
        $(document).on('click', '.createQuery', function(){
            _.each(items, function(row){
                $('#createQuery .' + row.name + ', #createFirstQuery .' + row.name).addClass('move' + row.name);
            });

            window.setTimeout(function(){
                $('#createQuery .item, #createFirstQuery .item').addClass('moveitemHide');

                window.setTimeout(function(){
                    _.each(items, function(row){
                        $('#createQuery .' + row.name + ', #createFirstQuery .' + row.name).removeClass('move' + row.name);
                    });

                    $('#createQuery .item, #createFirstQuery .item').removeClass('moveitemHide');
                }, 300);
            }, 5000);
        });

        // Register clicks and actions on the buttons
        _.each(items, function(row){
            $(document).on('click', '#createQuery .' + row.name + ', #createFirstQuery .' + row.name, function(){
                document.location.href = "/query/" + row.target + "?id=" + projectId;
            });
        });

        // Set the sizes of the buttons
        // Returns the size of the widest item, we are gonna use that as the size for every others
        var maxWidthOfItems = _.max(items, function(row){
            // There is potentially multiple items
            var items = $('#createQuery .' + row.name + ', #createFirstQuery .' + row.name);
            var sizes = _.map(items, function(item){
                console.log($(item).css('width'));
                console.log($(item).width());
                return $(item).width();
            });
            return Math.max(sizes);
        });

        $('#createQuery .item, #createFirstQuery .item').css("width", maxWidthOfItems+"px");
        $('#createQuery .item, #createFirstQuery .item').css("width", maxWidthOfItems+"px");

        // ----------------------------------------------------------------------------------------------- //
        // Displays the list of queries
        var QueryList = React.createClass({
            getInitialState: function(){
                return {
                    queries: [],
                    loading: false,
                    ordering: { // Default ordering
                        ordering: "modified_at",
                        order   : "desc"
                    },
                    orderableFields: ["modified_at", "created_at", "name", "total_execution"]
                }
            },
            componentDidMount: function(){
                var target = this;

                target.setState({loading: true});

                Synchronise.Cloud.run("getQueriesForProject", {realtime: true, id_project: window.projectId}, {
                    success: function(data){
                        target.setState({
                            queries  : data.queries,
                            ordering : data.ordering
                        });
                    },
                    error: function(err){
                        new ModalErrorParse(err);
                    },
                    always: function(){
                        target.setState({loading: false});
                    }
                });
            },
            goToProjects: function(){
                document.location.href='/query';
            },
            changeOrdering: function(field){
                var target = this;
                var ordering = this.state.ordering;

                if(ordering.ordering == field){
                    if(ordering.order == "desc"){
                        ordering.order = "asc";
                    }else{
                        ordering.order = "desc";
                    }
                }else{
                    ordering.ordering = field;
                    ordering.order    = "desc";
                }

                target.setState({loading: true});
                Synchronise.Cloud.run("changeOrderingForQueriesInProject", {id_project: window.projectId, ordering: ordering});
            },
            render: function(){
                var target = this;
                var Loading = "";
                if(this.state.loading){
                    Loading = (<div><hr/><Loader/></div>);
                }

                var needToCreateQueryBlock = "";
                if(!this.state.queries.length){
                    needToCreateQueryBlock = (
                        <div>
                            <div className="row">
                                <div className="col-xs-12" style={{textAlign: "center"}}>
                                    <p>You did not create a query for this project yet. Start by creating a query!</p>
                                        <button className="btn btn-primary createQuery cbutton cbutton--effect-novak">Create query</button>
                                        <div id="createFirstQuery">
                                            <div className="item1 item inactive">
                                                    <i className="fa fa-plus-circle"></i><br/>Insert
                                            </div>

                                            <div className="item2 item">
                                                    <i className="fa fa-search"></i><br/>Retrieve
                                            </div>

                                            <div className="item3 item inactive">
                                                    <i className="fa fa-pencil-square-o"></i><br/>Update
                                            </div>

                                            <div className="item4 item inactive">
                                                    <i className="fa fa-trash-o"></i><br/>Delete
                                            </div>
                                        </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                var content = (
                    <div>
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="btn btn-default pull-left cbutton cbutton--effect-novak"
                                        onClick={this.goToProjects}>Back to projects</button>
                            </div>
                        </div>
                        {needToCreateQueryBlock}
                        {Loading}
                    </div>
                );

                var orderableValueContent = {};

                _.each(target.state.orderableFields, function(field){
                    if(target.state.ordering.ordering == field){
                        orderableValueContent[field] = <i className={"fa fa-sort-"+target.state.ordering.order}/>;
                    }else{
                        orderableValueContent[field] = "";
                    }
                });

                if(this.state.queries.length && !this.state.loading){
                    content = (
                        <div>
                            <div className="row">
                        		<div className="col-xs-12" style={{textAlign: "center"}}>
                        			<a className="btn btn-default pull-left" href="/query">Back to projects</a>

                                    <div id="createQuery">
                                        <button className="btn btn-primary pull-right createQuery cbutton">Create query</button>
                                        <div className="item1 item inactive">
                                            <i className="fa fa-plus-circle"></i><br/>Insert
                                        </div>

                                        <div className="item2 item">
                                            <i className="fa fa-search"></i><br/>Retrieve
                                        </div>

                                        <div className="item3 item inactive">
                                            <i className="fa fa-pencil-square-o"></i><br/>Update
                                        </div>

                                        <div className="item4 item inactive">
                                            <i className="fa fa-trash-o"></i><br/>Delete
                                        </div>
                                    </div>
                        		</div>

                        		<div className="col-xs-12">
                        			<hr/>
                        		</div>
                        	</div>

                            <table className="table table-striped table-responsive">
                                <thead>
                                    <tr>
                                        <th className="sort"
                                            onClick={target.changeOrdering.bind(null, "name")}
                                            data-field="name">Query name {orderableValueContent["name"]}</th>
                                        <th className="sort"
                                            onClick={target.changeOrdering.bind(null, "created_at")}
                                            data-field="createdAt">Created {orderableValueContent["created_at"]}</th>
                                        <th className="sort"
                                            onClick={target.changeOrdering.bind(null, "modified_at")}
                                            data-field="updatedAt">Last modification {orderableValueContent["modified_at"]}</th>
                                        <th>Total execution {orderableValueContent["total_execution"]}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {target.state.queries.map(function(query, key){
                                        return (<QueryListItem id={query.id}
                                                               key={query.id}
                                                               type={query.type}
                                                               uniqueID={query.uniqueIdentifier}
                                                               name={query.name}
                                                               creationDate={query.created_at}
                                                               lastExecDate={null}
                                                               lastUpdateDate={query.modified_at}/>);
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                }

                return (<div>{content}</div>);
            }
        });

        var QueryListItem = React.createClass({
            getInitialState: function(){
                return {
                    style: {
                        opacity: 1
                    }
                };
            },
            goToQuery: function(){
                document.location.href = "/query/" + this.props.type + "?id=" + window.projectId + "&query=" + this.props.id+ "&block=dataSources";
            },
            deleteQuery: function(){
                this.setState({
                    style: {
                        opacity: 0.5
                    }
                });

                Synchronise.Cloud.run("deleteQuery", {id_query: this.props.id}, {
                    error: function(err){
                        new ModalErrorParse(err);

                        this.setState({
                            style: {
                                opacity: 1
                            }
                        });
                    }
                });
            },
            render: function(){
                return (
                    <tr style={this.state.style} data-id={this.props.id} data-type={this.props.type} data-identifier={this.props.uniqueID} className="query">
                        <td className="goToQuery" onClick={this.goToQuery}>{this.props.name}</td>
                        <td className="goToQuery" onClick={this.goToQuery}><TimeAgo date={new Date(this.props.creationDate)}/></td>
                        <td className="goToQuery" onClick={this.goToQuery}><TimeAgo date={new Date(this.props.lastUpdateDate)}/></td>
                        <td className="goToQuery" onClick={this.goToQuery}>Never</td>
                        <td><span className="remove" onClick={this.deleteQuery}><i className="fa fa-times"></i></span></td>
                    </tr>
                );
            }
        });

        ReactDOM.render(<QueryList />, document.getElementById("queryList"));
    });
}());
