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

const get_all_users = () => {
  const socket_array = Array.from(io.sockets.sockets)
  return socket_array.map(e => e[1].user)
}

const get_rooms = () => Array.from(io.sockets.adapter.rooms)

const get_room = (room) => get_rooms()
  .find( r => r[0] === room_name_format(room))

const get_room_users = (room) => {
  const found_room = get_room(room)
  if(!found_room) return []
  const room_user_ids = Array.from(found_room[1])
  return get_all_users().filter(u => room_user_ids.includes(u.socket.id))
}

const room_name_format = (name) => `poll_${name}`

exports.io = io
exports.get_all_users = get_all_users
exports.get_room_users = get_room_users

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
  console.log(`[WS] User ${user.properties.display_name} connected`)

  socket.on('state', ({state, room}) => {
    const {user} = socket
    user.state = state
    if(room) io.to(room_name_format(room)).emit('user_updated', user)
    else io.sockets.emit('user_updated', user)
    console.log(`[WS] User ${user.properties.display_name} state of room ${room} updated to ${state}`)
  })

  socket.on('join', ({room}) => {
    const {user} = socket
    const found_room = get_room(room)
    if(!found_room) {
      user.created_room = room
      console.log(`[WS] User ${user.properties.display_name} created room ${room}`)
    }
    socket.join(room_name_format(room))
    io.to(room_name_format(room)).emit('user_joined_room', user)
    console.log(`[WS] User ${user.properties.display_name} joined room ${room}`)
  })

  socket.on('leave', ({room}) => {
    const {user} = socket
    socket.leave(room_name_format(room))
    io.to(room_name_format(room)).emit('user_left_room', user)
    console.log(`[WS] User ${user.properties.display_name} left room ${room}`)
  })

  socket.on('all_states', ({state, room}) => {
    get_room_users(room).forEach((user) => { user.state = state })
    io.to(room_name_format(room)).emit('all_users_updated', get_room_users(room))
  })

  socket.on('disconnect', () => {
    console.log(`[WS] User ${user.properties.display_name} disconnected`)
    io.sockets.emit('user_disconnected', user)
  })

})


server.listen(APP_PORT, () => {
  console.log(`App listening on port ${APP_PORT}`)
})
