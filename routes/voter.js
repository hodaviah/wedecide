const router = require('express').Router()
const express = require('express')
const multer = require('multer')
const Flutterwave = require('flutterwave-node-v3')
const open = require('open')
const { v4: uuidv4 } = require('uuid')
const flw = new Flutterwave(
  'FLWPUBK-55d19607176ee44d7bd9ba125f5fddfb-X',
  'FLWSECK-d24f99a659db328bff380bff23059ebc-X',
)

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
  state1 = 'SELECT `id`, `name`, `price` FROM `contest`'
  db.query(state1, (err, result) => {
    res.render('contest_register', { result })
  })
})

router.post('/contest-register', (req, res) => {
  const {
    contest,
    username,
    email,
    phone,
    cardName,
    cardNo,
    mmyy,
    cvv,
  } = req.body

  const detailArr = contest.split('/')
  const expArr = mmyy.split('/')
  expiry_month = expArr[0].trim().toString()
  expiry_year = expArr[1].trim().toString()
  amount = detailArr[1].trim().toString()

  vouchar = `cv - ${uuidv4()}`
  const payload = {
    card_number: cardNo,
    cvv: cvv,
    expiry_month: expiry_month,
    expiry_year: expiry_year,
    currency: 'NGN',
    amount: amount,
    redirect_url: 'https://www.google.com',
    fullname: cardName,
    email: email,
    phone_number: phone,
    enckey: 'd24f99a659db2da72a7516f6',
    tx_ref: vouchar,
  }

  const chargeCard = async () => {
    try {
      const response = await flw.Charge.card(payload)
      console.log(response)
      if (response.meta.authorization.mode === 'pin') {
        let payload2 = payload
        payload2.authorization = {
          mode: 'pin',
          fields: ['pin'],
          pin: 3310,
        }
        const reCallCharge = await flw.Charge.card(payload2)

        const callValidate = await flw.Charge.validate({
          otp: '12345',
          flw_ref: reCallCharge.data.flw_ref,
        })
        console.log(callValidate)
      }
      if (response.meta.authorization.mode === 'redirect') {
        var url = response.meta.authorization.redirect
        open(url)
      }

      console.log(response)
    } catch (error) {
      console.log(error)
    }
  }

  chargeCard()
})

router.get('/contest-vote', (req, res) => {
  res.render('contest_vote')
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
