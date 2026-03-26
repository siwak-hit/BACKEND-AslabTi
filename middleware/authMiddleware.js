const supabase = require('../config/supabaseClient');

const verifyToken = async (req, res, next) => {
    try {
        // Ambil token dari header Authorization (Format: Bearer <token>)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "Akses ditolak. Token tidak ditemukan." });
        }

        const token = authHeader.split(' ')[1];

        // Verifikasi token ke Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ success: false, message: "Token tidak valid atau sudah kadaluarsa." });
        }

        // Ambil role user dari tabel profiles untuk pengecekan role nanti
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        // Titipkan data user dan role ke dalam request object agar bisa dipakai di controller
        req.user = {
            id: user.id,
            email: user.email,
            role: profile ? profile.role : 'student'
        };

        next(); // Lanjut ke controller
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};

// Middleware khusus untuk mengecek apakah user adalah Guru
const isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Akses ditolak. Hanya guru yang dapat melakukan aksi ini." });
    }
};

module.exports = { verifyToken, isTeacher };