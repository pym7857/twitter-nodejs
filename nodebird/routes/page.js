const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User } = require('../models');

const router = express.Router();

router.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', { title:'내 정보 - NodeBird', user: req.user });
});

router.get('/join', isNotLoggedIn, (req, res) => {
    res.render('join', {    // join.pug 페이지 렌더링
        title:'회원가입 - NodeBird',
        user: req.user,
        joinError: req.flash('joinError'),
    });
});

router.get('/', (req, res, next) => {
    Post.findAll({  // 데이터베이스에서 게시글을 조회한 뒤,
        include: {
            model: User,
            attributes: ['id','nick'],  // 게시글 작성자의 아이디와 닉네임을 JOIN해서 제공
        },
        order: [['createdAt','DESC']],  // 게시글의 순서는 최신순으로 정렬 
    })
    .then((posts) => {
        res.render('main', {    // main.pug
            title: 'NodeBird',
            twits: posts,       // 결과를 twits에 넣어 렌더링합니다.
            user: req.user,
            loginError: req.flash('longError'),
        });
    })
    .catch((error) => {
        console.error(error);
        next(error);
    });
});

module.exports = router;
