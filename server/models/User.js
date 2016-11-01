const mongoose = require('mongoose')
const encryption = require('../utilities/encryption')
const mongoosePaginate = require('mongoose-paginate')
const requiredValidationMessage = '{PATH} is required'

let userSchema = mongoose.Schema({
  username: { type: String, require: requiredValidationMessage, unique: true },
  firstName: { type: String, require: requiredValidationMessage },
  lastName: { type: String, require: requiredValidationMessage },
  salt: { type: String },
  password: { type: String },
  roles: [String]
})

userSchema.plugin(mongoosePaginate)

userSchema.method({
  authenticate: function (password) {
    return encryption.generatePassword(this.salt, password) === this.password
  }
})

let User = mongoose.model('User', userSchema)

module.exports.seedAdminUser = () => {
  User.find({})
  .then(users => {
    if (users.length === 0) {
      let salt = encryption.generateSalt()
      let password = encryption.generatePassword(salt, 'admin123')

      User.create({
        username: 'Admin',
        firstName: 'Admin',
        lastName: 'Adminov',
        salt: salt,
        password: password,
        roles: ['Admin']
      })
    }
  })
}
