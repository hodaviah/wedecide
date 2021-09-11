const express = require('express')
const app = express()
const flash = require('connect-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')

app.use(cookieParser())
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(
  express.urlencoded({
    extended: true,
  }),
)
app.use(flash())

app.use(
  session({
    secret: 'geeksforgeeks',
    saveUninitialized: true,
    resave: true,
  }),
)

/**Route
 * Contains all the route to each page
 *
 */

// HomePage
const index = require('./routes/index')
app.use('/', index)

//Login
const login = require('./routes/login')
app.use('/login', login)

//Register
const register = require('./routes/register')
app.use('/register', register)

// Admin Dashboard
const admin_dashboard = require('./routes/admin')
app.use('/admin', admin_dashboard)
// Port
app.listen(5050, () => {
  console.log(`This Webapp is available on the right port...`)
})
