/**
 * v1 : 버전 1 ( 한 번 버전이 정해진 후에는 라우터를 함부로 수정하면 안됨 -> 다른 사람이 기존 API를 쓰고 있음을 항상 염두에 두어야 한다 )
 */

const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken, deprecated } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router(); 

router.use(deprecated);     // 이제 v1 라우터를 사용할 시에는 경고 메세지를 띄운다.

/* 토큰을 발급하는 라우터 [ POST /v1/token ] */
router.post('/token', async (req, res) => {
    const { clientSecret } = req.body;
    try {
        // 전달 받은 클라이언트 비밀키(client Secret)로, 도메인이 등록된 것인지를 먼저 확인 !
        const domain = await Domain.findOne({
            where: { clientSecret },
            include: {
                model: User,
                attribute: ['nick','id'],
            },
        });
        if (!domain) {
            return res.status(401).json({
                code: 401,
                message:'등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
            });
        }
        // 등록된 도메인 이라면, 토큰을 발급 
        const token = jwt.sign({    // 토큰 발급 : jwt.sign(토큰의 내용, 토큰의 비밀키, 토큰의 설정)
            id: domain.user.id,
            nick: domain.user.nick,
        }, process.env.JWT_SECRET, {
            expiresIn:'1m',     // 유효기간
            issuer:'nodebird',  // 발급자
        });
        return res.json({
            code: 200,
            message:'토큰이 발급되었습니다',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message:'서버에러',
        });
    }
});

/* 사용자가 발급받은 토큰을 테스트해볼 수 있는 라우터 [ GET /v1/test ] */
router.get('/test', verifyToken, (req, res) => {    // 토큰을 검증하는 미들웨어(routes/middlewares.js - verifyToken)를 거친 후,
    res.json(req.decoded);  // 검증이 성공했다면 토큰의 내용물을 응답으로 보내줍니다.
});

/* 내가 올린 포스트(게시글)을 가져오는 라우터 [ GET /posts/my ] */
router.get('/posts/my', verifyToken, (req, res) => {
    Post.findAll({ where: {userId: req.decoded.id} })
        .then((posts) => {
            console.log(posts);
            res.json({
                code: 200,
                payload: posts,
            });
        })
        .catch((e) => {
            console.error(e);
            return res.status(500).json({
                code: 500,
                message: '서버 에러',
            });
        });
});

/* 해시태그 검색 결과를 가져오는 라우터 [ GET /posts/hashtag/:title ] */
router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
    try {
        const hashtag = await Hashtag.find({ where: {title: req.params.title } });
        if(!hashtag) {
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다.',
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code: 200,
            payload: posts,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

module.exports = router;