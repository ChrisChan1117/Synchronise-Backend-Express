exports.home = function(req, res) {
    res.render('slides/slides', {
        js: Array('libraries/slides'),
        css: Array('made-by-synchronise/slides')
    });
};
