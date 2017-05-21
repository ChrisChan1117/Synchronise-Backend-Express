dependenciesLoader(["$"], function () {
    initialize();
});

function resizeInterface() {
    // Set the device position
    $('.device').css({
        left: $(window).width() / 2 - $('.device').width() / 2,
        top: $(window).height() / 2 - $('.device').height() / 2,
        opacity: 1
    });

    $('.device img').load(function () {
        $('.device img').css({
            marginLeft: $('.device').width() / 2 - $('.device img').width() / 2,
            marginTop: $('.device').height() / 2 - $('.device img').height() / 2
        });
    });
}

function initialize() {
    resizeInterface();
    $(window).resize(function () {
        resizeInterface();
    });

    // Set the background dots
    var widthCount = $(window).width() / 17;
    var heightCount = $(window).height() / 17;
    var total = widthCount * heightCount;

    for (var i = 0; i < total; i++) {
        $('.main').append("<div class='boxes'><div class='circle'></div></div>");
    }
}