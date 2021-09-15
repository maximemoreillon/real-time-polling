const express = require('express')
const user_controller = require('../controllers/users.js')

const router = express.Router({mergeParams: true})


router.route('/')
  .get(user_controller.get_users)


module.exports =router
