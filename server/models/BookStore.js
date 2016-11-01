const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const mongoosePaginate = require('mongoose-paginate')
const requiredValidationMessage = '{PATH} is required'

let bookstoreSchema = new mongoose.Schema({
  name: { type: String, required: requiredValidationMessage },
  address: { type: String, required: requiredValidationMessage },
  books: [{type: mongoose.Schema.Types.ObjectId, ref: 'Book'}],
  totalBooks: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

bookstoreSchema.index({ name: 1, address: 1 }, { unique: true })
bookstoreSchema.plugin(uniqueValidator)
bookstoreSchema.plugin(mongoosePaginate)

mongoose.model('BookStore', bookstoreSchema)
