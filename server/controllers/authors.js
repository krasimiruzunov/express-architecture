const fs = require('fs')
const Author = require('mongoose').model('Author')
const Book = require('mongoose').model('Book')
const BookStore = require('mongoose').model('BookStore')

module.exports = {
  index: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let limit = parseInt(req.session.authorsLimit || 1)
    let field = req.session.sortAuthorField || ''
    let direction = req.session.sortAuthorDirection || ''
    let options = {
      select: '-image',
      populate: 'createdBy',
      offset: (page - 1) * limit,
      limit: limit
    }

    if (field) {
      options.sort = { [field]: direction === 'asc' ? 1 : -1 }
    }

    Author.paginate({}, options).then(result => {
      let pages = Math.ceil(result.total / limit)
      res.render('authors/index', { authors: result.docs, pages: pages, page: page, authorsLimit: limit, field: field, direction: direction })
    })
  },
  create: (req, res) => {
    if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/author/create') < 0)) {
      req.session.body = null
      req.session.errors = null
    }
    res.render('authors/author', { action: { text: 'Add', url: `/author/store` }, body: req.session.body, errors: req.session.errors })
  },
  store: (req, res) => {
    req.check('firstName', 'FirstName is required').notEmpty()
    req.check('firstName', 'FirstName must be minimum 2 characters').isLength({ min: 2 })
    req.check('lastName', 'LastName is required').notEmpty()
    req.check('lastName', 'LastName must be minimum 2 characters').isLength({ min: 2 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      let author = new Author({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        createdBy: req.user
      })
      if (req.file) {
        author.image = req.file.path.split('public').pop()
      }
      author.save((err) => {
        if (err) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already an author with this name' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          res.redirect('/authors')
        }
      })
    }
  },
  details: (req, res) => {
    Author.findById(req.params.id)
    .populate('createdBy')
    .exec()
    .then(author => {
      res.render('authors/details', { author: author })
    })
  },
  edit: (req, res) => {
    Author.findById(req.params.id)
    .populate('createdBy')
    .exec()
    .then(author => {
      if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/author/' + req.params.id + '/edit') < 0)) {
        req.session.body = null
        req.session.errors = null
      }
      res.render('authors/author', { author: author, action: { text: 'Update', url: `/author/${author.id}/update` }, body: req.session.body, errors: req.session.errors })
    })
  },
  update: (req, res) => {
    req.check('firstName', 'FirstName is required').notEmpty()
    req.check('firstName', 'FirstName must be minimum 2 characters').isLength({ min: 2 })
    req.check('lastName', 'LastName is required').notEmpty()
    req.check('lastName', 'LastName must be minimum 2 characters').isLength({ min: 2 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      Author.findOne({
        _id: { $ne: req.params.id },
        firstName: req.body.firstName,
        lastName: req.body.lastName
      })
      .exec()
      .then(author => {
        if (author) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already an author with this name' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          Author.findById(req.params.id)
          .exec()
          .then(author => {
            if (author) {
              author.firstName = req.body.firstName
              author.lastName = req.body.lastName
              if (req.file) {
                author.image = req.file.path.split('public').pop()
              }
              author.save(err => {
                if (err) console.log(err)
                res.redirect('/authors')
              })
            }
          })
        }
      })
    }
  },
  delete: (req, res) => {
    Author.findById(req.params.id)
    .populate('createdBy')
    .exec()
    .then(author => {
      author.remove()
      Book.find()
      .select('_id')
      .where('author').equals(author)
      .then(books => {
        let bookIds = books.map((book) => { return book._id.toString() })
        if (books.length > 0) {
          BookStore.find()
          .where('books')
          .all(bookIds)
          .then(bookstores => {
            if (bookstores.length > 0) {
              for (let i = 0; i < bookstores.length; i++) {
                bookstores[i].books = bookstores[i].books.filter((book) => { return bookIds.indexOf(book.toString()) < 0 })
                bookstores[i].save((err) => {
                  if (err) console.log(err)
                  Book.remove()
                  .where('_id').in(bookIds)
                  .then(result => {
                    res.redirect(req.headers.referer)
                  })
                })
              }
            } else {
              Book.remove()
              .where('_id').in(bookIds)
              .then(result => {
                res.redirect(req.headers.referer)
              })
            }
          })
        } else {
          res.redirect(req.headers.referer)
        }
      })
    })
  },
  deleteImage: (req, res) => {
    Author.findById(req.params.id)
    .populate('createdBy')
    .exec()
    .then(author => {
      if (author) {
        fs.unlink('./public/' + author.image, (err) => {
          if (err) console.log(err)
          author.image = ''
          author.save(err => {
            if (err) console.log(err)
            res.send({ success: true, message: 'Image was successfully removed' })
          })
        })
      } else {
        res.send({ success: false, message: 'There is not a book with provided id' })
      }
    })
  },
  limit: (req, res) => {
    req.session.authorsLimit = req.body.limit
    res.send({ success: true, message: 'Limit was successfully set' })
  },
  sort: (req, res) => {
    req.session.sortAuthorField = req.body.field
    req.session.sortAuthorDirection = req.body.direction
    res.send({ success: true, message: 'Sort was successfully set' })
  }
}
