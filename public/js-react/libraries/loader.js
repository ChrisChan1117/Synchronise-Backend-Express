var Loader;
var InfiniteLoader;

dependenciesLoader(["React", "ReactDOM"], function(){
    Loader = React.createClass({
        componentDidMount: function(){
            /*var svg = $('#loading').clone();
                svg.removeClass('hidden');

            var container = $(ReactDOM.findDOMNode(this));
                container.append(svg); // Insert the SVG into the loader*/
        },
        render: function(){
            return (
                <div className="spinner" style={{textAlign: "center"}}></div>
            );
        }
    });

    InfiniteLoader = React.createClass({
        componentDidMount: function(){
            $(ReactDOM.findDOMNode(this)).animate({
                opacity: 1
            }, 300);
        },
        render: function(){
            return (
                <div className='infiniteLoading'>
                    <div className='bullet'></div>
                    <div className='bullet'></div>
                    <div className='bullet'></div>
                    <div className='bullet'></div>
                </div>
            );
        }
    });
});
