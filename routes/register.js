const route = require('express').Router()
const db = require('../database/confix')
const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')

var transporter = nodemailer.createTransport(
  smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
      user: 'wedecideinfo@gmail.com',
      pass: 'Anu08101897603',
    },
  }),
)

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

        var mailOptions = {
          from: 'wedecideinfo@gmail.com',
          to: email,
          subject: 'WeDecide Login Details',
          text: `Good Day ${name}! \nYou can now login and create your elections, Here are your login details \nUsername: ${username} \nPassword: ${password}`,
        }

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error)
          } else {
            console.log('Email sent: ' + info.response)
            res.redirect('/login')
          }
        })
      }
    })
  }
})

module.exports = route
