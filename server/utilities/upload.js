let fs = require('fs')
let mkdirp = require('mkdirp')
let multer = require('multer')

let storage = multer.diskStorage({
  destination: function (req, file, callback) {
    let destination = `public/uploads/${file.originalname.substr(0, 1)}/`
    fs.exists(destination, (exists) => {
      if (!exists) {
        mkdirp.sync(destination)
      }
      callback(null, destination)
    })
  },
  filename: function (req, file, callback) {
    let filename = file.originalname
    let extension = filename.split('.').pop()
    let name = filename.substr(0, filename.length - extension.length - 1)
    callback(null, `${name}_${(Math.floor(Date.now() / 1000))}.${extension}`)
  }
})

module.exports = multer({
  storage: storage,
  limits: 1,
  fileFilter: function (req, file, callback) {
    let mimetypes = ['image/png', 'image/jpg', 'image/jpeg']
    if (!mimetypes.includes(file.mimetype)) {
      req.fileValidationError = 'Allowed imagefile types are .png, .jpg and .jpeg'
      return callback(null, false, new Error('Allowed image file types are .png, .jpg and .jpeg'))
    }
    callback(null, true)
  }
})
