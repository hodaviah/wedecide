const config = require('../config')
const mysql = require('mysql')

// const con = mysql.createConnection({
//   host: config.HOST,
//   port: config.DB_PORT,
//   user: 'root',
//   password: config.PASSWORD,
//   database: config.DATABASE,
//   multipleStatements: true,
// })

const con = mysql.createConnection({
  host: 'mysql-51328-0.cloudclusters.net',
  port: 18842,
  user: 'admin',
  password: '81BvRcSq',
  database: 'wedecide',
  multipleStatements: true,
})

module.exports = con
