exports.auth = function(req, res, next) {
    if(req.session.data.email !== undefined) {
        next();
    } else {
        res.redirect("/");
    }
}