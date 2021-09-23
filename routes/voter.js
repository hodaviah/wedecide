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

router.get('/webcam', (req, res) => {
  res.render('webcam')
})

router.get('/:id', (req, res) => {
  const id = req.params.id
  state0 = 'SELECT `id`, `name` FROM `election` WHERE `id` = ?;'
  state1 = 'SELECT * FROM `poll` WHERE `election_id` = ?;'
  state2 = 'SELECT * FROM `candidate` WHERE candidate.election_id = ?;'

  statement = state0 + state1 + state2
  db.query(statement, [id, id, id], (err, result) => {
    console.log(result)
    res.render('vote_center', { result })
  })
})

module.exports = router
