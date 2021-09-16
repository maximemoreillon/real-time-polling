//const users = require('../users.js')

exports.get_users = (req, res) => {
  const {get_all_users, get_room_users} = require('../index.js')
  const {room_id} = req.params

  let users = []
  if(room_id) users = get_room_users(room_id)
  else users = get_all_users()

  res.send(users)
}
