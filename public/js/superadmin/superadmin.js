var panelFlow;
(function () {
    dependenciesLoader(["Synchronise", "urlH", "$", "PanelFlow", "Panel", "Loader", "_"], function () {
        var topOfPage = $('#topOfPageForCalculation').offset().top;

        panelFlow = new PanelFlow('database', 'flowPanel');
        panelFlow.minHeight($(window).height() - topOfPage + 'px');
        panelFlow.maxHeight($(window).height() - topOfPage + 'px');

        panelFlow.init();
        panelFlow.scrollToBlock("databaseBlockPanel");

        var MenuTab = React.createClass({
            displayName: "MenuTab",
            getInitialState: function () {
                return { currentTab: "" };
            },
            componentDidMount: function () {
                var target = this;

                $(ReactDOM.findDOMNode(this)).find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                    var newTab = $(e.target).attr("href").replace("#", '');
                    urlH.insertParam('tab', newTab);
                });

                if (urlH.getParam('tab')) {
                    $(ReactDOM.findDOMNode(this)).find('#allTabs a[href="#' + urlH.getParam('tab') + '"]').tab('show');
                } else {
                    $(ReactDOM.findDOMNode(this)).find('#allTabs a').first().tab('show');
                }
            },
            render: function () {
                var database = "";
                if (_.find(Synchronise.User.current().roles, function (row) {
                    return row.name == "superadmin";
                })) {
                    database = React.createElement(
                        "li",
                        { role: "presentation" },
                        React.createElement(
                            "a",
                            { href: "#databaseTab", "aria-controls": "databaseTab", role: "tab", "data-toggle": "tab" },
                            "Database"
                        )
                    );
                }

                var populate = "";
                if (_.find(Synchronise.User.current().roles, function (row) {
                    return row.name == "superadmin";
                })) {
                    populate = React.createElement(
                        "li",
                        { role: "presentation" },
                        React.createElement(
                            "a",
                            { href: "#populate", "aria-controls": "populate", role: "tab", "data-toggle": "tab" },
                            "Populate"
                        )
                    );
                }

                var realtime = "";
                if (_.find(Synchronise.User.current().roles, function (row) {
                    return row.name == "superadmin";
                })) {
                    realtime = React.createElement(
                        "li",
                        { role: "presentation" },
                        React.createElement(
                            "a",
                            { href: "#realtime", "aria-controls": "realtime", role: "tab", "data-toggle": "tab" },
                            "Realtime"
                        )
                    );
                }

                var marketplace = "";
                if (_.find(Synchronise.User.current().roles, function (row) {
                    return row.name == "marketplace";
                })) {
                    marketplace = React.createElement(
                        "li",
                        { role: "presentation" },
                        React.createElement(
                            "a",
                            { href: "#marketplace", "aria-controls": "marketplace", role: "tab", "data-toggle": "tab" },
                            "MarketPlace"
                        )
                    );
                }

                var marketplaceValidation = "";
                if (_.find(Synchronise.User.current().roles, function (row) {
                    return row.name == "marketplaceValidation";
                })) {
                    marketplaceValidation = React.createElement(
                        "li",
                        { role: "presentation" },
                        React.createElement(
                            "a",
                            { href: "#MarketplaceValidation", "aria-controls": "MarketplaceValidation", role: "tab", "data-toggle": "tab" },
                            "MarketPlaceValidation"
                        )
                    );
                }

                return React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        { className: "col-lg-12 col-md-12 col-xs-12 col-sm-12" },
                        React.createElement(
                            "ul",
                            { className: "nav nav-tabs", role: "tablist", id: "allTabs" },
                            database,
                            populate,
                            realtime,
                            marketplace,
                            marketplaceValidation
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "col-lg-12 col-md-12 col-xs-12 col-sm-12" },
                        React.createElement("hr", null)
                    )
                );
            }
        });

        ReactDOM.render(React.createElement(MenuTab, null), document.getElementById("menuTab"));
    });
})();