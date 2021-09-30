const router = require('express').Router()
const express = require('express')
const multer = require('multer')
router.use(express.static('public'))

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    let extArray = file.mimetype.split('/')
    let extension = extArray[extArray.length - 1]
    cb(null, file.fieldname + '-' + Date.now() + '.' + extension)
  },
})
const upload = multer({ storage: storage })

const db = require('../database/confix')

router.get('/register-election', (req, res) => {
  state1 = 'SELECT `name`, `price` FROM `election`'
  db.query(state1, (err, result) => {
    res.render('vote_register', { result })
  })
})

router.post('/register', upload.single('image'), (req, res) => {
  console.log(req.body, req.file)
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

router.get('/register-contest', (req, res) => {
  state1 = 'SELECT `name`, `price` FROM `contest`'
  db.query(state1, (err, result) => {
    res.render('contest_register', { result })
  })
})

router.post('/paid-contest', (req, res) => {
  //console.log()
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
