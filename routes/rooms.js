const express = require('express')
const room_controller = require('../controllers/rooms.js')
const user_router = require('../routes/users.js')

const router = express.Router()


router.route('/')
  .get(room_controller.get_rooms)
  .post(room_controller.create_room)

router.route('/:room_id/join')
  .post(room_controller.join_room)

router.use('/:room_id/users', user_router)
  
module.exports =router
