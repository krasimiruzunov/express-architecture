const path = require('path')

const rootPath = path.normalize(path.join(__dirname, '/../../'))
const limits = [1, 2, 5, 10]

module.exports = {
  development: {
    rootPath: rootPath,
    db: 'mongodb://localhost:27017/express-architecture-db',
    port: 1234,
    sessionSecret: 'bookstore-secret',
    limits: limits
  },
  production: {
    rootPath: rootPath,
    db: process.env.MONGO_DB,
    port: process.env.port,
    sessionSecret: process.env.SESSION_SECRET,
    limits: limits
  }
}
