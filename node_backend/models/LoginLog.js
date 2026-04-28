const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('LoginLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    login_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    logout_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Doctor', 'Patient'),
      allowNull: false
    }
  }, {
    tableName: 'login_logs',
    timestamps: false
  });
};
