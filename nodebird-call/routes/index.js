const express = require('express');
const axios = require('axios');

const router = express.Router();
const URL = 'http://localhost:8002/v2'; // nodebird-api 서버 (v2 라우터)
axios.defaults.headers.origin = 'http://localhost:8003'; // origin 헤더 추가 

/*  해당 주소(URL)에 헤더와 함께 요청을 보낸다. */
const request = async (req, api) => {
    try {
      if (!req.session.jwt) { // 세션에 토큰이 없으면
        const tokenResult = await axios.post(`${URL}/token`, {  // 토큰 발급 
          clientSecret: process.env.CLIENT_SECRET,
        });
        req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
      }
      return await axios.get(`${URL}${api}`, {  //  해당 주소(URL)에 헤더와 함께 요청을 보낸다.
        headers: { authorization: req.session.jwt },
      }); // API 요청
    } catch (error) {
      if (error.response.status === 419) { // 토큰 만료시 토큰 재발급 받기
        delete req.session.jwt;
        return request(req, api);
      } // 419 외의 다른 에러면
      return error.response;
    }
};

/* 자신이 작성한 포스트를 JSON 형식으로 가져오는 라우터 [ GET /mypost ] */
router.get('/mypost', async (req, res, next) => {
    try {
        const result = await request(req, '/posts/my'); // nodebird-api의 router-v1 참조 
        res.json(result.data);  // JSON형식으로 가져옴 
    } catch (e) {
        console.error(e);
        next(e);
    }
});

/* 해시태그를 검색하는 라우터 [ GET /search/:hashtag ] */
router.get('/search/:hashtag', async (req, res, next) => {
    try {
        const result = await request(
            req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,  // nodebird-api의 router-v1 참조 
        );
        res.json(result.data);  // JSON형식으로 가져옴 
    } catch (e) {
        if (e.code) {
            console.error(e);
            next(e);
        }
    }
});

router.get('/', (req, res) => {
    res.render('main', { key: process.env.CLIENT_SECRET });     // main.pug로 이동
})

module.exports = router;

/* 사용자가 토큰 인증 과정을 테스트해보는 라우터 [ GET /test ] */
/* 다른 서버로 요청을 보내기 위해서 axios 패키지를 사용했음 */
/* router.get('/test', async (req, res, next) => {
    try {
        if (!req.session.jwt) { // 세션에 발급받은 토큰이 저장되어 있지 않다면,
            const tokenResult = await axios.post('http://localhost:8002/v1/token', {
                clientSecret: process.env.CLIENT_SECRET,
            });
            if (tokenResult.data && tokenResult.data.code === 200) { // 토큰 발급 성공(200)했다면,
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
                                        // 정리해보면, result.data 와 tokenResult.data가 API 서버에서 보내주는 응답 값이다.
    } catch (error) {                   
        console.error(error);
        if (error.response.status === 419) {
            return res.json(error.response.data);
        }
        return next(error);
    }
});

module.exports = router; */