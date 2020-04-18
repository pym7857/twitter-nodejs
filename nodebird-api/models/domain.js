/* 도메인 모델 */
/* 도메인은 인터넷 주소를 뜻합니다. */

module.exports = (sequelize, DataTypes) => (
    sequelize.define('domain', {
        host: {     // 인터넷 주소
            type: DataTypes.STRING(80),
            allowNull: false,
        },
        type: {     // 도메인 종류
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        clientSecret: {     // 클라이언트 비밀키 (= API를 사용할 때 필요한 비밀키)
            type: DataTypes.STRING(40),
            allowNull: false,
        },
    }, {
        validate: {     // 데이터를 추가로 검증하는 속성 
            unknownType() {     // 검증기 
                console.log(this.type);
                if (this.type !=='free' && this.type !=='premium') {
                    throw new Error('type 컬럼은 free나 premium이어야 합니다.');
                }
            },
        },
        timestamps: true,
        paranoid: true,
    })
);