const User = require('../app/models/User');

async function getUsers() {
    const users = await User.find({});
    return users;
}

module.exports =  { getUsers };