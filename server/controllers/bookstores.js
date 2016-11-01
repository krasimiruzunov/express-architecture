const BookStore = require('mongoose').model('BookStore')
const Book = require('mongoose').model('Book')

module.exports = {
  index: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let limit = parseInt(req.session.bookstoresLimit || 1)
    let field = req.session.sortBookstoreField || ''
    let direction = req.session.sortBookstoreDirection || ''
    let options = {
      populate: 'books createdBy',
      offset: (page - 1) * limit,
      limit: limit
    }

    if (field) {
      options.sort = { [field]: direction === 'asc' ? 1 : -1 }
    }

    BookStore.paginate({}, options).then(result => {
      let pages = Math.ceil(result.total / limit)
      res.render('bookstores/index', { bookstores: result.docs, pages: pages, page: page, bookstoresLimit: limit, field: field, direction: direction })
    })
  },
  create: (req, res) => {
    Book.find()
    .select('_id title')
    .exec()
    .then(books => {
      if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/bookstore/create') < 0)) {
        req.session.body = null
        req.session.errors = null
      }
      console.log(req.session.body)
      res.render('bookstores/bookstore', { books: books, action: { text: 'Add', url: `/bookstore/store` }, body: req.session.body, errors: req.session.errors })
    })
  },
  store: (req, res) => {
    req.check('name', 'Name is required').notEmpty()
    req.check('name', 'Name must be minimum 2 characters').isLength({ min: 2 })
    req.check('address', 'Address is required').notEmpty()
    req.check('address', 'Address must be minimum 2 characters').isLength({ min: 2 })
    req.check('books', 'Books is required').notEmpty()

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      let bookstore = new BookStore({
        name: req.body.name,
        address: req.body.address,
        createdBy: req.user
      })
      if (Array.isArray(req.body.books)) {
        for (let i = 0; i < req.body.books.length; i++) {
          bookstore.books.push(req.body.books[i])
        }
      } else if (req.body.books) {
        bookstore.books.push(req.body.books)
      }
      bookstore.totalBooks = bookstore.books.length
      bookstore.save((err) => {
        if (err) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already a bookstore with this name at ths address' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          res.redirect('/bookstores')
        }
      })
    }
  },
  details: (req, res) => {
    BookStore.findById(req.params.id)
    .populate({
      path: 'books',
      populate: {
        path: 'author'
      }
    })
    .exec()
    .then(bookstore => {
      res.render('bookstores/details', { bookstore: bookstore })
    })
  },
  edit: (req, res) => {
    BookStore.findById(req.params.id)
    .populate({
      path: 'books',
      populate: {
        path: 'author'
      }
    })
    .exec()
    .then(bookstore => {
      Book.find()
      .select('_id title')
      .where('_id').nin(bookstore.books)
      .exec()
      .then(books => {
        if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/bookstore/' + req.params.id + '/edit') < 0)) {
          req.session.body = null
          req.session.errors = null
        }
        res.render('bookstores/bookstore', { bookstore: bookstore, books: books, action: { text: 'Update', url: `/bookstore/${bookstore.id}/update` }, body: req.session.body, errors: req.session.errors })
      })
    })
  },
  update: (req, res) => {
    req.check('name', 'Name is required').notEmpty()
    req.check('name', 'Name must be minimum 2 characters').isLength({ min: 2 })
    req.check('address', 'Address is required').notEmpty()
    req.check('address', 'Address must be minimum 2 characters').isLength({ min: 2 })
    req.check('books', 'Books is required').notEmpty()

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      BookStore.findOne({
        _id: { $ne: req.params.id },
        name: req.body.name,
        address: req.body.address
      })
      .exec()
      .then(bookstore => {
        if (bookstore) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already a bookstore with this name at ths address' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          BookStore.findById(req.params.id)
          .exec()
          .then(bookstore => {
            if (bookstore) {
              bookstore.name = req.body.name
              bookstore.address = req.body.address
              if (Array.isArray(req.body.books)) {
                for (let i = 0; i < req.body.books.length; i++) {
                  bookstore.books.push(req.body.books[i])
                }
              } else if (req.body.books) {
                bookstore.books.push(req.body.books)
              }
              bookstore.totalBooks = bookstore.books.length
              bookstore.save()
              .then(err => {
                if (err) console.log(err)
                res.redirect('/bookstores')
              })
            } else {
              res.redirect('/bookstores')
            }
          })
        }
      })
    }
  },
  delete: (req, res) => {
    BookStore.findById(req.params.id)
    .populate('createdBy')
    .exec()
    .then(bookstore => {
      bookstore.remove()
      res.redirect(req.headers.referer)
    })
  },
  deleteBook: (req, res) => {
    BookStore.findById(req.params.id)
    .exec()
    .then(bookstore => {
      if (bookstore) {
        bookstore.books = bookstore.books.filter((book) => { return book.toString() !== req.params.bookId.toString() })
        bookstore.totalBooks = bookstore.books.length
        bookstore.save((err) => {
          if (err) console.log(err)
          res.redirect(req.headers.referer)
        })
      }
    })
  },
  limit: (req, res) => {
    req.session.bookstoresLimit = req.body.limit
    res.send({ success: true, message: 'Limit was successfully set' })
  },
  sort: (req, res) => {
    req.session.sortBookstoreField = req.body.field
    req.session.sortBookstoreDirection = req.body.direction
    res.send({ success: true, message: 'Sort was successfully set' })
  }
}
