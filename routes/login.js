const route = require('express').Router()
const jwt = require('jsonwebtoken')

route.get('/', (req, res, next) => {
  res.render('admin_login', {
    flashMessages: {},
  })
})

module.exports = route
