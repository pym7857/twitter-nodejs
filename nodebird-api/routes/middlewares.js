const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

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
        // 요청 헤더(req.headers.authorization)에 저장된 토큰을 사용합니다.
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

/* 라우터에 사용량 제한 */
exports.apiLimiter = new RateLimit({
    windowMs: 60 * 1000,    // 기준시간 : 1분
    max: 1,                 // 허용 횟수
    delayMs: 0,             // 호출 간격 
    handler(req, res) {     // 제한 초과시 콜백 함수 
        res.status(this.statusCode).json({
            code: this.statusCode,  // 기본값 429
            message: '1분에 한 번만 요청할 수 있습니다.',
        });
    },
});

/* 사용하면 안 되는 라우터에 붙여줄 것 */
exports.deprecated = (req, res) => {
    res.status(410).json({
        code: 410,
        message: '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.',
    });
};