const router = require('express').Router()
const jwt = require('jsonwebtoken')
const express = require('express')

const verify = require('../config/validateAdmin')
const db = require('../database/confix')

router.use(express.static('public'))

router.get('/', verify, (req, res, next) => {
  res.render('admin_dashboard')
})

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

router.get('/create-election', (req, res) => {
  res.render('create_election')
})

router.get('/manage-election', (req, res) => {
  res.render('manage_election')
})

router.get('/election', (req, res) => {
  res.render('admin_election')
})

router.get('/another-route', (req, res) => {
  // router code here
})

module.exports = router
