module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      next()
    } else {
      req.session.redirectUrl = req.url
      res.redirect('/users/login')
    }
  },
  isInRole: (role) => {
    return (req, res, next) => {
      if (req.user && req.user.roles.indexOf(role) > -1) {
        next()
      } else {
        res.redirect('/')
      }
    }
  },
  canEdit: (model) => {
    return (req, res, next) => {
      if (req.user && req.user.roles.indexOf('Admin') > -1) {
        next()
      } else {
        let Model = require('mongoose').model(model)
        Model.findById(req.params.id)
        .populate('createdBy')
        .exec()
        .then(record => {
          if (record.createdBy._id.toString() === req.user._id.toString()) {
            next()
          } else {
            res.redirect('/')
          }
        })
      }
    }
  }
}
