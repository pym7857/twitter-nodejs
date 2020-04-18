module.exports = (sequelize, DataTypes) => (
    sequelize.define('user', {
        email: {
            type: DataTypes.STRING(40),
            allowNull: true,
            unique: true,
        },
        nick: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        // SNS 로그인을 하였을 경우에는 provider와 snsId를 저장합니다.
        provider: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue:'local',
        },
        snsId: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: true,     // timestamps와 paranoid가 true이므로 
                            // createdAt, updatedAt, deletedAt 컬럼도 생성됨
    })
);