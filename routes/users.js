const express = require('express')
const user_controller = require('../controllers/users.js')

const router = express.Router()


router.route('/')
  .get(user_controller.get_users)
  .patch(user_controller.update_all_users)

router.route('/:user_id')
  .patch(user_controller.update_user)


module.exports =router
