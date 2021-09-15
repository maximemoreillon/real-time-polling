const users = require('../users.js')


exports.get_users = (req, res) => { res.send(users) }

exports.update_user = (req, res) => {
  const user_id = req.params.user_id
  const user = users.find(u => String(u.identity) === String(user_id))
  if(!user) return res.status(404).send(`User ${user_id} not found`)
  user.state = req.body.state
  res.send(user)
  io.sockets.emit('user_updated', user)
}

exports.update_all_users = (req, res) => {
  users.forEach((user) => { user.state = req.body.state })
  res.send(users)
  io.sockets.emit('all_users_updated', users)
}
