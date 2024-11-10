const express = require('express');
const router = express.Router();
const fileController = require('../app/controllers/FileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  fileController.uploadFile
);

router.get(
  '/files',
  authenticateToken,
  fileController.getFiles
);

router.get(
  '/files/deleted',
  authenticateToken,
  fileController.getAllFilesWithDeleted
);

router.put(
  '/files/:fileId/access',
  authenticateToken,
  fileController.changeFileAccess
);

router.delete(
  '/files/:fileId/deleted',
  authenticateToken,
  fileController.softDeleteFile
);

router.patch(
  '/files/:fileId/forceDeleted',
  authenticateToken,
  fileController.forceDeleteFile
);
 
router.put(
    '/files/:fileId/restoreDeleted',
    authenticateToken,
    fileController.recoverFile
  );

router.post(
  '/files/share',
  authenticateToken,
  fileController.shareFile
);

router.get('/files/:fileId/download', authenticateToken, fileController.downloadFile);

router.get('/getShareFile',authenticateToken,fileController.getSharedFilesModel )

router.get('/shared-files', authenticateToken, fileController.getSharedFiles);
router.get('/shared/:shareLink', authenticateToken, fileController.downloadSharedFile);
router.put('/shared/:shareLink', authenticateToken, fileController.updateShareFile);
router.delete('/shared/:shareLink/revoke', authenticateToken, fileController.revokeShareAccess);
router.get('/shared-info/:shareLink',authenticateToken, fileController.getSharedFileInfo);

module.exports = router;