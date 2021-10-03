const router = require('express').Router()
const express = require('express')
const multer = require('multer')
const Flutterwave = require('flutterwave-node-v3')
const open = require('open')
const { v4: uuidv4 } = require('uuid')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const smtpTransport = require('nodemailer-smtp-transport')
const verify = require('../config/validateContestVoter')

// Setting Up For Mailling
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

// For Flutterwave
const flw = new Flutterwave(
  'FLWPUBK-55d19607176ee44d7bd9ba125f5fddfb-X',
  'FLWSECK-d24f99a659db328bff380bff23059ebc-X',
)

router.use(express.static('public'))

// For Uploading files
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

// Datebase
const db = require('../database/confix')
const { render } = require('ejs')

//****************To Register to vote for an election */
router.get('/register-election', (req, res) => {
  state1 = 'SELECT `name`, `price` FROM `election`'
  db.query(state1, (err, result) => {
    res.render('vote_register', { result })
  })
})

router.post('/register', upload.single('image'), (req, res) => {
  console.log(req.body, req.file)
})

//************To Login befor you vote for an election */
router.get('/vote-election', (req, res) => {
  state1 = 'SELECT `name`, `price` FROM `election`'
  db.query(state1, (err, result) => {
    res.render('vote_election', { result })
  })
})

router.get('/webcam', (req, res) => {
  res.render('webcam')
})

//****************To Register to vote for an contest */
router.get('/register-contest', (req, res) => {
  state1 = 'SELECT `id`, `name`, `price` FROM `contest`'
  db.query(state1, (err, result) => {
    res.render('contest_register', { result })
  })
})

//************To Get info about the voter (Contest) and send an email with his/her vouchar details */
router.post('/contest-register', (req, res) => {
  const { contest, name, email, phone, cardName, cardNo, mmyy, cvv } = req.body

  const detailArr = contest.split('/')
  const expArr = mmyy.split('/')
  expiry_month = expArr[0].trim().toString()
  expiry_year = expArr[1].trim().toString()
  contest_id = detailArr[0].trim()
  amount = detailArr[1].trim().toString()
  contest_name = detailArr[2].trim()
  const vouchar = `cv-${uuidv4()}`

  statement =
    'Insert Into `contest_voter` (`name`, `email`, `voucher`, `phone`, `contest_id`) VALUES (?,?,?,?,?);'
  db.query(
    statement,
    [name, email, vouchar, phone, contest_id],
    (err, result) => {
      var mailOptions = {
        from: 'wedecideinfo@gmail.com',
        to: email,
        subject: 'WeDecide Login Details',
        text: `Good Day ${name}! \nYou can now partcipate in the contest: ${contest_name} by voting for your favorite contestant , Here is your vouchar \n${vouchar}`,
      }

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error)
        } else {
          console.log('Email sent: ' + info.response)
          res.redirect('/voter/contest-vote')
        }
      })
    },
  )

  //FIXME
  // const payload = {
  //   card_number: cardNo,
  //   cvv: cvv,
  //   expiry_month: expiry_month,
  //   expiry_year: expiry_year,
  //   currency: 'NGN',
  //   amount: amount,
  //   redirect_url: 'https://www.google.com',
  //   fullname: cardName,
  //   email: email,
  //   phone_number: phone,
  //   enckey: 'd24f99a659db2da72a7516f6',
  //   tx_ref: vouchar,
  // }

  // const chargeCard = async () => {
  //   try {
  //     const response = await flw.Charge.card(payload)
  //     console.log(response)
  //     if (response.meta.authorization.mode === 'pin') {
  //       let payload2 = payload
  //       payload2.authorization = {
  //         mode: 'pin',
  //         fields: ['pin'],
  //         pin: 3310,
  //       }
  //       const reCallCharge = await flw.Charge.card(payload2)

  //       const callValidate = await flw.Charge.validate({
  //         otp: '12345',
  //         flw_ref: reCallCharge.data.flw_ref,
  //       })
  //       console.log(callValidate)
  //     }
  //     if (response.meta.authorization.mode === 'redirect') {
  //       var url = response.meta.authorization.redirect
  //       open(url)
  //     }

  //     console.log(response)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  // chargeCard()
  //FIXME SOON
})

//***********************Route to in put the vouchar */
router.get('/contest-vote', (req, res) => {
  res.render('contest_vote')
})

//*******************Verify the Vouchar */
router.post('/contest-vote', (req, res) => {
  const vouchar = req.body.vouchar

  const userValidStm = 'SELECT * FROM `contest_voter` WHERE `voucher` = ?'

  db.query(userValidStm, [vouchar], function (err, result) {
    if (err) throw err

    if (result.length === 0) {
      res.render('used_vouchar')
    } else if (result[0].vote === 1) {
      res.render('used_vouchar')
    } else {
      const token = jwt.sign(
        {
          id: result[0].contest_id,
          voter_id: result[0].id,
          voter_name: result[0].name,
          voter_email: result[0].email,
        },
        'secret-hack-contest',
      )
      res.cookie('contest_auth', token).redirect('/voter/contest-center')
    }
  })
})

//**********************Route where they will cast vote (Election) */
router.get('/election-center', (req, res) => {
  token = req.cookies.auth
  id = jwt.decode(token).id
  voter_id = jwt.decode(token).voter_id
  console.log(voter_id)
  state0 = 'SELECT `id`, `name` FROM `election` WHERE `id` = ?;'
  state1 = 'SELECT * FROM `poll` WHERE `election_id` = ?;'
  state2 = 'SELECT * FROM `candidate` WHERE candidate.election_id = ?;'

  statement = state0 + state1 + state2
  db.query(statement, [id, id, id], (err, result) => {
    console.log(result)
    res.render('vote_center', { result })
  })
})

//**************** Route where they will cast vote (Contest)*/
router.get('/contest-center', verify, (req, res) => {
  token = req.cookies.contest_auth
  const id = jwt.decode(token).id
  voter_id = jwt.decode(token).voter_id
  console.log(voter_id)
  state0 = 'SELECT `id`, `name` FROM `contest` WHERE `id` = ?;'
  state1 = 'SELECT * FROM `contestant_poll` WHERE `contest_id` = ?;'
  state2 = 'SELECT * FROM `contestant` WHERE contestant.contest_id = ?;'

  statement = state0 + state1 + state2
  db.query(statement, [id, id, id], (err, result) => {
    res.render('contest_center', { result })
  })
})

//******************People vote for contestant */
router.post('/contest-center', (req, res) => {
  token = req.cookies.contest_auth
  voter_id = jwt.decode(token).voter_id
  voter_name = jwt.decode(token).voter_name
  voter_email = jwt.decode(token).voter_email
  var newdata = Object.values(req.body)
  if (newdata.length === 0) {
    res.send('Vote for at least one contestant')
  } else {
    for (let i = 0; i < newdata.length; i++) {
      state = 'Select `vote` From `contestant` Where `id` = ?;'
      db.query(state, [newdata[i]], (err, result) => {
        var res = parseInt(result[0].vote)
        res = res + 1

        vote_state = 'Update `contestant` Set `vote` = ? Where `id` = ?;'
        db.query(vote_state, [res, newdata[i]], (err, result) => {})
      })
    }
    upstate = 'Update `contest_voter` Set `vote` = 1 Where `id` = ?'
    db.query(upstate, [voter_id], (err, result) => {
      if (err) throw err

      var mailOptions = {
        from: 'wedecideinfo@gmail.com',
        to: voter_email,
        subject: 'WeDecide Login Details',
        text: `Good Day ${voter_name}! \nThank You for partcipating in the contest by voting for your favorite contestant.`,
      }

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error)
        } else {
          console.log('Email sent: ' + info.response)
        }
      })
    })
    res.cookie('contest_auth', null)
    res.redirect('/voter/thank-you')
  }
})

router.get('/thank-you', (req, res) => {
  res.render('thank_you')
})

module.exports = router
