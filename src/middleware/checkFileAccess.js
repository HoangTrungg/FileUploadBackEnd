const File = require('../app/models/File');
const ShareFile = require('../app/models/ShareFile');
const fs = require('fs');

const checkFileAccess = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const { fileId, shareLink } = req.params;

        let file;

        if (fileId) {
            file = await File.findById(fileId);

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File không tồn tại'
                });
            }

            const isOwner = file.uploadedBy.toString() === userId;
            const isPublic = file.access === 'public';

            if (isOwner || isPublic) {
                return next(); 
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập file này'
                });
            }
        }

        if (shareLink) {
            const sharedFile = await ShareFile.findOne({ shareLink }).populate('fileId');

            if (!sharedFile) {
                return res.status(404).json({
                    success: false,
                    message: 'Liên kết chia sẻ không tồn tại hoặc đã hết hạn'
                });
            }

            file = sharedFile.fileId;

            const isAllowedUser = file.allowedEmails.includes(userEmail);

            if (isAllowedUser) {
                return next(); 
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập file này 1'
                });
            }
        }

        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin yêu cầu hợp lệ'
        });

    } catch (error) {
        console.error('Lỗi khi kiểm tra quyền truy cập:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi kiểm tra quyền truy cập'
        });
    }
};

module.exports = checkFileAccess;
