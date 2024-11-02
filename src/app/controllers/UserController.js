const userService = require('/learnNodejs/FileUploadProject/src/services/User');
const User = require('../models/User');

exports.getUsers = async (req,res) => {
    try {
        const users = await userService.getUsers();
        res.json(users);
    }catch (error) {
        res.status(500).json({message: error});
    }
}

exports.getIdsByEmails = async (req, res) => {
  const { emails } = req.body; 

  try {
    const users = await User.find({ email: { $in: emails } });
    const userIds = users.map(user => user._id);

    res.json({ userIds }); 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
