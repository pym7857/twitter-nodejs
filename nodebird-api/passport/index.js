const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const { User } = require('../models');

module.exports = (passport) => {
    /**
     * serializeUser는 req.session 객체에 어떤 데이터를 저장할지 선택합니다.
     * 매개변수로 user를 받아, done함수에 두번째 인자로 user.id만을 넘깁니다.
     * (세션에 사용자 정보를 모두 저장하면 세션의 용량이 커지고 데이터 일관성에 문제가 발생하므로 사용자의 아이디만 저장하라고 명령)
     */
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    /**
     * deserializeUser는 매 요청 시 실행됩니다.
     * passport.session() 미들웨어가 이 메서드를 호출합니다.
     * 좀 전에 serializeUser에서 세션에 저장했던 아이디(user.id)를 받아 데이터베이스에서 사용자 정보를 조회합니다.
     * 조회한 정보를 req.user에 저장하므로 앞으로 req.user를 통해 로그인한 사용자의 정보를 가져올 수 있습니다. 
     * 
     * 즉, serializeUser는 사용자 정보 객체를 세션에 아이디로 저장하는것이고,
     * deserializeUser는 세션에 저장한 아이디를 통해, 사용자 정보 객체를 불러오는것.
     */
    passport.deserializeUser((id, done) => {
        User.findOne({ 
            where: {id},    // 세션에 저장된 아이디 -> 데이터베이스에서 사용자 정보를 조회 
            include: [{     // 이때, 팔로잉 목록과 팔로워 목록도 같이 조회합니다.
                model: User,
                attiributes: ['id','nick'],
                as: 'Followers',
            }, {
                model: User,
                attiributes: ['id','nick'],     // 계속 attributes를 지정하고 있는데, 이는 실수로 비밀번호를 조회하는 것을 방지하기 위해서입니다.
                as:'Followings',
            }],
        })   
        .then(user => done(null, user)) // 조회한 정보를 req.user에 저장 
        .catch(err => done(err));
    });

    local(passport);    // 로컬 로그인 전략(strategy)에 대한 파일
    kakao(passport);    // 카카오 로그인 전략(strategy)에 대한 파일 
};