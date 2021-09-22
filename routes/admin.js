const router = require('express').Router()
const jwt = require('jsonwebtoken')
const express = require('express')

const verify = require('../config/validateAdmin')
const db = require('../database/confix')

router.use(express.static('public'))

//********** Route To The DashBoard ***************/
router.get('/', verify, (req, res, next) => {
  token = req.cookies.auth
  user_id = jwt.decode(token).id
  console.log(user_id)
  res.render('admin_dashboard')
})

//****************** The Route To Login In To DashBoard ********************/
router.post('/', (req, res) => {
  const username = req.body.username
  const password = req.body.password

  const userValidStm =
    'SELECT `id`,`username`, `password` FROM `admin` WHERE `username` = ?'

  db.query(userValidStm, [username], function (err, result) {
    if (err) throw err

    if (result.length === 0) {
      res.render('admin_login', {
        flashMessages: {
          error: 'Invalid username or password',
        },
      })
    } else if (result[0].password !== password) {
      res.render('admin_login', {
        flashMessages: {
          error: 'Invalid username or password',
        },
      })
    } else {
      const token = jwt.sign(
        {
          id: result[0].id,
        },
        'secret-hack-admin',
      )
      res.cookie('auth', token).redirect('/admin')
    }
  })
})

//****************** The Route To Create An Election ********************/
router.get('/create-election', verify, (req, res) => {
  res.render('create_election')
})

// ******************* Create Election ***********************//
router.post('/create-election', verify, (req, res) => {
  const { name, esd, eed, rsd, red, price, desp } = req.body
  token = req.cookies.auth
  user_id = jwt.decode(token).id
  console.log({ user_id, name, esd, eed, rsd, red, price, desp })
  if (
    (typeof name === 'undefined') |
    (typeof esd === 'undefined') |
    (typeof eed === 'undefined') |
    (typeof rsd === 'undefined') |
    (typeof red === 'undefined') |
    (typeof price === 'undefined') |
    (typeof desp === 'undefined')
  ) {
    res.redirect('/register')
  } else {
    // Check If email exist already
    const elecValidStm = 'SELECT `name` FROM `election` WHERE `name` = ?'
    db.query(elecValidStm, [name], (err, result) => {
      if (result.length !== 0) {
        res.redirect('/admin/create-election')
      } else {
        insertStatement =
          'Insert Into `election` (`admin_id`,`name`, `price`, `start_date`, `end_date`, `reg_start_date`, `reg_end_date`, `description`) VALUES (?,?,?,?,?,?,?,?)'
        db.query(insertStatement, [
          user_id,
          name,
          price,
          esd,
          eed,
          rsd,
          red,
          desp,
        ])
        res.redirect('/admin/manage-election')
      }
    })
  }
})

//************** Route To Get To All the Election ************/
router.get('/manage-election', (req, res) => {
  res.render('manage_election')
})

//*******************Route to the Election **************/
router.get('/election', (req, res) => {
  res.render('admin_election')
})

module.exports = router
