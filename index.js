const express = require('express')
const app = express()
const flash = require('connect-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const db = require('./database/confix')
const config = require('./config')

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

// Database Section
db.connect(async (err) => {
  if (err) {
    throw err
  }
  const dbOn = await console.log('The Database is up and running...')
})

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

const admin_election = require('./routes/admin')
app.use('/admin/election', admin_election)

const admin_contest = require('./routes/admin')
app.use('/admin/contest', admin_contest)

const admin_contest_pay = require('./routes/admin')
app.use('/admin/contest/pay', admin_contest_pay)

const voter = require('./routes/voter')
app.use('/voter', voter)

const contest = require('./routes/voter')
app.use('/voter/contest-center', contest)

const election = require('./routes/voter')
app.use('/voter/election-center', election)

app.use((req, res, next) => {
  res.status(404).render('error-404')
})

// Port
app.listen(config.PORT, () => {
  console.log(`This Webapp is available on the right port...`)
})
