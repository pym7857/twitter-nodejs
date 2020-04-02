const express = require('express');

const { isLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

/* 다른 사용자를 팔로우할 수 있는 [ /user/:id/follow ] 라우터 */
/* :id 는 req.params.id 가 된다. */
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: req.user.id } });   // 팔로우할 사용자를 데이터베이스에서 조회한 후, -> 현재 로그인된 사용자 ???
        await user.addFollowing(parseInt(req.params.id, 10));   // 시퀄라이즈에서 추가한 addFollowing 메서드로 현재 로그인한 사용자와의 관계를 지정합니다.
                                                                // -> 팔로잉 관계가 생겼으므로 req.user에도 팔로워와 팔로잉 목록을 저장합니다.
                                                                // -> req.user를 바꾸려면 deserializeUser를 조작해야 합니다.
                                                                // -> passport/index.js 로 이동합시다.
        res.send('success');  
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;