const express = require('express')
const room_controller = require('../controllers/rooms.js')
const user_router = require('../routes/users.js')

const router = express.Router()



router.use('/:room_id/users', user_router)

module.exports =router
