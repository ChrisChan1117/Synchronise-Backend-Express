dependenciesLoader(["React", "ReactDOM", "$"], function () {
    // Debounce resize
    !function (n, r) {
        var t = function (n, r, t) {
            var e;return function () {
                function i() {
                    t || n.apply(u, a), e = null;
                }var u = this,
                    a = arguments;e ? clearTimeout(e) : t && n.apply(u, a), e = setTimeout(i, r || 100);
            };
        };jQuery.fn[r] = function (n) {
            return n ? this.bind("resize", t(n)) : this.trigger(r);
        };
    }(jQuery, "smartresize");

    var widthWindow = $(window).width();

    $(window).smartresize(function () {
        widthWindow = $(window).width();
        initInterface();
    });

    // Display content when page is loaded
    $('#content, .sidenav').animate({
        opacity: 1
    }, 300);

    // Size of the BIG Title
    function initInterface() {
        $("#docsTitleBlock").height($(window).height());
        $("#docsTitleBlock .content").height($(window).height() - 80);
        $("#docsTitleBlock .content").css('line-height', $(window).height() - 80 + "px");
        $('#docsTitleBlock .content span, .material-icons').css("opacity", 1);

        if (widthWindow > 992) {
            var topMarginSidenav = $("#docsTitleBlock .content").height() - $(window).scrollTop() + 80;
            if (topMarginSidenav < 0) {
                topMarginSidenav = 0;
            }
            $(".sidenav").css('top', topMarginSidenav);
            $("#sidebar .sidenav").css('max-height', $(window).height());
            $("#sidebar .sidenav").css('max-width', widthWindow - $('#content').width() - 60);
            $("#sidebar .sidenav").css('min-width', widthWindow - $('#content').width() - 60);
        } else {
            $(".sidenav").css('top', '0');
            $("#sidebar .sidenav").css('max-width', 'initial');
            $("#sidebar .sidenav").css('min-width', 'initial');
            $("#sidebar .sidenav").css('max-height', 'initial');
        }
    };

    initInterface();

    var navsections = $('.navsection');
    $(window).scroll(function () {
        // Position of the sidenav
        if (widthWindow > 992) {
            var topMarginSidenav = $("#docsTitleBlock .content").height() - $(window).scrollTop() + 80;
            if (topMarginSidenav < 0) {
                topMarginSidenav = 0;
            }
            $(".sidenav").css('top', topMarginSidenav);
        } else {
            $(".sidenav").css('top', '0');
        }

        // Color to choose for the sidenav
        var amountOfMatch = 0;
        var elements = [];
        navsections.each(function () {
            var scrollTop = $(window).scrollTop(),
                elementOffset = $(this).offset().top,
                distance = elementOffset - scrollTop;
            elements.push({ el: $(this), top: $(this).offset().top });

            if (distance >= 0 && distance <= 10) {
                amountOfMatch++;
                $('.sidenav').css('background-color', $(this).attr("data-background-color"));
                $('.sidebar .nav > li > a').css('color', $(this).attr("data-color"));
                $('.sidebar .nav > .active > a').css('color', $(this).attr("data-active-color"));
            }
        });

        if (!amountOfMatch) {
            _.each(elements, function (row) {
                if (row.top > $(window).scrollTop() && !amountOfMatch) {
                    amountOfMatch++;
                    $('.sidenav').css('background-color', row.el.attr("data-background-color"));
                    $('.sidebar .nav > li > a').css('color', row.el.attr("data-color"));
                    $('.sidebar .nav > .active > a').css('color', row.el.attr("data-active-color"));
                }
            });
        }
    });

    // Replace all of the elements of the docs that match a pattern

    // Public key
    $("code").each(function () {
        if (Synchronise.User.current()) {
            // user is connected
            // user has a javascript publuc key
            if (Synchronise.User.current().public_key) {
                $(this).html($(this).html().replace('{{public_key}}', Synchronise.User.current().public_key));
            }
        }
    });
});