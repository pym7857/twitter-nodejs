/* 로그인 전략을 구현 */
const LocalStrategy = require('passport-local').Strategy;   // passport-local 모듈에서 Strategy 생성자를 불러와 사용한다.
const bcrypt = require('bcrypt');

const { User } = require('../models');

module.exports = (passport) => {
    passport.use(new LocalStrategy({
        /* LocalStrategy의 첫번째 인자 : 전략에 관한 설정을 하는 곳 */
        usernameField: 'email',     // req.body.email에 이메일이 담겨 들어온다.      -> 'email'
        passwordField: 'password',  // req.body.password에 비밀번호가 담겨 들어온다. -> 'password'
    }, async (email, password, done) => {   /* LocalStrategy의 두번째 인자 : 실제 전략을 수행하는 async 함수 */
                                            // 세번째 인자인 done함수는 passport.authenticate의 콜백 함수( (authError, user, info) )    -> 그림 9.9
        try {
            const exUser = await User.findOne({ where: { email } });   // 데이터베이스에서 일치하는 이메일이 있는지 찾는다.
            if (exUser) {
                const result = await bcrypt.compare(password, exUser.password); // 비밀번호를 비교
                if (result) {
                    done(null, exUser); // 비밀번호까지 일치했다면 done함수의 두번째 인자로 사용자 정보를 넣어 보낸다.
                } else {
                    done(null, false, { message:'비밀번호가 일치하지 않습니다.' });
                }
            } else {
                done(null, false, { message:'가입되지 않은 회원입니다.' });
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};