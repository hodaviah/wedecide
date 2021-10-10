const jwt = require('jsonwebtoken')

// middleware for verifying jwt
module.exports = function auth(req, res, next) {
  const token = req.cookies.election_auth
  if (!token)
    return res.render('vote_election', {
      flashMessages: {
        error: 'Access Denied!',
      },
    })

  try {
    const verified = jwt.verify(token, 'secret-hack-election')
    req.id = verified
    next()
  } catch (err) {
    res.render('vote_election', {
      flashMessages: {
        error: 'Access Denied!',
      },
    })
  }
}
