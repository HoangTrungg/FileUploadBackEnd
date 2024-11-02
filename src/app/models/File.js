const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const FileSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    filePath: String,
    mimeType: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    access: { type: String, enum: ['public', 'private'], default: 'private' },
    allowedEmails: [{ type: String }],
    uploadedAt: { type: Date, default: Date.now }
}, {
    collection: 'File',
    timestamps: true
});
FileSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('File', FileSchema);
