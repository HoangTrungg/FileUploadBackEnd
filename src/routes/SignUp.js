const express = require('express');
const router = express.Router();

const signupController = require('../app/controllers/SignUpController');

router.post('/Register', signupController.createUser);



module.exports = router;