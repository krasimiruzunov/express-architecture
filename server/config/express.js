const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const expressValidator = require('express-validator')
const passport = require('passport')
const path = require('path')
const stylus = require('stylus')

module.exports = (config, app) => {
  app.set('view engine', 'pug')
  app.set('views', path.join(config.rootPath, 'server/views'))

  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(session({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: true
  }))
  app.use(expressValidator())
  app.use(passport.initialize())
  app.use(passport.session())
  app.use((req, res, next) => {
    if (req.user) {
      res.locals.currentUser = req.user
    }
    res.locals.limits = config.limits
    next()
  })
  app.use(express.static(path.join(config.rootPath, 'public')))
  app.use(stylus.middleware({
    src: path.join(config.rootPath, 'server/resources/css'),
    dest: path.join(config.rootPath, '/public/css'),
    debug: true,
    force: true,
    compile: (str, path) => {
      return stylus(str)
        .set('site.css', path)
        .set('compress', true)
    }
  }))
}
