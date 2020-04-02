/* 생성한 모델들을 시퀄라이즈에 등록합니다. */
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = require('./user')(sequelize, Sequelize);  // 유저
db.Post = require('./post')(sequelize, Sequelize);  // 게시글
db.Hashtag = require('./hashtag')(sequelize, Sequelize);  // 해시태그

db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);
db.Post.belongsToMany(db.Hashtag, { through:'PostHashtag' }); // 시퀄라이즈가 관계를 분석하여 PostHashtag라는 이름으로 테이블을 자동생성함. (컬럼 이름은 postId와 hashTagId입니다.)
db.Hashtag.belongsToMany(db.Post, { through:'PostHashtag' });
db.User.belongsToMany(db.User, {
  foreignKey:'followingId',
  as:'Followers', // as 옵션은 시퀄라이즈가 JOIN 작업 시 사용하는 이름입니다. as에 등록한 이름을 바탕으로 getFollowers등의 메서드를 자동으로 추가합니다.
  through:'Follow', // 시퀄라이즈가 관계를 분석하여 Follow 라는 이름으로 테이블을 자동생성함.
});
db.User.belongsToMany(db.User, {
  foreignKey:'followerId',
  as:'Followings',
  through:'Follow',
});

module.exports = db;
