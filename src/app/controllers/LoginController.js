const authService = require('/learnNodejs/FileUploadProject/src/services/Login');

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const token = await authService.login(email, password);
        return res.status(200).json({ token });
    } catch (error) {
        return res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ' });
    }
}

async function refreshToken(req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token không tồn tại' });
        }
        const newToken = await authService.refreshToken(token);
        return res.status(200).json({ newToken });
    } catch (error) {
        return res.status(401).json({ message: 'Token đã hết hiệu lực hoặc không hợp lệ' });
    }
}

module.exports = { login, refreshToken };
