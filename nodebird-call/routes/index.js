const express = require('express');
const axios = require('axios');

const router = express.Router();

/* 사용자가 토큰 인증 과정을 테스트해보는 라우터 [ GET /test ] */
router.get('/test', async (req, res, next) => {
    try {
        if (!req.session.jwt) { // 세션에 발급받은 토큰이 저장되어 있지 않다면,
            const tokenResult = await axios.post('http://localhost:8002/v1/token', {
                clientSecret: process.env.CLIENT_SECRET,
            });
            if (tokenResult.data && tokenResult.data.code === 200) { // 토큰 발급 성공
                req.session.jwt = tokenResult.data.token;   // 세션에 토큰 저장
            } else { // 토큰 발급 실패
                return res.json(tokenResult.data) // 발급 실패 사유 응답 
            }
        }
        // 발급받은 토큰으로 테스트
        const result = await axios.get('http://localhost:8002/v1/test', {
            headers: { authorization: req.session.jwt },    // 해당 주소에 헤더와 함께 GET요청을 보낸다.
                                                            // 보통 토큰은 HTTP 요청 헤더에 넣어서 보낸다.
        });
        return res.json(result.data); // 응답 결과는 await로 받은 객체의 data속성에 들어있다.
    } catch (error) {                   // result.data 와 tokenResult.data가 API 서버에서 보내주는 응답 값이다.
        console.error(error);
        if (error.response.status === 419) {
            return res.json(error.response.data);
        }
        return next(error);
    }
});

module.exports = router;