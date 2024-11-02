    const File = require('../models/File');
    const ShareFile = require('../models/ShareFile');
    const mongoose = require('mongoose');
    const crypto = require('crypto');
    const path = require('path');
    const fs = require('fs');

    class FileController {
        async uploadFile(req, res) {
            try {
                if (!req.file) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Vui lòng chọn file để tải lên' 
                    });
                }

                const file = new File({
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    filePath: req.file.path,
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                    uploadedBy: req.user.id,
                    access: req.body.access || 'private',
                    allowedEmails: req.body.allowedEmails ? 
                        JSON.parse(req.body.allowedEmails) : []
                });

                await file.save();
                res.status(201).json({
                    success: true,
                    message: 'Tải file lên thành công',
                    data: {
                        fileId: file._id,
                        filename: file.originalName,
                        size: file.size,
                        access: file.access
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi tải file lên',
                    error: error.message
                });
            }
        }

        async getFiles(req, res) {
            try {
                const files = await File.find({
                    $or: [
                        { uploadedBy: req.user.id },
                        { access: 'public' },
                        { allowedEmails: req.user.email }
                    ],
                    deleted: false 
                })

                res.json({
                    success: true,
                    data: files.map(file => ({
                        id: file._id,
                        filename: file.originalName,
                        size: file.size,
                        access: file.access,
                        uploadedAt: file.uploadedAt,
                        allowedEmails: file.allowedEmails,
                        filePath : file.filePath,
                    }))
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi lấy danh sách file',
                    error: error.message
                });
            }
        }
        
        async getSharedFilesModel(req, res) {
            try {
                const shareFile = await ShareFile.find({})
                .then(shareFile => res.json({
                    success : true,
                    shareFile : shareFile.map(shareFile => ({
                        id: shareFile._id,
                        fileId : shareFile.fileId,
                        sharedBy : shareFile.sharedBy,
                        shareLink :shareFile.shareLink,
                        sharedWith : shareFile.sharedWith,
                    }))
                }))
            }catch (error) {
                error.message('Loi ')
            }
        }


        async shareFile(req, res) {
            try {
                const { fileId, emails } = req.body;
        
                if (!Array.isArray(emails) || emails.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Danh sách email không hợp lệ'
                    });
                }
        
                const file = await File.findById(fileId);
                if (!file) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không tìm thấy file'
                    });
                }
        
                if (file.uploadedBy.toString() !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền chia sẻ file này'
                    });
                }
        
                const newEmails = emails.filter(email => !file.allowedEmails.includes(email));
        
                if (newEmails.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tất cả email đã có quyền truy cập vào file'
                    });
                }
        
                const shareLink = crypto.randomBytes(16).toString('hex');
        
                await ShareFile.create({
                    fileId: file._id,
                    sharedBy: req.user.id,
                    shareLink,
                    sharedWith: newEmails 
                });
        
                file.allowedEmails = [...file.allowedEmails, ...newEmails];
                await file.save();
        
                res.status(201).json({
                    success: true,
                    message: 'File đã được chia sẻ thành công',
                    shareLink
                });
                
            } catch (error) {
                console.error('Lỗi khi chia sẻ file:', error);
                if (error.name === 'ValidationError') {
                    return res.status(400).json({
                        success: false,
                        message: 'Email không hợp lệ',
                        errors: Object.values(error.errors).map(err => err.message)
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi chia sẻ file',
                    error: error.message
                });
            }
        }
        
        
        
        async getSharedFiles(req, res) {
            try {
            const shareFiles = await ShareFile.find({
                $or: [
                { sharedBy: req.user.id },
                { sharedWith: req.user.email }
                ]
            }).populate('fileId');
        
            res.json({
                success: true,
                shareFile: shareFiles.map(share => ({
                id: share._id,
                fileId: share.fileId._id,
                filename: share.fileId.originalName,
                shareLink: share.shareLink,
                sharedWith: share.fileId.allowedEmails,
                createdAt: share.createdAt
                }))
            });
            } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách file được chia sẻ',
                error: error.message
            });
            }
        }
        
        async downloadSharedFile(req, res) {
            try {
            const { shareLink } = req.params;
            const userEmail = req.user.email;
        
            const sharedFile = await ShareFile.findOne({ shareLink }).populate('fileId');
            if (!sharedFile) {
                return res.status(404).json({
                success: false,
                message: 'Link chia sẻ không tồn tại hoặc đã hết hạn'
                });
            }
        
            const file = sharedFile.fileId;
            if (!file) {
                return res.status(404).json({
                success: false,
                message: 'File không tồn tại'
                });
            }
        
            const filePath = file.filePath;
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                success: false,
                message: 'File không tồn tại trên server'
                });
            }
        
            const isOwner = file.uploadedBy.toString() === req.user.id;
            const isPublic = file.access === 'public';
            const isAllowedUser = file.allowedEmails.includes(userEmail);
        
            if (isOwner || isPublic || isAllowedUser) {
                res.download(filePath, file.originalName);
            } else {
                res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập file này'
                });
            }
            } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải file',
                error: error.message
            });
            }
        }

        async downloadFile (req, res)  {
        try {
            const { fileId } = req.params;

            const file = await File.findById(fileId);
            if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
            }

            const filePath = path.resolve(file.filePath);
            if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File does not exist on the server'
            });
            }

            const isOwner = file.uploadedBy.toString() === req.user.id;
            const isPublic = file.access === 'public';

            if (isOwner || isPublic) {
            res.download(filePath, file.originalName, (err) => {
                if (err) {
                res.status(500).json({
                    success: false,
                    message: 'Error while downloading the file'
                });
                }
            });
            } else {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to access this file'
            });
            }
        } catch (error) {
            res.status(500).json({
            success: false,
            message: 'Error downloading file',
            error: error.message
            });
        }
        };


        async updateShareFile(req, res) {
            try {
            const { shareLink } = req.params;
            const { newEmails } = req.body;
        
            const shareFile = await ShareFile.findOne({ shareLink }).populate('fileId');
            if (!shareFile) {
                return res.status(404).json({
                success: false,
                message: 'Link chia sẻ không tồn tại'
                });
            }
        
            if (shareFile.sharedBy.toString() !== req.user.id) {
                return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền cập nhật quyền chia sẻ'
                });
            }
        
            const file = shareFile.fileId;
            file.allowedEmails = [...new Set([...file.allowedEmails, ...newEmails])];
            await file.save();
        
            res.json({
                success: true,
                message: 'Cập nhật quyền chia sẻ thành công',
                allowedEmails: file.allowedEmails
            });
            } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật quyền chia sẻ',
                error: error.message
            });
            }
        }
        
        async revokeShareAccess(req, res) {
            try {
            const { shareLink } = req.params;
            const { email } = req.body;
        
            const shareFile = await ShareFile.findOne({ shareLink }).populate('fileId');
            if (!shareFile) {
                return res.status(404).json({
                success: false,
                message: 'Link chia sẻ không tồn tại'
                });
            }
        
            if (shareFile.sharedBy.toString() !== req.user.id) {
                return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thu hồi quyền truy cập'
                });
            }
        
            const file = shareFile.fileId;
            file.allowedEmails = file.allowedEmails.filter(e => e !== email);
            await file.save();
        
            if (file.allowedEmails.length === 0) {
                await ShareFile.deleteOne({ _id: shareFile._id });
            }
        
            res.json({
                success: true,
                message: 'Thu hồi quyền truy cập thành công'
            });
            } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi thu hồi quyền truy cập',
                error: error.message
            });
            }
        }

        async changeFileAccess(req, res) {
            try {
                const { access, allowedEmails } = req.body;
                const file = await File.findById(req.params.fileId);

                if (!file) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không tìm thấy file'
                    });
                }

                if (file.uploadedBy.toString() !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền cập nhật file này'
                    });
                }

                if (access && !['public', 'private'].includes(access)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Quyền truy cập không hợp lệ'
                    });
                }

                file.access = access || file.access;
                if (allowedEmails) {
                    file.allowedEmails = [...new Set([...file.allowedEmails, ...allowedEmails])];
                }

                await file.save();
                res.json({
                    success: true,
                    message: 'Cập nhật quyền truy cập thành công',
                    data: {
                        access: file.access,
                        allowedEmails: file.allowedEmails
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi cập nhật quyền truy cập',
                    error: error.message
                });
            }
        }

        

        async softDeleteFile(req, res) {
            try {
                const file = await File.findById(req.params.fileId);

                if (!file) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không tìm thấy file'
                    });
                }

                if (file.uploadedBy.toString() !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xóa file này'
                    });
                }

                await file.delete();

                res.json({
                    success: true,
                    message: 'File đã được chuyển vào thùng rác'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi xóa file',
                    error: error.message
                });
            }
        }

        async forceDeleteFile(req, res) {
            try {
                const fileId = req.params.fileId;
                
                if (!mongoose.Types.ObjectId.isValid(fileId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid file ID'
                    });
                }
                
                const file = await File.findById(fileId);
                if (!file) {
                    return res.status(404).json({
                        success: false,
                        message: 'File not found'
                    });
                }
        
                if (file.uploadedBy.toString() !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permission to delete this file'
                    });
                }
        
                await File.updateOne(
                    { _id: fileId },
                    { $set: { deleted: "forceDelete" } }
                );
        
                res.json({
                    success: true,
                    message: 'File has been permanently deleted and marked as "forceDelete"'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Error occurred while force deleting the file',
                    error: error.message
                });
            }
        }
        

        async getAllFilesWithDeleted(req, res) {
            try {
                const files = await File.findWithDeleted({
                    deleted : true
                }).select('-filePath');

                res.json({
                    success: true,
                    data: files.map(file => ({
                        id: file._id,
                        filename: file.originalName,
                        size: file.size,
                        access: file.access,
                        uploadedAt: file.uploadedAt,
                        deleted: file.deleted,
                        deletedAt: file.deletedAt
                    }))
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi lấy danh sách file',
                    error: error.message
                });
            }
        }

        async recoverFile(req, res) {
            try {
                const file = await File.findOneWithDeleted({ _id: req.params.fileId });
        
                if (!file) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không tìm thấy file'
                    });
                }
        
                if (file.uploadedBy.toString() !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền khôi phục file này'
                    });
                }
        
                await file.restore();
        
                res.json({
                    success: true,
                    message: 'File đã được khôi phục thành công',
                    data: {
                        fileId: file._id,
                        filename: file.originalName,
                        size: file.size,
                        access: file.access
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Lỗi khi khôi phục file',
                    error: error.message
                });
            }
        }

        async getAllowedEmails(req, res)  {
        try {
        const { fileId } = req.params;
        const userId = req.user.id;
    
        const file = await File.findById(fileId);
    
        if (!file) return res.status(404).json({ message: 'File not found' });
        if (!file.uploadedBy.equals(userId))
            return res.status(403).json({ message: 'Access denied' });
    
        res.json({ allowedEmails: file.allowedEmails });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
        }
    };
    
    async removeAllowedEmail(req, res) {
        try {
            const { fileId } = req.params;
            const { email, shareLink, shareFileId } = req.body;
            const userId = req.user.id;

            const file = await File.findById(fileId);
            if (!file) return res.status(404).json({ message: 'Không tìm thấy file' });
            if (!file.uploadedBy.equals(userId))
                return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });

            let shareFile;
            if (shareLink) {
                shareFile = await ShareFile.findOne({ shareLink, fileId });
            } else if (shareFileId) {
                shareFile = await ShareFile.findById(shareFileId);
            }

            if (!shareFile) {
                return res.status(404).json({ message: 'Không tìm thấy bản ghi ShareFile' });
            }

            if (file.allowedEmails.includes(email)) {
                file.allowedEmails = file.allowedEmails.filter((allowedEmail) => allowedEmail !== email);
                await file.save();
                
                await ShareFile.findByIdAndDelete(shareFile._id); 

                return res.json({
                    message: 'Email đã được xóa thành công',
                    allowedEmails: file.allowedEmails
                });
            } else {
                return res.status(400).json({ message: 'Email không tồn tại trong allowedEmails' });
            }

        } catch (error) {
            console.error('Lỗi khi xóa email:', error);
            res.status(500).json({ message: 'Lỗi máy chủ' });
        }
    };


    }

    module.exports = new FileController();