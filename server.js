const express = require('express')
const app = express()
const flash = require('connect-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const db = require('./database/confix')
const config = require('./config')

app.use(cookieParser())
app.set('view engine', 'ejs')
app.use(express.static('/home/wedecide/wedecide/public'))
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
const index = require('/home/wedecide/wedecide/routes/index')
app.use('/', index)

//Login
const login = require('/home/wedecide/wedecide/routes/login')
app.use('/login', login)

//Register
const register = require('/home/wedecide/wedecide/routes/register')
app.use('/register', register)

// Admin Dashboard
const admin_dashboard = require('/home/wedecide/wedecide/routes/admin')
app.use('/admin', admin_dashboard)

const admin_election = require('/home/wedecide/wedecide/routes/admin')
app.use('/admin/election', admin_election)

const admin_contest = require('/home/wedecide/wedecide/routes/admin')
app.use('/admin/contest', admin_contest)

const admin_contest_pay = require('/home/wedecide/wedecide/routes/admin')
app.use('/admin/contest/pay', admin_contest_pay)

const admin_election_pay = require('/home/wedecide/wedecide/routes/admin')
app.use('/admin/election/pay', admin_election_pay)

const voter = require('/home/wedecide/wedecide/routes/voter')
app.use('/voter', voter)

const contest = require('/home/wedecide/wedecide/routes/voter')
app.use('/voter/contest-center', contest)

const election = require('/home/wedecide/wedecide/routes/voter')
app.use('/voter/election-center', election)

app.use((req, res, next) => {
  res.status(404).render('error-404')
})

// Port
app.listen(config.PORT, () => {
  console.log(`This Webapp is available on the right port...`)
})
