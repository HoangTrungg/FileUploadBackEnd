const bcrypt = require('bcrypt');
const User = require('../app/models/User');
const { generateToken } = require('../utils/jwtUtils');
const { verifyToken } = require('../middleware/authMiddleware');

async function login(email, password) {
    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            throw new Error('Không tìm thấy tài khoản');
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordValid) {
            throw new Error('Mật khẩu sai');
        }

        const token = generateToken(existingUser);
        return token;
    } catch (error) {
        throw new Error('Invalid credentials');
    }
}

async function refreshToken(oldToken) {
    try {
        const decodedToken = verifyToken(oldToken);
        const user = await User.findById(decodedToken.id); 
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        const newToken = generateToken(user);
        return newToken;
    } catch (error) {
        throw new Error('Token đã hết hiệu lực');
    }
}

module.exports = {
    login,
    refreshToken,
};
