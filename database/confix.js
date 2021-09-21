const config = require('../config')
const mysql = require('mysql')

const con = mysql.createConnection({
  host: config.HOST,
  port: config.DB_PORT,
  user: 'admin',
  password: config.PASSWORD,
  database: config.DATABASE,
  multipleStatements: true,
})

module.exports = con
