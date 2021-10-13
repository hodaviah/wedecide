const router = require('express').Router()
const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')

const storage = multer.memoryStorage()
const upload = multer({ storage })
const { v4: uuidv4 } = require('uuid')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const smtpTransport = require('nodemailer-smtp-transport')
const verify = require('../config/validateContestVoter')
const verifyElection = require('../config/validateElectionVote')

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

router.use(express.static('public'))
comment = {
  //TODO: Multer
  // For Uploading files
  // let storage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //     cb(null, './public/uploads')
  //   },
  //   filename: function (req, file, cb) {
  //     let extArray = file.mimetype.split('/')
  //     let extension = extArray[extArray.length - 1]
  //     cb(null, file.fieldname + '-' + Date.now() + '.' + extension)
  //   },
  // })
  // const upload = multer({ storage: storage })
  //TODO: End Multer
}

// Datebase
const db = require('../database/confix')
const { render } = require('ejs')

//****************To Register to vote for an election */
router.get('/register-election', (req, res) => {
  state1 =
    'SELECT * FROM `election`WHERE (CURRENT_TIMESTAMP BETWEEN `election`.`start_date` AND `election`.`end_date`)'
  db.query(state1, (err, result) => {
    res.render('vote_register', { result })
  })
})

router.post('/register-election', upload.single('image'), async (req, res) => {
  const { election, username, email, phone, password } = req.body
  const detailArr = election.split('/')
  fs.access('./public/uploads', (error) => {
    if (error) {
      fs.mkdirSync('./public/uploads')
    }
  })
  const userValidStm =
    'SELECT `username` FROM `voter` WHERE `username` = ? AND `election_id` = ?'
  db.query(userValidStm, [username, detailArr[0]], async (err, result) => {
    if (result.length !== 0) {
      res.redirect('/voter/register-election')
    } else {
      const vouchar = `ev-${uuidv4()}`
      insertStatement =
        'Insert Into `voter` ( `username`, `email`, `password`, `voucher`, `phone`, `election_id`, `face_path`) VALUES (?,?,?,?,?,?,?)'

      const { buffer, originalname } = req.file
      const timestamp = new Date().toISOString()
      const ref = `${username}-IMG-${timestamp}.jpeg`
      await sharp(buffer)
        .jpeg({ mozjpeg: true })
        .toFile('./public/uploads/' + ref)

      file_path = 'uploads/' + ref

      db.query(insertStatement, [
        username,
        email,
        password,
        vouchar,
        phone,
        detailArr[0],
        file_path,
      ])
      var mailOptions = {
        from: 'wedecideinfo@gmail.com',
        to: email,
        subject: 'WeDecide Login Details',
        text: `Good Day ${username}! \nYou can now partcipate in the election: ${detailArr[1]} by voting for your favorite candidate, Here is your details \nUsername: ${username} \nPassword: ${password} \nvouchar: \n${vouchar}`,
      }

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error)
        } else {
          console.log('Email sent: ' + info.response)
          res.redirect('/voter/vote-election')
        }
      })
    }
  })
})

//************To Login befor you vote for an election */
router.get('/vote-election', (req, res) => {
  state1 = 'SELECT `id`, `name`, `price` FROM `election`'
  db.query(state1, (err, result) => {
    res.render('vote_election', { result })
  })
})

router.post('/vote-election', (req, res) => {
  const election = req.body.election
  const details = election.split('/')
  const username = req.body.username
  const password = req.body.password

  const voterValidStm =
    'SELECT `id`, `election_id`,`username`, `password` FROM `voter` WHERE `username` = ? AND `election_id` = ?;'

  db.query(voterValidStm, [username, details[0]], function (err, result) {
    if (err) throw err

    if (result.length === 0) {
      state1 = 'SELECT `id`, `name`, `price` FROM `election`'
      db.query(state1, (err, result) => {
        res.render('vote_election', { result })
      })
    } else if (result[0].password !== password) {
      state1 = 'SELECT `id`, `name`, `price` FROM `election`'
      db.query(state1, (err, result) => {
        res.render('vote_election', { result })
      })
    } else {
      const token = jwt.sign(
        {
          id: result[0].id,
          username: result[0].username,
          election_id: result[0].election_id,
        },
        'secret-hack-election',
      )
      res.cookie('election_auth', token).redirect('/voter/face-check')
    }
  })
})

router.get('/face-check', verifyElection, async (req, res) => {
  token = req.cookies.election_auth
  const voter_id = jwt.decode(token).id
  const voters_username = jwt.decode(token).username
  const election_id = jwt.decode(token).election_id
  state0 = 'SELECT * FROM `voter` WHERE id = ?;'
  db.query(state0, [voter_id], (err, result) => {
    res.render('face_check', { result })
  })
})

//****************To Register to vote for an contest */
router.get('/register-contest', (req, res) => {
  state1 =
    'SELECT * FROM `contest`WHERE (CURRENT_TIMESTAMP BETWEEN start_date AND end_date)'
  db.query(state1, (err, result) => {
    console.log(result)
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
router.get('/election-center', verifyElection, (req, res) => {
  token = req.cookies.election_auth
  const voter_id = jwt.decode(token).id
  const voters_username = jwt.decode(token).username
  const election_id = jwt.decode(token).election_id

  state0 = 'SELECT `id`, `name` FROM `election` WHERE `id` = ?;'
  state1 = 'SELECT * FROM `poll` WHERE `election_id` = ?;'
  state2 = 'SELECT * FROM `candidate` WHERE candidate.election_id = ?;'

  statement = state0 + state1 + state2
  db.query(
    statement,
    [election_id, election_id, election_id],
    (err, result) => {
      res.render('vote_center', { result })
    },
  )
})

router.post('/election-center', verifyElection, (req, res) => {
  token = req.cookies.election_auth
  const voter_id = jwt.decode(token).id
  const voters_username = jwt.decode(token).username
  const election_id = jwt.decode(token).election_id
  var newdata = Object.values(req.body)
  console.log(newdata)
  if (newdata.length === 0) {
    res.send('Vote for at least one contestant')
  } else {
    for (let i = 0; i < newdata.length; i++) {
      state = 'Select `vote` From `candidate` Where `id` = ?;'
      db.query(state, [newdata[i]], (err, result) => {
        var res = parseInt(result[0].vote)
        res = res + 1

        vote_state = 'Update `candidate` Set `vote` = ? Where `id` = ?;'
        db.query(vote_state, [res, newdata[i]], (err, result) => {})
      })
    }
    upstate = 'Update `voter` Set `vote` = 1 Where `id` = ?'
    db.query(upstate, [voter_id], (err, result) => {
      if (err) throw err

      // var mailOptions = {
      //   from: 'wedecideinfo@gmail.com',
      //   to: voter_email,
      //   subject: 'WeDecide Login Details',
      //   text: `Good Day ${voters_username}! \nThank You for partcipating in the contest by voting for your favorite candidate.`,
      // }

      // transporter.sendMail(mailOptions, function (error, info) {
      //   if (error) {
      //     console.log(error)
      //   } else {
      //     console.log('Email sent: ' + info.response)
      //   }
      // })
    })
    res.cookie('election_auth', null)
    res.redirect('/voter/thank-you')
  }
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
router.post('/contest-center', verify, (req, res) => {
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
