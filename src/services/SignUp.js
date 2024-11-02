const User = require('../app/models/User');
const bcrypt = require('bcrypt');

async function createUser(userData) {
    const { name, email, password } = userData;

    // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('Email đã được sử dụng. Vui lòng chọn email khác.');
    }

    // Nếu email chưa tồn tại, tiến hành mã hóa mật khẩu và tạo tài khoản
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
    });

    // Lưu tài khoản mới vào cơ sở dữ liệu
    const savedUser = await newUser.save();
    return savedUser;
}

module.exports = { createUser };
