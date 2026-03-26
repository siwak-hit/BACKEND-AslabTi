const supabase = require('../config/supabaseClient');

const sessionModel = {
    // 1. Buat Sesi Live (Default status: 'preparing')
    createLiveSession: async (meetingId, maxPointsLimit = 350) => {
        const { data, error } = await supabase
            .from('live_sessions')
            .insert([{
                meeting_id: meetingId,
                status: 'preparing',
                max_points_limit: maxPointsLimit
            }])
            .select();

        if (error) throw error;
        return data[0];
    },

    // 2. Masukkan Bank Soal ke Sesi Tersebut (Bulk Insert)
    insertQuestions: async (questionsArray) => {
        const { data, error } = await supabase
            .from('session_questions')
            .insert(questionsArray)
            .select();

        if (error) throw error;
        return data;
    },

    // 3. Mengubah status sesi menjadi 'active' dan set soal yang sedang berjalan
    activateQuestion: async (sessionId, questionId) => {
        const { data, error } = await supabase
            .from('live_sessions')
            .update({ 
                status: 'active', 
                current_question_id: questionId,
                timer_ends_at: null,
                is_queue_locked: false // Buka gerbang antrian setiap soal baru dilempar
            })
            .eq('id', sessionId)
            .select();
        if (error) throw error;
        return data[0];
    },

    // 4. Mengosongkan antrian (Raise Hand) untuk sesi tersebut
    clearSessionQueue: async (sessionId) => {
        const { data, error } = await supabase
            .from('session_queue')
            .delete()
            .eq('session_id', sessionId);

        if (error) throw error;
        return data; // Mengembalikan array kosong jika berhasil dihapus semua
    },

    // 5. Menghitung jumlah orang di antrian saat ini
    getQueueCount: async (sessionId) => {
        const { count, error } = await supabase
            .from('session_queue')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);
        
        if (error) throw error;
        return count;
    },

    // 6. Mengecek apakah siswa sudah pernah klik "Raise Hand" (mencegah spam)
    checkStudentInQueue: async (sessionId, studentId) => {
        const { data, error } = await supabase
            .from('session_queue')
            .select('id')
            .match({ session_id: sessionId, student_id: studentId })
            .maybeSingle(); // Pakai maybeSingle agar tidak error jika tidak ketemu
            
        if (error) throw error;
        return data; // Mengembalikan null jika belum ada
    },

    // 7. Memasukkan mahasiswa ke dalam antrian
    addStudentToQueue: async (queueData) => {
        const { data, error } = await supabase
            .from('session_queue')
            .insert([queueData])
            .select();

        if (error) throw error;
        return data[0];
    },

    // 8. Ambil detail sesi untuk cek status lock
    getSessionDetail: async (sessionId) => {
        const { data, error } = await supabase
            .from('live_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        if (error) throw error;
        return data;
    },

    // 9. Set Timer dan Otomatis Kunci Antrian
    setTimerAndLockQueue: async (sessionId, seconds) => {
        // Hitung waktu selesai di backend
        const endsAt = new Date(Date.now() + seconds * 1000).toISOString();
        const { data, error } = await supabase
            .from('live_sessions')
            .update({ 
                timer_ends_at: endsAt,
                is_queue_locked: true // Kunci antrian agar tidak ada yang bisa raise hand lagi
            })
            .eq('id', sessionId)
            .select();
        if (error) throw error;
        return data[0];
    },

    // 10. Tambah waktu 0.5 detik (Fitur Tap-tap)
    extendTimer: async (sessionId, currentEndsAt) => {
        const newEndsAt = new Date(new Date(currentEndsAt).getTime() + 500).toISOString(); // + 500ms
        const { data, error } = await supabase
            .from('live_sessions')
            .update({ timer_ends_at: newEndsAt })
            .eq('id', sessionId);
        if (error) throw error;
        return data;
    },

    // 11. Ganti status antrian siswa (misal: 'failed' atau 'success')
    updateQueueStatus: async (sessionId, studentId, status) => {
        const { data, error } = await supabase
            .from('session_queue')
            .update({ status: status, is_active_turn: false })
            .match({ session_id: sessionId, student_id: studentId });
        if (error) throw error;
        return data;
    },

    // 12. Cari orang berikutnya di antrian yang masih 'waiting' dan aktifkan
    activateNextInQueue: async (sessionId) => {
        // Cari antrian berikutnya berdasarkan waktu join paling awal
        const { data: nextStudent, error: fetchError } = await supabase
            .from('session_queue')
            .select('*')
            .match({ session_id: sessionId, status: 'waiting' })
            .order('joined_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (fetchError) throw fetchError;

        // Jika ada orang berikutnya, ubah statusnya jadi answering
        if (nextStudent) {
            const { data: updated, error: updateError } = await supabase
                .from('session_queue')
                .update({ is_active_turn: true, status: 'answering' })
                .eq('id', nextStudent.id)
                .select();
            if (updateError) throw updateError;
            return updated[0]; // Mengembalikan data siswa yang mendapat giliran baru
        }
        
        return null; // Jika antrian sudah habis
    },


    // Fungsi untuk menambah/mengurangi poin
    addPointsLog: async (studentId, sessionId, points, reason) => {
        const { data, error } = await supabase
            .from('point_logs')
            .insert([{ student_id: studentId, session_id: sessionId, points: points, reason: reason }]);
        if (error) throw error;
        return data;
    },

    // Fungsi menghitung total poin mahasiswa
    getTotalPoints: async (studentId) => {
        const { data, error } = await supabase
            .from('point_logs')
            .select('points')
            .eq('student_id', studentId);
            
        if (error) throw error;
        return data.reduce((sum, row) => sum + row.points, 0);
    },

    // Fungsi update kata yang di-unlock saat beli hint
    unlockHintWord: async (queueId, newUnlockedArray) => {
        const { data, error } = await supabase
            .from('session_queue')
            .update({ unlocked_words: newUnlockedArray })
            .eq('id', queueId)
            .select();
        if (error) throw error;
        return data[0];
    }
};

module.exports = sessionModel;