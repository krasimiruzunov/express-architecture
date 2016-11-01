const express = require('express')
const app = express()

let env = process.env.NODE_ENV || 'development'
let config = require('./server/config/config')[env]

require('./server/config/database')(config)
require('./server/config/express')(config, app)
require('./server/config/routes')(app)
require('./server/config/passport')()

app.listen(config.port)
console.log(`App is ready runnin' on port ${config.port}!`)
