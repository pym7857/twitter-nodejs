const express = require('express');
const uuidv4 = require('uuid/v4');
const { User, Domain } = require('../models');

const router = express.Router();

/* 루트 라우터 [ GET / ] : 접속시 로그인 화면을 보여준다. */
router.get('/', (req, res, next) => {
    User.findOne({
        where: { id: req.user && req.user.id },
        include: { model: Domain },
    })
        .then((user) => {
            res.render('login', {   // login.pug
                user,
                loginError: req.flash('loginError'),
                domains: user && user.domains,
            });
        })
        .catch((error) => {
            next(error);
        });
});

/* 도메인 등록 라우터 [ POST /domain ] : 폼으로부터 온 데이터를 도메인 모델에 저장 */
router.post('/domain', (req, res, next) => {
    Domain.create({
        userId: req.user.id,
        host: req.body.host,
        type: req.body.type,
        clientSecret: uuidv4(),     // clientSecret을 uuid모듈을 통해 생성.
                                    // uuid는 범용 고유 식별자(universally unique identifier)로 고유한 문자열을 만들고 싶을 때 사용한다.
    })
        .then(() => {
            res.redirect('/');
        })
        .catch((error) => {
            next(error);
        })
})

module.exports = router;