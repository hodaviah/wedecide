const router = require('express').Router()
const express = require('express')
router.use(express.static('public'))

router.get('/', (req, res, next) => {
  res.render('admin_dashboard')
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
