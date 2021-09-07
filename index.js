const express = require('express')
const http = require('http')
const dotenv = require('dotenv')
const { Server } = require("socket.io")
const auth = require('@moreillon/socketio_authentication_middleware')
const cors = require('cors')
const bodyParser = require('body-parser')


dotenv.config()

const APP_PORT = process.env.APP_PORT || 80

const users = []

const socketio_options = { cors: { origin: '*' } }
const auth_options = { url: `${process.env.AUTHENTICATION_API_URL}/v2/whoami` }


const app = express()

app.use(cors())
app.use(bodyParser.json())


const server = http.createServer(app)
const io = new Server(server, socketio_options)

const get_users = (req, res) => {
  res.send(users)
}

const update_user = (req, res) => {
  const user_id = req.params.user_id
  const user = users.find(u => String(u.identity) === String(user_id))
  if(!user) return res.status(404).send(`User ${user_id} not found`)
  user.state = req.body.state
  res.send(user)
  io.sockets.emit('user_updated', user)
}

const update_all_users = (req, res) => {
  users.forEach((user) => { user.state = req.body.state })
  res.send(users)
  io.sockets.emit('all_users_updated', users)
}

app.get('/', (req, res) => {
  res.send({
    application_name: 'Real-time polling API'
  })
})

app.route('/users')
  .get(get_users)
  .patch(update_all_users)

app.route('/users/:user_id')
  .patch(update_user)

io.use( auth(auth_options) )

io.on('connection', (socket) => {

  // Not good to identify users with thei DB id because of multiple tab behavior
  // Maybe OK because can push into array multiple times

  const { user } = socket

  const found_index = users.findIndex(u => u.identity === user.identity)

  console.log(`User ${user.properties.display_name} connected`)

  if(found_index < 0) {
    console.log(`User ${user.properties.display_name} is new, adding to list`)
    users.push({...user, socket_id: socket.id})
    io.sockets.emit('user_connected', user)
  }

  socket.on('disconnect', () => {

    console.log(`User ${user.properties.display_name} disconnected`)

    if(found_index > -1) {
      users.splice(found_index,1)
      io.sockets.emit('user_disconnected', user)

    }
  })

})


server.listen(APP_PORT, () => {
  console.log(`App listening on port ${APP_PORT}`)
})
