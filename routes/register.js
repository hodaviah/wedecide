const route = require('express').Router()

route.get('/', (req, res, next) => {
  res.render('admin_reg', {
    flashMessages: {},
  })
})

module.exports = route
