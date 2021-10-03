const jwt = require('jsonwebtoken')

// middleware for verifying jwt
module.exports = function auth(req, res, next) {
  const token = req.cookies.contest_auth
  if (!token)
    return res.render('contest_vote', {
      flashMessages: {
        error: 'Access Denied!',
      },
    })

  try {
    const verified = jwt.verify(token, 'secret-hack-contest')
    req.id = verified
    next()
  } catch (err) {
    res.render('contest_vote', {
      flashMessages: {
        error: 'Access Denied!',
      },
    })
  }
}
