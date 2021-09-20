const mysql = require('mysql')

const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wedecide',
  multipleStatements: true,
})

module.exports = con
