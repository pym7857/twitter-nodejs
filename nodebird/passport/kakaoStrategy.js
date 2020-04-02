const KakaoStrategy = require('passport-kakao').Strategy;

const { User } = require('../models');

module.exports = (passport) => {
    passport.use(new KakaoStrategy({
        /* KakaoStrategy의 첫번째 인자 : 전략에 관한 설정을 하는 곳 */
        clientID: process.env.KAKAO_ID,     // clientID: 카카오에서 발급해주는 아이디 -> 노출하지 않아야 하므로 .env에 넣는다.
        callbackURL:'/auth/kakao/callback', // callbackURL: 카카오로부터의 인증 결과를 받을 라우터 주소
    }, async (accessToken, refreshToken, profile, done) => {    /* KakaoStrategy의 두번째 인자 : 실제 전략을 수행하는 async 함수 */
                                                                // 4번째 인자인 done함수는 passport.authenticate의 콜백 함수( (authError, user, info) )    -> 그림 9.9
        try {
            const exUser = await User.findOne({ where: { snsId: profile.id, provider:'kakao' }});
            if (exUser) {
                done(null, exUser);
            } else {
                console.log('[로그] 카카오 에서 보내준 profile: ', profile);
                const newUser = await User.create({
                    email: profile._json && profile._json.kaccount_email,
                    nick: profile.displayName,
                    snsId: profile.id,
                    provider:'kakao',
                });
                done(null, newUser);
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};