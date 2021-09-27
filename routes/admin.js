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
  state0 =
    'SELECT `election`.`id`, `election`.`name`, `election`.`price`, `election`.`start_date`, `election`.`end_date`, count(`poll`.`id`) AS numberOfPoll FROM `election` INNER JOIN `poll` ON `election`.id = `poll`.`election_id` WHERE `election`.`admin_id` = ? group by `election`.`id`;'
  state1 =
    'SELECT COUNT(*) AS numberOfElection FROM `election` WHERE 	`election`.`admin_id` = ?;'
  state2 =
    'SELECT count(`poll`.`id`) AS numberOfPoll FROM `poll` INNER JOIN `election` ON `poll`.`election_id` = `election`.`id` WHERE `election`.`admin_id` = ?;'
  statement = state1 + state2 + state0

  db.query(statement, [user_id, user_id, user_id], (err, result) => {
    res.render('admin_dashboard', { result })
  })
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

//******************Logout Section ***************/
router.get('/logout', (req, res) => {
  res.cookie('auth', null)
  res.redirect('/')
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
router.get('/manage-election', verify, (req, res) => {
  token = req.cookies.auth
  user_id = jwt.decode(token).id
  state1 = 'SELECT `id`, `name`, `price` FROM `election` WHERE admin_id = ?'
  db.query(state1, [user_id], (err, result) => {
    res.render('manage_election', { result })
  })
})

//*******************Route to the Election **************/
router.get('/:id', verify, (req, res) => {
  id = req.params.id
  state0 = 'SELECT * FROM `election` WHERE `id` = ?;'
  state1 = 'SELECT * FROM `poll` WHERE `election_id` = ?;'
  state2 =
    'SELECT * FROM `candidate` WHERE candidate.election_id = ? ORDER BY candidate.poll_id;'
  statement = state0 + state1 + state2
  db.query(statement, [id, id, id], (err, result) => {
    //console.log(result)
    res.render('admin_election', { result })
  })
})

//*************** Handle Add Poll ***********/
router.post('/:id/add-poll', verify, (req, res) => {
  const id = req.params.id
  const name = req.body.name
  state0 = 'Insert Into `poll` (`election_id`,`name`) VALUES (?,?)'
  db.query(state0, [id, name])
  res.redirect(`/admin/${id}`)
})

//*************** Handle Add Candidate ***********/
router.post('/:id/add-can', verify, (req, res) => {
  const id = req.params.id
  const { position, canName } = req.body
  state0 =
    'Insert Into `candidate` (`election_id`,`poll_id`,`name`, `vote`) VALUES (?,?,?,?)'
  db.query(state0, [id, position, canName, 0])
  res.redirect(`/admin/${id}`)
})

router.delete('/admin/delete-election/:id', verify, (req, res) => {
  id = req.params.id
  token = req.cookies.auth
  user_id = jwt.decode(token).id
})

router.delete('/admin/delete-poll/:id', verify, (req, res) => {
  id = req.params.id
  token = req.cookies.auth
  user_id = jwt.decode(token).id
})

router.delete('/admin/delete-candidate/:id', verify, (req, res) => {
  id = req.params.id
  token = req.cookies.auth
  user_id = jwt.decode(token).id
})

module.exports = router
