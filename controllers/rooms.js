const rooms = require('../rooms.js')

exports.get_rooms = (req, res) => { res.send(rooms) }

exports.create_room = (req, res) => {
  res.send('OK')
}

exports.join_room = (req, res) => {
  res.send('OK')
}
