const express = require('express')
const http = require('http')
const dotenv = require('dotenv')
const { Server } = require("socket.io")
const socketio_auth = require('@moreillon/socketio_authentication_middleware')
const express_auth = require('@moreillon/express_identification_middleware')
const cors = require('cors')
const bodyParser = require('body-parser')
const user_router = require('./routes/users.js')
const room_router = require('./routes/rooms.js')
const pjson = require('./package.json')

dotenv.config()

const APP_PORT = process.env.APP_PORT || 80


const socketio_options = { cors: { origin: '*' } }
const auth_options = { url: `${process.env.AUTHENTICATION_API_URL}/v2/whoami` }


const app = express()

app.use(cors())
app.use(bodyParser.json())


const server = http.createServer(app)
const io = new Server(server, socketio_options)

const get_users = () => {
  const socket_array = Array.from(io.sockets.sockets)
  return socket_array.map(e => e[1].user)
}

exports.io = io
exports.get_users = get_users

app.get('/', (req, res) => {
  res.send({
    application_name: 'Real-time polling API',
    version: pjson.version,
    authentication: auth_options.url
  })
})

app.use('/users', express_auth(auth_options), user_router)
app.use('/rooms', express_auth(auth_options), room_router)

io.use( socketio_auth(auth_options) )

io.on('connection', (socket) => {

  // user becomes available thanks to the auth middleware
  const {user, id} = socket
  user.socket = {id}
  io.sockets.emit('user_connected', user)
  console.log(`[WS] User ${user.properties.display_name} sconnected`)

  socket.on('user_state', (data) => {
    const {user} = socket
    const {state} = data
    user.state = state
    io.sockets.emit('user_updated', user)
  })

  socket.on('reset', (data) => {
    const {user} = socket
    const {state} = data
    get_users.forEach((user) => { user.state = state })
    res.send(users)
    io.sockets.emit('all_users_updated', users)
  })

  socket.on('disconnect', () => {
    console.log(`[WS] User ${user.properties.display_name} disconnected`)
    io.sockets.emit('user_disconnected', user)
  })

})


server.listen(APP_PORT, () => {
  console.log(`App listening on port ${APP_PORT}`)
})
