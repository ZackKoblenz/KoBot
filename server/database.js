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
      await connection.query(`CREATE SCHEMA IF NOT EXISTS twitch_app2`);
  
      // Use the new schema
      await connection.query(`USE twitch_app2`);
  
      // Create tables
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          profile_picture VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_username UNIQUE (username)
        )
      `);
  
      await connection.query(`
        CREATE TABLE IF NOT EXISTS commands (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          FOREIGN KEY user_id(user_id) REFERENCES users(id),
          command_name VARCHAR(50) NOT NULL,
          action VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_command_name UNIQUE unique_index(command_name, user_id)
        )
      `);
      
      await connection.query(`
        CREATE TABLE IF NOT EXISTS approved_users (
          streamer_id INT NOT NULL,
          command_id INT NOT NULL,
          FOREIGN KEY (command_id) REFERENCES commands(id),
          username VARCHAR(50) NOT NULL
        )
      `)
      console.log("Schema and tables created successfully");
  
      // Release the connection
      connection.release();
    } catch (err) {
      console.error('Error creating schema and tables:', err);
    }
  };
  
createTables();


//createUserQuery("zacho", "https://static-cdn.jtvnw.net/jtv_user_pictures/f33c3c9e-9567-4021-9858-8ba3707ec267-profile_image-300x300.png")

module.exports = pool;