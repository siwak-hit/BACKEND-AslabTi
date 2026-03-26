const authModel = require('../models/authModel');

exports.loginStudent = async (req, res) => {
    try {
        const { npm } = req.body;

        // Validasi input
        if (!npm) {
            return res.status(400).json({ success: false, message: "NPM wajib diisi" });
        }

        // 1. Cek apakah NPM terdaftar di database
        const profile = await authModel.getProfileByNPM(npm);
        
        if (!profile || profile.role !== 'student') {
            return res.status(404).json({ success: false, message: "NPM tidak ditemukan atau bukan mahasiswa" });
        }

        // === TAMBAHAN LOGIKA PENGECEKAN JADWAL ===
        const schedules = await authModel.getStudentSchedules(profile.id);

        // Ambil waktu saat ini di WIB
        const currDateWIB = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
        const currentDay = currDateWIB.getDay(); 
        const currentTime = currDateWIB.toTimeString().split(' ')[0]; // Format "HH:MM:SS"
        
        let isAllowedToLogin = false;

        // 1. Cek apakah masuk jam bebas akses malam hari (19:00:00 - 23:59:59)
        if (currentTime >= '19:00:00' && currentTime <= '23:59:59') {
            isAllowedToLogin = true;
        } else {
            // 2. Jika bukan malam hari, cek apakah sedang ada jadwal kelas praktikum
            for (const row of schedules) {
                const cls = row.classes;
                if (cls && cls.day_of_week === currentDay) {
                    if (currentTime >= cls.start_time && currentTime <= cls.end_time) {
                        isAllowedToLogin = true;
                        break;
                    }
                }
            }
        }

        if (!isAllowedToLogin) {
            return res.status(403).json({ 
                success: false, 
                message: "Akses ditolak. Anda hanya bisa login saat jadwal praktikum atau pada jam malam (19:00 - 00:00 WIB)." 
            });
        }

        // 2. Manipulasi NPM menjadi format email dan siapkan password rahasia
        const email = `${npm}${process.env.STUDENT_EMAIL_DOMAIN}`;
        const password = process.env.DEFAULT_STUDENT_PASSWORD;

        // 3. Eksekusi login ke Supabase
        const authData = await authModel.signInWithEmail(email, password);

        // 4. (Opsional) Tandai mahasiswa sedang online
        // await authModel.updateLoginStatus(profile.id, true);

        // 5. Kembalikan data profil dan token (session) ke Frontend
        res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: {
                user: profile,
                session: authData.session // Mengandung access_token untuk ditaruh di Header FE
            }
        });

    } catch (error) {
        console.error("Error loginStudent:", error);
        res.status(401).json({
            success: false,
            message: "Gagal login. Pastikan NPM sudah didaftarkan oleh Guru.",
            error: error.message
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const { userId } = req.body; 

        // Pada arsitektur JWT stateless (Supabase), logout utamanya adalah 
        // menghapus token di sisi Frontend (Astro). 
        // Tapi di Backend, kita bisa gunakan ini untuk update status "offline".
        
        if (userId) {
            // await authModel.updateLoginStatus(userId, false);
        }

        res.status(200).json({
            success: true,
            message: "Berhasil logout. Silakan hapus token di sisi klien."
        });
    } catch (error) {
        console.error("Error logout:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat logout",
            error: error.message
        });
    }
};