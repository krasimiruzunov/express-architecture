const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const mongoosePaginate = require('mongoose-paginate')
const requiredValidationMessage = '{PATH} is required'

let authorSchema = new mongoose.Schema({
  firstName: { type: String, required: requiredValidationMessage },
  lastName: { type: String, required: requiredValidationMessage },
  image: { type: String },
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  totalBooks: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

authorSchema.index({ firstName: 1, lastName: 1 }, { unique: true })
authorSchema.plugin(uniqueValidator)
authorSchema.plugin(mongoosePaginate)

authorSchema.method({
  fullname: function () {
    return this.firstName + ' ' + this.lastName
  }
})

mongoose.model('Author', authorSchema)
