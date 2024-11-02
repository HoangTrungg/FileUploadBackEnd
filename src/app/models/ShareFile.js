const mongoose = require('mongoose');

const shareFileSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    sharedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sharedWith: [{ type: String }],
    shareLink: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ShareFile = mongoose.model('ShareFile', shareFileSchema);
module.exports = ShareFile;