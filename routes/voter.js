const router = require('express').Router()
const express = require('express')
router.use(express.static('public'))

const db = require('../database/confix')

router.get('/register-election', (req, res) => {
  state1 = 'SELECT `name`, `price` FROM `election`'
  db.query(state1, (err, result) => {
    res.render('vote_register', { result })
  })
})

router.get('/vote-election', (req, res) => {
  state1 = 'SELECT `name`, `price` FROM `election`'
  db.query(state1, (err, result) => {
    res.render('vote_election', { result })
  })
})

router.get('/vote-center', (req, res) => {
  res.render('vote_center')
})

router.get('/webcam', (req, res) => {
  res.render('webcam')
})

module.exports = router
