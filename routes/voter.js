const router = require('express').Router()
const express = require('express')
router.use(express.static('public'))

router.get('/register-election', (req, res) => {
  res.render('vote_register')
})

router.get('/vote-election', (req, res) => {
  res.render('vote_election')
})

router.get('/vote-center', (req, res) => {
  res.render('vote_center')
})

module.exports = router
