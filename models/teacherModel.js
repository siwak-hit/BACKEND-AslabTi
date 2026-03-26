const supabase = require('../config/supabaseClient');

const teacherModel = {
    // 1. Buat user di sistem Auth Supabase (Bypass verifikasi email)
    createAuthUser: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Langsung aktif!
            user_metadata: { full_name: fullName }
        });

        if (error) throw error;
        return data.user; // Mengembalikan object user dari Auth
    },

    // 2. Masukkan data ke tabel profiles (dengan NPM)
    createProfile: async (userId, npm, fullName) => {
        const { data, error } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                npm: npm,
                full_name: fullName,
                role: 'student'
            }])
            .select();

        if (error) throw error;
        return data[0];
    },

    // 3. Masukkan mahasiswa ke dalam kelas tertentu
    enrollStudentToClass: async (classId, studentId) => {
        const { data, error } = await supabase
            .from('class_students')
            .insert([{ class_id: classId, student_id: studentId }])
            .select();

        if (error) throw error;
        return data[0];
    },

    removeStudentFromClass: async (classId, studentId) => {
        const { data, error } = await supabase
            .from('class_students')
            .delete()
            .match({ class_id: classId, student_id: studentId }); // Menghapus relasi spesifik
        if (error) throw error;
        return data;
    }
};

module.exports = teacherModel;