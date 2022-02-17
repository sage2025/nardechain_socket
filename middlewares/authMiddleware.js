exports.auth = function(req, res, next) {
    console.log(req.session)
    if(req.session.data.email !== undefined) {
        next();
    } else {
        res.redirect("/");
    }
}