const Author = require('mongoose').model('Author')
const Book = require('mongoose').model('Book')
const BookStore = require('mongoose').model('BookStore')

module.exports = {
  index: (req, res) => {
    Author.find()
      .select('_id')
      .exec()
      .then(authors => {
        Book.find()
        .select('_id')
        .exec()
        .then(books => {
          BookStore.find()
          .select('_id')
          .exec()
          .then(bookstores => {
            res.render('home/index', { authors: authors.length, books: books.length, bookstores: bookstores.length })
          })
        })
      })
  }
}
