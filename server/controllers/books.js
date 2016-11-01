const fs = require('fs')
const Author = require('mongoose').model('Author')
const Book = require('mongoose').model('Book')
const BookStore = require('mongoose').model('BookStore')

module.exports = {
  index: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let limit = parseInt(req.session.booksLimit || 1)
    let field = req.session.sortBookField || ''
    let direction = req.session.sortBookDirection || ''
    let options = {
      select: '-image',
      populate: 'author createdBy',
      offset: (page - 1) * limit,
      limit: limit
    }

    if (field) {
      options.sort = { [field]: direction === 'asc' ? 1 : -1 }
    }

    Book.paginate({}, options).then(result => {
      let pages = Math.ceil(result.total / limit)
      res.render('books/index', { books: result.docs, pages: pages, page: page, booksLimit: limit, field: field, direction: direction })
    })
  },
  create: (req, res) => {
    Author.find()
    .select('_id firstName lastName')
    .exec()
    .then(authors => {
      if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/book/create') < 0)) {
        req.session.body = null
        req.session.errors = null
      }
      res.render('books/book', { authors: authors, action: { text: 'Add', url: `/book/store` }, body: req.session.body, errors: req.session.errors })
    })
  },
  store: (req, res) => {
    req.check('title', 'Title is required').notEmpty()
    req.check('title', 'Title must be minimum 2 characters').isLength({ min: 2 })
    req.check('author', 'Author is required').notEmpty()
    req.check('price', 'Price is required').notEmpty()
    req.check('price', 'Price must be number').matches(/^\d+\.?\d{1,2}$/)

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      let book = new Book({
        title: req.body.title,
        author: req.body.author,
        price: req.body.price.indexOf('.') >= 0 ? parseInt(req.body.price.replace('.', '')) : parseInt(req.body.price) * 100,
        createdBy: req.user
      })
      if (req.file) {
        book.image = req.file.path.split('public').pop()
      }
      book.save((err) => {
        if (err) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already a book with this title' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          Author.findById(req.body.author)
          .exec()
          .then(author => {
            author.books.push(book)
            author.totalBooks = author.books.length
            author.save((err) => {
              if (err) console.log(err)
              res.redirect('/books')
            })
          })
        }
      })
    }
  },
  details: (req, res) => {
    Book.findById(req.params.id)
    .populate('author createdBy')
    .exec()
    .then(book => {
      res.render('books/details', { book: book })
    })
  },
  edit: (req, res) => {
    Book.findById(req.params.id)
    .populate('author createdBy')
    .exec()
    .then(book => {
      Author.find()
      .select('_id firstName lastName')
      .exec()
      .then(authors => {
        if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/book/' + req.params.id + '/edit') < 0)) {
          req.session.body = null
          req.session.errors = null
        }
        res.render('books/book', { book: book, authors: authors, action: { text: 'Update', url: `/book/${book.id}/update` }, body: req.session.body, errors: req.session.errors })
      })
    })
  },
  update: (req, res) => {
    req.check('title', 'Title is required').notEmpty()
    req.check('title', 'Title must be minimum 2 characters').isLength({ min: 2 })
    req.check('author', 'Author is required').notEmpty()
    req.check('price', 'Price is required').notEmpty()
    req.check('price', 'Price must be number').matches(/^\d+\.?\d{1,2}$/)

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      Book.findOne({
        _id: { $ne: req.params.id },
        title: req.body.title
      })
      .exec()
      .then(book => {
        if (book) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already a book with this title' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          Book.findById(req.params.id)
          .exec()
          .then(book => {
            if (book) {
              let prevAuthor = book.author
              book.title = req.body.title
              book.author = req.body.author
              book.price = req.body.price.indexOf('.') >= 0 ? parseInt(req.body.price.replace('.', '')) : parseInt(req.body.price) * 100
              if (req.file) {
                book.image = req.file.path.split('public').pop()
              }
              book.save(err => {
                if (err) console.log(err)
                Author.findById(req.body.author)
                .exec()
                .then(author => {
                  let books = author.books.filter((book) => { return book.toString() === req.params.id.toString() })
                  if (books.length === 0) {
                    author.books.push(book)
                    author.save((err) => {
                      if (err) console.log(err)
                      Author.findById(prevAuthor)
                      .exec()
                      .then(author => {
                        author.books = author.books.filter((book) => { return book.toString() !== req.params.id.toString() })
                        author.save((err) => {
                          if (err) console.log(err)
                          res.redirect('/books')
                        })
                      })
                    })
                  } else {
                    res.redirect('/books')
                  }
                })
              })
            }
          })
        }
      })
    }
  },
  delete: (req, res) => {
    Book.findById(req.params.id)
    .populate('createdBy')
    .exec()
    .then(book => {
      book.remove()
      Author.find()
      .where('books')
      .all(req.params.id)
      .then(authors => {
        for (let i = 0; i < authors.length; i++) {
          authors[i].books = authors[i].books.filter((book) => { return book.toString() !== req.params.id.toString() })
          authors[i].totalBooks = authors[i].books.length
          authors[i].save((err) => {
            if (err) console.log(err)
            if (i === authors.length - 1) {
              BookStore.find()
              .where('books')
              .all(req.params.id)
              .then(bookstores => {
                if (bookstores.length > 0) {
                  for (let j = 0; j < bookstores.length; j++) {
                    bookstores[j].books = bookstores[j].books.filter((book) => { return book.toString() !== req.params.id.toString() })
                    bookstores[j].save((err) => {
                      if (err) console.log(err)
                      if (j === bookstores.length - 1) {
                        res.redirect(req.headers.referer)
                      }
                    })
                  }
                } else {
                  res.redirect(req.headers.referer)
                }
              })
            }
          })
        }
      })
    })
  },
  deleteImage: (req, res) => {
    Book.findById(req.params.id)
      .populate('createdBy')
      .exec()
      .then(book => {
        if (book) {
          fs.unlink('./public/' + book.image, (err) => {
            if (err) console.log(err)
            book.image = ''
            book.save(err => {
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
    req.session.booksLimit = req.body.limit
    res.send({ success: true, message: 'Limit was successfully set' })
  },
  sort: (req, res) => {
    req.session.sortBookField = req.body.field
    req.session.sortBookDirection = req.body.direction
    res.send({ success: true, message: 'Sort was successfully set' })
  }
}
