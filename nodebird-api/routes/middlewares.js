const jwt = require('jsonwebtoken');

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

/* 토큰을 검증하는 미들웨어 */
exports.verifyToken = (req, res, next) => {
    try {
        // 요청 헤더에 저장된 토큰(req.headers.authorization)을 사용합니다.
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);    // jwt.verify(토큰, 토큰_비밀키) : 토큰을 검증하는 메서드
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {   // 기간이 만료된 경우
            return res.status(419).json({
                code: 419,
                message:'토큰이 만료되었습니다',
            });
        }
        return res.status(401).json({   // 비밀키가 일치하지 않는경우
            code: 401,
            message:'유효하지 않은 토큰입니다',
        });
    }
};