const userService = require('/learnNodejs/FileUploadProject/src/services/SignUp');

async function createUser(req, res) {
    try {
        const userData = req.body;
        const user = await userService.createUser(userData);
        res.status(201).json({ user, message: "Tạo tài khoản thành công" });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });  // Trả về lỗi nếu email đã tồn tại
    }
}

module.exports = { createUser };
