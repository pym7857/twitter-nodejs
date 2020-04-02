const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

/* 회원가입 라우터 [ POST /auth/join ] */
router.post('/join', isNotLoggedIn, async(req, res, next) => {
    const { email, nick, password } = req.body;
    try {
        const exUser = await User.findOne({ where: {email} });
        if (exUser) {
            req.flash('joinError','이미 가입된 이메일입니다.');
            return res.redirect('/join');
        }
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            email,
            nick,
            password: hash,
        });
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

/* 로그인 라우터 [ GET /auth/login ] */
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => { // passport.authenticate('local') 미들웨어가 로컬 로그인 전략을 수행. 
                                                                // 미들웨어인데 라우터 미들웨어 안에 들어있다. 
                                                                // 미들웨어에 사용자 정의 기능을 추가하고 싶을 때 보통 이렇게 한다. 
                                                                // 이럴 때는 내부 미들웨어에 (req,res,next)를 인자로 제공해서 호출.)
        if (authError) {    // 실패 
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            req.flash('loginError', info.message);
            return res.redirect('/');
        }
        return req.login(user, (loginError) => {    // req.login 메서드를 호출 (passport는 req 객체에 login과 logout 메서드를 추가한다.)
                                                    // req.login은 passport.serializeUser를 호출한다.
                                                    // req.login에 제공하는 user 객체가 serializeUser로 넘어가게 된다.
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

/* 로그아웃 라우터 [ GET /auth/logout ] */
router.get('/logout', isLoggedIn, (req, res) => {
    req.logout();           // req.user 객체를 제거
    req.session.destroy();  // req.session 객체의 내용을 제거 
    res.redirect('/');
});

module.exports = router;

/* 카카오 로그인 라우터 [ GET /auth/kakao ] */
/* layout.pug의 카카오톡 버튼에 href='/auth/kakao' 링크가 붙어 있음. */
router.get('/kakao', passport.authenticate('kakao'));

/* 
    [ GET /auth/kakao ]에서 카카오 로그인 창으로 리다이렉트를 하고,
    결과를 [ GET /auth/kakao/callback ]으로 받습니다.
*/

/**
 * 로컬 로그인과 다른 점은 passport.authenticate 메서드에 콜백 함수를 제공하지 않는다.
 * 카카오 로그인은 내부적으로 req.login을 호출하므로 우리가 직접 호출할 필요가 없다.
 * 콜백 함수 대신에 로그인에 실패했을 때 어디로 이동할지를 객체 안 failureRedirect 속성에 적어주고,
 * 성공시에도 어디로 이동할지를 다음 미들웨어에 적어줍니다.
 */
router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect:'/',
}), (req, res) => {
    res.redirect('/');
});

module.exports = router;