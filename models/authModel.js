const supabase = require('../config/supabaseClient');

const authModel = {
    // Cek ketersediaan NPM di tabel profil
    getProfileByNPM: async (npm) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('npm', npm)
            .single(); // Kita ambil 1 baris saja
        
        if (error) throw error;
        return data;
    },

    // Login menggunakan sistem Auth bawaan Supabase
    signInWithEmail: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;
        return data;
    },

    getStudentSchedules: async (studentId) => {
        // Melakukan JOIN dari class_students ke tabel classes
        const { data, error } = await supabase
            .from('class_students')
            .select(`
                class_id,
                classes ( day_of_week, start_time, end_time )
            `)
            .eq('student_id', studentId);
            
        if (error) throw error;
        return data;
    },

    // (Opsional) Update status login jika kamu tambah kolom is_logged_in di DB
    updateLoginStatus: async (userId, isOnline) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ is_logged_in: isOnline })
            .eq('id', userId)
            .select();
            
        if (error) throw error;
        return data;
    }
};

module.exports = authModel;