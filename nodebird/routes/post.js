const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag, User } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

fs.readdir('uploads', (error) => {
    if (error) {
        console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
        fs.mkdirSync('uploads');
    }
});

const upload = multer({     // multer모듈에 옵션을 주어 upload변수에 대입
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null,'uploads/');    // 저장경로 : nodebird 폴더 아래 uploads 폴더로 지정 
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

/*
  upload는 미들웨어를 만드는 객체 이다.
  upload 변수는 미들웨어를 만드는 여러 가지 메서드를 가지고 있다.
  자주 쓰이는 것은 single, array, fields, none이다.
  - single은 하나의 이미지를 업로드할 때 사용하며, req.file 객체를 생성한다.
  - 속성 하나에 이미지를 여러개 업로드 했다면 array를, 여러 개의 속성에 이미지를 하나씩 업로드 했다면 fields를 사용.
  - none은 이미지를 올리지 않고 데이터만 multipart 형식으로 전송했을때 사용.
  
  - single : 이미지 하나는 req.file로, 나머지 정보는 req.body로
  - array, fields : 이미지들은 req.files로, 나머지 정보는 req.body로
  - none : 모든 정보를 req.body로 
*/

/* 이미지 업로드를 처리하는 라우터 */
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {   // 현재 NodeBird앱에서 AJAX로 이미지를 보낼 때 속성 이름을 img로 하고있다.
    // 이제, upload.single 미들웨어는 이 이미지를 처리하고 req.file 객체에 결과를 저장한다.
    console.log(req.file);
    res.json({ url: `/img/${req.file.filename}` }); // req.file.filename을 클라이언트로 보내서 나중에 게시글을 등록할 때 사용할 수 있게 한다. (= 즉, 현재 글쓰기 상태에서 이미지 업로드 된 상태)
});

/* 게시글 업로드를 처리하는 라우터 */
/* 
    이미지를 업로드 했다면 이미지 주소도 req.body.url로 전송된다.
    데이터 형식이 multipart이긴 하지만, 이미지 데이터가 들어 있지 않으므로 none메서드를 사용.
    (이미지 주소가 온것이지 이미지 테이터 자체가 온것이 아니다 !!)
*/
const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
    try {
        const post = await Post.create({    // 게시글(Post)을 데이터베이스에 저장 후,
            content: req.body.content,
            img: req.body.url,
            userId: req.user.id,
        });
        const hashtags = req.body.content.match(/#[^\s]*/g);    // 게시글 내용에서 해시태그를 정규표현식으로 추출.
        if (hashtags) {     // 추출한 해시태그들을 데이터베이스에 저장한 후,
            const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({ // Promise.all 메소드로 여러 프로미스 객체들을 한번에 모아서 처리할 수 있습니다. 이 메소드는 모든 프로미스가 성공하면 then, 하나라도 실패하면 catch로 연결됩니다.
                where: { title: tag.slice(1).toLowerCase() },   // slice() 메서드는 어떤 배열의 begin부터 end까지(end 미포함)에 대한 얕은 복사본을 새로운 배열 객체로 반환합니다. 원본 배열은 바뀌지 않습니다.
            })));
            await post.addHashtags(result.map(r => r[0]));  // post.addHashtags 메서드로 게시글과 해시태그의 관계를 PostHashtag 테이블에 넣는다. ???
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* 해시태그로 조회하는 [ /post/hashtag ] 라우터 */
router.get('/hashtag', async (req, res, next) => {
    const query = req.query.hashtag;    // 쿼리스트링으로 hashtag이름을 받고,
    if (!query) {                   // hashtag가 빈 문자열일 경우 
        return res.redirect('/');   // 메인페이지로 돌려보냄
    }
    try {
        const hashtag = await Hashtag.findOne({ where: { title: query }}); // 데이터베이스에서 해당 해시태그가 존재하는지 검색한 후,
        let posts = [];
        if (hashtag) {  // 있다면
            posts = await hashtag.getPosts({ include: [{ model: User }] }); // 시퀄라이즈에서 제공하는 getPosts 메서드로 모든 게시글을 가져옵니다.
        }
        return res.render('main', {     // main.pug
            title: `${query} | NodeBird`,
            user: req.user,
            twits: posts,   // 조회된 게시글만 twits에 넣어 렌더링 
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;