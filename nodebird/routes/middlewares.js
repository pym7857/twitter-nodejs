exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {    // 로그인 중이면 req.isAuthenticated()는 true
        next();
    } else {
        res.status(403).send('로그인 필요');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {   // 로그인 중이 아니면 false
        next();
    } else {
        res.redirect('/');
    }
};