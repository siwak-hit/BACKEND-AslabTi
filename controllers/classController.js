const classModel = require('../models/classModel');

exports.getClasses = async (req, res) => {
    try {
        // Cukup panggil fungsi dari model
        const classes = await classModel.getAllClasses();
        
        res.status(200).json({
            success: true,
            data: classes
        });
    } catch (error) {
        console.error("Error getClasses:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data kelas",
            error: error.message
        });
    }
};

exports.addClass = async (req, res) => {
    try {
        // Ambil data dari body request
        const { name, subject, session_info, total_meetings, teacher_id } = req.body;

        // Validasi sederhana
        if (!name || !subject) {
            return res.status(400).json({ success: false, message: "Nama dan mata pelajaran wajib diisi" });
        }

        const newClass = await classModel.createClass({
            name,
            subject,
            session_info,
            total_meetings,
            teacher_id
        });

        res.status(201).json({
            success: true,
            message: "Kelas berhasil ditambahkan",
            data: newClass
        });
    } catch (error) {
        console.error("Error addClass:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menambah kelas",
            error: error.message
        });
    }
};

exports.editClass = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body; // Isinya: name, day_of_week, start_time, dll
        
        const updatedClass = await classModel.updateClass(id, updateData);
        res.status(200).json({ success: true, message: "Kelas berhasil diupdate", data: updatedClass });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal update kelas", error: error.message });
    }
};

exports.removeClass = async (req, res) => {
    try {
        const { id } = req.params;
        await classModel.deleteClass(id);
        res.status(200).json({ success: true, message: "Kelas berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal hapus kelas", error: error.message });
    }
};

// Tambahkan di bawah exports.getClasses
exports.getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        const classData = await classModel.getClassById(id);
        
        if (!classData) {
            return res.status(404).json({ success: false, message: "Kelas tidak ditemukan" });
        }

        res.status(200).json({
            success: true,
            data: classData
        });
    } catch (error) {
        console.error("Error getClassById:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil detail kelas",
            error: error.message
        });
    }
};