const teacherModel = require('../models/teacherModel');

exports.addStudentToClass = async (req, res) => {
    try {
        const { classId, npm, fullName } = req.body;

        // Validasi
        if (!classId || !npm || !fullName) {
            return res.status(400).json({ success: false, message: "Class ID, NPM, dan Nama wajib diisi." });
        }

        // Siapkan email dummy dan password rahasia dari environment
        const email = `${npm}${process.env.STUDENT_EMAIL_DOMAIN}`;
        const password = process.env.DEFAULT_STUDENT_PASSWORD;

        // 1. Daftarkan ke Supabase Auth
        const authUser = await teacherModel.createAuthUser(email, password, fullName);

        // 2. Tambahkan ke tabel profiles
        const profile = await teacherModel.createProfile(authUser.id, npm, fullName);

        // 3. Masukkan ke dalam kelas
        await teacherModel.enrollStudentToClass(classId, authUser.id);

        res.status(201).json({
            success: true,
            message: "Mahasiswa berhasil ditambahkan ke kelas",
            data: profile
        });

    } catch (error) {
        console.error("Error addStudentToClass:", error);
        
        // Handle jika NPM/Email sudah terdaftar
        if (error.message.includes('already registered') || error.code === '23505') {
             return res.status(409).json({ success: false, message: "Mahasiswa dengan NPM ini sudah terdaftar." });
        }

        res.status(500).json({
            success: false,
            message: "Gagal menambahkan mahasiswa",
            error: error.message
        });
    }
};

exports.kickStudent = async (req, res) => {
    try {
        // Ambil dari query string atau params (misal: /api/teacher/kick?classId=123&studentId=456)
        const { classId, studentId } = req.query; 

        if (!classId || !studentId) {
            return res.status(400).json({ success: false, message: "classId dan studentId diperlukan" });
        }

        await teacherModel.removeStudentFromClass(classId, studentId);
        res.status(200).json({ success: true, message: "Mahasiswa berhasil dikeluarkan dari kelas" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengeluarkan mahasiswa", error: error.message });
    }
};

exports.addStudentsBulk = async (req, res) => {
    try {
        // Frontend akan mengirimkan array of object hasil dari parsing CSV template
        // Contoh format: { students: [ { classId: "uuid", npm: "123", fullName: "Budi" }, ... ] }
        const { students } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ success: false, message: "Data mahasiswa tidak valid atau kosong." });
        }

        const password = process.env.DEFAULT_STUDENT_PASSWORD;
        const results = {
            success: [],
            failed: []
        };

        // Kita gunakan for...of loop agar pemrosesan berurutan (mencegah limit API Supabase)
        for (const student of students) {
            const { classId, npm, fullName } = student;
            const email = `${npm}${process.env.STUDENT_EMAIL_DOMAIN}`;

            try {
                // 1. Daftarkan ke Supabase Auth
                const authUser = await teacherModel.createAuthUser(email, password, fullName);

                // 2. Tambahkan ke tabel profiles
                await teacherModel.createProfile(authUser.id, npm, fullName);

                // 3. Masukkan ke dalam kelas
                await teacherModel.enrollStudentToClass(classId, authUser.id);

                results.success.push({ npm, fullName, message: "Berhasil didaftarkan" });
            } catch (error) {
                // Jika satu mahasiswa gagal (misal NPM sudah ada), catat di array failed, 
                // tapi JANGAN hentikan loop untuk mahasiswa berikutnya.
                results.failed.push({ 
                    npm, 
                    fullName, 
                    reason: error.message.includes('already registered') || error.code === '23505' 
                        ? "NPM sudah terdaftar" 
                        : error.message 
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Proses bulk insert selesai. Berhasil: ${results.success.length}, Gagal: ${results.failed.length}`,
            data: results
        });

    } catch (error) {
        console.error("Error addStudentsBulk:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan sistem saat memproses bulk insert",
            error: error.message
        });
    }
};