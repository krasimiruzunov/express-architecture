const passport = require('passport')
const LocalPassport = require('passport-local')
const User = require('mongoose').model('User')

module.exports = () => {
  passport.use(new LocalPassport({
    usernameField: 'username',
    passwordField: 'password'
  },
  (username, password, done) => {
    User.findOne({ username: username })
    .then(user => {
      if (!user) return done(null, false)
      return !user.authenticate(passport) ? done(null, false) : done(null, user)
    }, err => {
      return done(err)
    })
  }))

  passport.serializeUser((user, done) => {
    if (user) {
      return done(null, user._id)
    }
  })

  passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
      return !user ? done(null, false) : done(null, user)
    })
  })
}
