//const users = require('../users.js')

exports.get_users = (req, res) => {
  const  {get_users} = require('../index.js')
  const users = get_users()
  res.send(users)
}
