const meetingModel = require('../models/meetingModel');

// Controller untuk membuat Pertemuan (Folder) baru
exports.addMeeting = async (req, res) => {
    try {
        const { class_id, title, meeting_order, description } = req.body;

        if (!class_id || !title) {
            return res.status(400).json({ success: false, message: "Class ID dan Judul wajib diisi" });
        }

        const meeting = await meetingModel.createMeeting({
            class_id, title, meeting_order, description
        });

        res.status(201).json({ success: true, message: "Pertemuan berhasil dibuat", data: meeting });
    } catch (error) {
        console.error("Error addMeeting:", error);
        res.status(500).json({ success: false, message: "Gagal membuat pertemuan", error: error.message });
    }
};

// Controller untuk Upload Materi/Tugas ke dalam Pertemuan
exports.uploadMaterial = async (req, res) => {
    try {
        const { meeting_id, type } = req.body; // type bisa diisi: 'materi', 'tugas_pendahuluan', dll
        const file = req.file; // Ini didapat dari middleware multer

        if (!meeting_id || !type || !file) {
            return res.status(400).json({ success: false, message: "Meeting ID, Type, dan File wajib disertakan" });
        }

        // 1. Upload fisik file ke Storage via Model
        const filePath = await meetingModel.uploadFileToStorage(file.buffer, file.originalname, file.mimetype);

        // 2. Simpan path-nya ke tabel database via Model
        const materialRecord = await meetingModel.createMaterialRecord({
            meeting_id,
            type,
            file_path: filePath,
            file_name: file.originalname
        });

        res.status(201).json({ 
            success: true, 
            message: "File berhasil diunggah", 
            data: materialRecord 
        });

    } catch (error) {
        console.error("Error uploadMaterial:", error);
        res.status(500).json({ success: false, message: "Gagal mengunggah file", error: error.message });
    }
};