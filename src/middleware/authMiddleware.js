const jwt = require('jsonwebtoken');
const config = require('../config/jwtconfig');

function authenticateToken(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Không thể xác thực: không tìm thấy token' });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Không thể xác thực: token không đúng định dạng' });
  }

  jwt.verify(token, config.secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Cảnh báo: Token không hợp lệ' });
    }

    req.user = user; 
    next();
  });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, config.secretKey);
    } catch (error) {
        throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }
}

module.exports = { authenticateToken,verifyToken };
