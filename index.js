const express = require('express')
const http = require('http')
const dotenv = require('dotenv')
const { Server } = require("socket.io")
const auth = require('@moreillon/socketio_authentication_middleware')
const cors = require('cors')
const bodyParser = require('body-parser')
const users = require('./users.js')
const user_router = require('./routes/users.js')

dotenv.config()

const APP_PORT = process.env.APP_PORT || 80


const socketio_options = { cors: { origin: '*' } }
const auth_options = { url: `${process.env.AUTHENTICATION_API_URL}/v2/whoami` }


const app = express()

app.use(cors())
app.use(bodyParser.json())


const server = http.createServer(app)
const io = new Server(server, socketio_options)



app.get('/', (req, res) => {
  res.send({
    application_name: 'Real-time polling API'
  })
})

app.use('/users', user_router)


io.use( auth(auth_options) )

io.on('connection', (socket) => {

  // Not good to identify users with their DB id because of multiple tab behavior
  // Maybe OK because can push into array multiple times

  const { user } = socket

  console.log(`User ${user.properties.display_name} connected`)

  const found_index = users.findIndex(u => u.identity === user.identity)
  if(found_index < 0) {
    console.log(`User ${user.properties.display_name} is new, adding to list`)
    users.push({...user, socket_id: socket.id})
    io.sockets.emit('user_connected', user)
  }

  socket.on('disconnect', () => {

    console.log(`User ${user.properties.display_name} disconnected`)
    const found_index = users.findIndex(u => u.identity === user.identity)
    if(found_index > -1) {
      users.splice(found_index,1)
      io.sockets.emit('user_disconnected', user)
    }

  })

})


server.listen(APP_PORT, () => {
  console.log(`App listening on port ${APP_PORT}`)
})
