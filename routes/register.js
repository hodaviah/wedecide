const route = require('express').Router()
const db = require('../database/confix')

route.get('/', (req, res, next) => {
  res.render('admin_reg', {
    flashMessages: {},
  })
})

route.post('/', (req, res) => {
  const { name, username, email, password, conPass } = req.body

  if (
    (typeof name === 'undefined') |
    (typeof username === 'undefined') |
    (typeof email === 'undefined') |
    (typeof password === 'undefined') |
    (typeof conPass === 'undefined')
  ) {
    res.redirect('/register')
  } else {
    // Check If email exist already
    const userValidStm = 'SELECT `username` FROM `admin` WHERE `username` = ?'
    db.query(userValidStm, [username], (err, result) => {
      if (result.length !== 0) {
        res.redirect('/register')
      } else if (password !== conPass) {
        res.redirect('/register')
      } else {
        insertStatement =
          'Insert Into `admin` (`name`, `username`, `email`, `password`) VALUES (?,?,?,?)'
        db.query(insertStatement, [name, username, email, password])
        res.redirect('/login')
      }
    })
  }
})

module.exports = route
