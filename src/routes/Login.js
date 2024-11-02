const express = require('express');
const router = express.Router();
const cors = require('cors');

const loginController = require('../app/controllers/LoginController');

router.use(cors());

router.post('/Login', loginController.login);
router.post('/refresh-token', loginController.refreshToken);



module.exports = router;