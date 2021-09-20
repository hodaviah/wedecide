const jwt = require('jsonwebtoken')

// middleware for verifying jwt
module.exports = function auth(req, res, next) {
  const token = req.cookies.auth
  if (!token)
    return res.render('admin_login', {
      flashMessages: {
        error: 'Access Denied!',
      },
    })

  try {
    const verified = jwt.verify(token, 'secret-hack-admin')
    req.id = verified
    next()
  } catch (err) {
    res.render('admin_login', {
      flashMessages: {
        error: 'Access Denied!',
      },
    })
  }
}
