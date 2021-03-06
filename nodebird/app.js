const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require('dotenv').config(); // 비밀 키 호출 

const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');  // 모델을 서버와 연결(1)
const passportConfig = require('./passport');   // require('./passport/index.js)와 동일

const app = express();
sequelize.sync();   // 모델을 서버와 연결(2)
passportConfig(passport);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 8001);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname,'uploads')));    // 업로드한 이미지를 제공할 라우터(/img)도 express.static 미들웨어로 uploads 폴더와 연결합니다.
                                                                    // 이제 uploads 폴더 내 사진들이 /img 주소로 제공됩니다.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));
app.use(flash());   // 에러메세지 보이기 
app.use(passport.initialize()); // 요청에 passport설정을 심는다.
app.use(passport.session());    // req.session 객체에 passport 정보를 저장한다.
                                // (req.session 객체는 express-session에서 생성하는것이므로 passport미들웨어는 express-session 미들웨어 보다 뒤에 연결해야 합니다.)
// 추가 했었던 라우터들을 app.js에 연결 
app.use('/', pageRouter);
app.use('/auth', authRouter);   
app.use('/post', postRouter);
app.use('/user', userRouter);

// 404 미들웨어
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// 에러 핸들링 미들웨어 
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err: {};
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});