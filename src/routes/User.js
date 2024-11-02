const express = require('express');
const router = express.Router();
const cors = require('cors');
const authMiddleware = require('../middleware/authMiddleware')
const userController = require('../app/controllers/UserController');

router.use(cors());

router.get('/users', authMiddleware.authenticateToken ,userController.getUsers);
router.post('/getIdsByEmails', authMiddleware.authenticateToken, userController.getIdsByEmails);
 

module.exports = router;