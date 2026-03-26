const supabase = require('../config/supabaseClient');

const pointModel = {
    // Mengambil data rekap poin seluruh mahasiswa di suatu kelas
    getLeaderboardData: async (classId) => {
        const { data, error } = await supabase
            .from('class_leaderboard') // Memanggil View, bukan Table biasa
            .select('*')
            .eq('class_id', classId)
            .order('npm', { ascending: true })
            .order('meeting_order', { ascending: true });

        if (error) throw error;
        return data;
    }
};

module.exports = pointModel;