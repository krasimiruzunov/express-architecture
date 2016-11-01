const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const mongoosePaginate = require('mongoose-paginate')
const requiredValidationMessage = '{PATH} is required'

let bookSchema = new mongoose.Schema({
  title: { type: String, required: requiredValidationMessage, unique: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
  price: { type: Number, required: requiredValidationMessage },
  image: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

bookSchema.index({ title: 1 }, { unique: true })
bookSchema.plugin(uniqueValidator)
bookSchema.plugin(mongoosePaginate)

mongoose.model('Book', bookSchema)
