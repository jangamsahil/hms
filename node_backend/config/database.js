const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create connection to HMS Main DB
const sequelizeMain = new Sequelize(
  process.env.DB_NAME_MAIN,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // set to true for debugging
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Create connection to HMS Archive DB
const sequelizeArchive = new Sequelize(
  process.env.DB_NAME_ARCHIVE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Helper function to test connections
const testDbConnections = async () => {
  try {
    await sequelizeMain.authenticate();
    console.log('✅ Connected to HMS Main DB successfully.');
    await sequelizeArchive.authenticate();
    console.log('✅ Connected to HMS Archive DB successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the databases:', error);
  }
};

module.exports = {
  sequelizeMain,
  sequelizeArchive,
  testDbConnections
};
