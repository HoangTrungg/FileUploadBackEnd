const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect('mongodb://localhost:27017/fileuploadproject-mongo-1');
        console.log('MongoDb kết nối thành công');
    } catch (error) {
        console.error('MongoDb kết nối thất bại:', error);
        process.exit(1); // Thoát nếu không kết nối được
    }
}

module.exports = { connect };
