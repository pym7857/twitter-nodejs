/* 각 라우터들에 API 사용량 제한이 추가된 버전 */
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

/* 
   nodebird-call의 프런트에서 nodebird-api의 서버API를 호출하려면 어떻게 해야할까 ?
   -> 응답은 서버가 보내는 것이기 때문에 nodebird-api에 cors모듈을 설치해야한다.

   router.use(cors());  

   만약 v2라우터에 속한 '모든 라우터'에 cors미들웨어를 적용한다면...문제점
   1. localhost:8003에 접속해보면 토큰이 발급된 것을 볼 수 있다.
   2. 이 토큰을 사용해서 다른 API 요청을 보낼 수 있다.
   3. 응답 헤더를 보면 Access-Control-Allow-Origin이 *으로 되어있다.
   4. *은 모든 클라이언트의 요청을 허용한다는 뜻이다.
   5. "이제 문제가 생겼다." 요청을 보내는 주체가 클라이언트라서 비밀키가 모두에게 노출된다.
   6. 이 비밀키를 가지고 다른 도메인들이 API 서버에 요청을 보낼 수 있게 되버렸다.
*/

/* 따라서, 호스트와 비밀키가 모두 일치할 때만 CORS를 허용하도록 하자 */
router.use(async (req, res, next) => {
    const domain = await Domain.findOne({
        where: { host: url.parse(req.get('origin')).host }, // 클라이언트 도메인(req.get('origin'))과 호스트가 일치하는것이 있는지 검사
                                                            // http나 https같은 프로토콜을 떼어낼 때는 url.parse 메서드를 사용
    });
    if (domain) {   // 일치하는 것이 있다면,
        cors({ origin: req.get('origin') })(req, res, next);    // cors를 허용해서 다음 미들웨어로 보냅니다.
                                                                // [origin속성]에 허용할 도메인만 따로 적어준다. (*처럼 모든 도메인을 허용하는 대신 기입한 도메인만 허용)
    } else {    // 일치하는 것이 없다면,
        next(); // cors없이 next를 호출합니다.
    }
});
/* 
    9장의 passport.authenticate 미들웨어처럼 cors미들웨어에도 (req, res, next)인자를 직접 주어 호출했습니다.
    미들웨어의 작동 방식을 커스터마이징하고 싶을 때 하는 방법이라고 설명했습니다.
    다음 두 코드가 같은 역할을 한다는 것을 기억해두면 다양하게 활용할 수 있습니다.

   router.use(cors());

   router.use((req, res, next) => {
       cors()(req, res, next);
   });
*/

/* 토큰을 발급하는 라우터 [ POST /v1/token ] */
router.post('/token', apiLimiter, async (req, res) => {
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
            expiresIn:'30m',     // 유효기간: 30분
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
router.get('/test', verifyToken, apiLimiter, (req, res) => {    // 토큰을 검증하는 미들웨어(routes/middlewares.js - verifyToken)를 거친 후,
    res.json(req.decoded);  // 검증이 성공했다면 토큰의 내용물을 응답으로 보내줍니다.
});

/* 내가 올린 포스트(게시글)을 가져오는 라우터 [ GET /posts/my ] */
router.get('/posts/my', apiLimiter, verifyToken, (req, res) => {
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
router.get('/posts/hashtag/:title', verifyToken, apiLimiter, async (req, res) => {
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