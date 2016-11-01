const encryption = require('../utilities/encryption')
const User = require('mongoose').model('User')

module.exports = {
  register: (req, res) => {
    if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/users/register') < 0)) {
      req.session.body = null
      req.session.errors = null
    }
    res.render('users/register', { body: req.session.body, errors: req.session.errors })
  },
  store: (req, res) => {
    let inputUser = req.body
    req.check('firstName', 'Firstname is required').notEmpty()
    req.check('firstName', 'FirstName must be minimum 2 characters').isLength({ min: 2 })
    req.check('lastName', 'Firstname is required').notEmpty()
    req.check('lastName', 'LastName must be minimum 2 characters').isLength({ min: 2 })
    req.check('username', 'Username is required').notEmpty()
    req.check('username', 'Username must be minimum 2 characters').isLength({ min: 2 })
    req.check('password', 'Password is required').notEmpty()
    req.check('password', 'Password must be minimum 8 characters').isLength({ min: 8 })
    req.check('confirmPassword', 'Confirm Password is required').notEmpty()
    req.check('confirmPassword', 'Confirm Password must be minimum 8 characters').isLength({ min: 8 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      if (inputUser.password !== inputUser.confirmPassword) {
        req.session.body = inputUser
        req.session.errors = [{ msg: 'Passwords do not match' }]
        res.redirect(req.headers.referer)
      } else {
        inputUser.salt = encryption.generateSalt()
        inputUser.password = encryption.generatePassword(inputUser.salt, inputUser.password)
        inputUser.roles = ['Contributor']
        User
          .findOne({ username: inputUser.username })
          .then(user => {
            if (user) {
              req.session.body = user
              req.session.errors = [{ msg: 'There is already a user with this username' }]
              res.redirect(req.headers.referer)
            } else {
              User
              .create(inputUser)
              .then(user => {
                req.logIn(user, (err, user) => {
                  if (err) {
                    req.session.body = user
                    req.session.errors = [{ msg: 'Login error' }]
                    res.redirect(req.headers.referer)
                  } else {
                    let redirectUrl = req.session.redirectUrl
                    if (redirectUrl) {
                      req.session.redirectUrl = null
                      res.redirect(redirectUrl)
                    } else {
                      res.redirect('/')
                    }
                  }
                })
              })
            }
          })
      }
    }
  },
  login: (req, res) => {
    if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/users/login') < 0)) {
      req.session.body = null
      req.session.errors = null
    }
    res.render('users/login', { body: req.session.body, errors: req.session.errors })
  },
  authenticate: (req, res) => {
    let inputUser = req.body
    req.check('username', 'Username is required').notEmpty()
    req.check('password', 'Password is required').notEmpty()

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = inputUser
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      User
        .findOne({ username: inputUser.username })
        .then(user => {
          if (!user || !user.authenticate(inputUser.password)) {
            req.session.body = inputUser
            req.session.errors = [{ msg: 'Invalid username or password' }]
            res.redirect(req.headers.referer)
          } else {
            req.logIn(user, (err, user) => {
              if (err) {
                req.session.body = inputUser
                req.session.errors = [{ msg: 'Login error' }]
                res.redirect(req.headers.referer)
              } else {
                let redirectUrl = req.session.redirectUrl
                if (redirectUrl) {
                  req.session.redirectUrl = null
                  res.redirect(redirectUrl)
                } else {
                  res.redirect('/')
                }
              }
            })
          }
        })
    }
  },
  logout: (req, res) => {
    req.logout()
    res.redirect('/')
  }
}
