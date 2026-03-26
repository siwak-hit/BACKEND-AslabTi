require('dotenv').config();
const supabase = require('./config/supabaseClient');

async function seedData() {
    console.log("Memulai proses seeding data...");

    try {
        // ==========================================
        // 1. BUAT AKUN GURU (KAMU)
        // ==========================================
        console.log("Membuat akun Guru...");
        const teacherEmail = 'wakhidaziz@gmail.com';
        const teacherPassword = 'wakhid123*.*';
        const teacherName = 'Wakhid Khoirul Aziz'; // Menggunakan nama lengkapmu

        // Daftar ke Supabase Auth
        const { data: authTeacher, error: errAuthTeacher } = await supabase.auth.admin.createUser({
            email: teacherEmail,
            password: teacherPassword,
            email_confirm: true,
            user_metadata: { full_name: teacherName }
        });

        if (errAuthTeacher && !errAuthTeacher.message.includes('already registered')) {
            throw errAuthTeacher;
        }

        const teacherId = authTeacher?.user?.id;

        if (teacherId) {
            // Masukkan ke tabel profiles sebagai 'teacher'
            const { error: errProfileTeacher } = await supabase.from('profiles').upsert([{
                id: teacherId,
                full_name: teacherName,
                role: 'teacher'
            }]);
            if (errProfileTeacher) throw errProfileTeacher;
            console.log("✅ Akun Guru berhasil dibuat!");
        } else {
            console.log("⚠️ Akun Guru sudah ada sebelumnya.");
        }

        // ==========================================
        // 2. BUAT 3 DATA SISWA DUMMY
        // ==========================================
        console.log("\nMembuat 3 akun Siswa Dummy...");
        
        const dummyStudents = [
            { npm: '11111', name: 'Andi Praktikan' },
            { npm: '22222', name: 'Budi Gamifikasi' },
            { npm: '33333', name: 'Citra Aslab' }
        ];

        const defaultStudentPassword = process.env.DEFAULT_STUDENT_PASSWORD;
        const emailDomain = process.env.STUDENT_EMAIL_DOMAIN;

        for (const student of dummyStudents) {
            const studentEmail = `${student.npm}${emailDomain}`;
            
            // Daftar ke Auth
            const { data: authStudent, error: errAuthStudent } = await supabase.auth.admin.createUser({
                email: studentEmail,
                password: defaultStudentPassword,
                email_confirm: true,
                user_metadata: { full_name: student.name }
            });

            if (errAuthStudent && !errAuthStudent.message.includes('already registered')) {
                console.error(`Gagal membuat Auth untuk ${student.npm}:`, errAuthStudent.message);
                continue;
            }

            const studentId = authStudent?.user?.id;

            if (studentId) {
                // Masukkan ke tabel profiles
                await supabase.from('profiles').upsert([{
                    id: studentId,
                    npm: student.npm,
                    full_name: student.name,
                    role: 'student'
                }]);
                console.log(`✅ Siswa ${student.name} (${student.npm}) berhasil dibuat!`);
            }
        }

        console.log("\n🎉 Proses seeding selesai! Silakan coba login.");

    } catch (error) {
        console.error("❌ Terjadi kesalahan saat seeding:", error);
    }
}

// Jalankan fungsi
seedData();