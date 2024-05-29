const sql = require('mysql2')
require('dotenv').config()

const pool = sql.createPool({
    "user": process.env.SQL_USER,
    "password": process.env.SQL_PASSWORD,
    "host": process.env.SQL_HOST,
    "database": process.env.SQL_DATABASE
})

//Connect to SQL Server
// pool.getConnection(function(err) {
//     if (err) throw err;
//     console.log("Connected!")
// })

const createTables = async () => {
    try {
      // Connect to the database
      const connection = await pool.promise().getConnection();
  
      // Create a new schema
      //await connection.query(`CREATE SCHEMA IF NOT EXISTS twitch_app`);
  
      // Use the new schema
      await connection.query(`USE mc154948`);
  
      // Create tables
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          profile_picture VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
  
      await connection.query(`
        CREATE TABLE IF NOT EXISTS commands (
          id INT AUTO_INCREMENT PRIMARY KEY,
          command_name VARCHAR(50) NOT NULL,
          action VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
  
      console.log("Schema and tables created successfully");
  
      // Release the connection
      connection.release();
    } catch (err) {
      console.error('Error creating schema and tables:', err);
    }
  };
  
createTables();

module.exports = pool.promise();