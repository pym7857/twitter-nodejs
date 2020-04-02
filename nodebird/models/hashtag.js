module.exports = (sequelize, DataTypes) => (
    sequelize.define('hashtag', {
        title: {
            type: DataTypes.STRING(15), // 태그 이름을 저장 
            allowNull: false,
            unique: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
    })
);