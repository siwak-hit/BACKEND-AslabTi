const multer = require('multer');

// Gunakan memoryStorage agar file tidak disimpan di disk/folder lokal
const storage = multer.memoryStorage();

// Batasi ukuran file (misal maksimal 10MB)
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

module.exports = upload;