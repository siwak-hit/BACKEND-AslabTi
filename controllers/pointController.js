const pointModel = require('../models/pointModel');

exports.getClassLeaderboard = async (req, res) => {
    try {
        const { classId } = req.params;

        if (!classId) {
            return res.status(400).json({ success: false, message: "Class ID diperlukan" });
        }

        const rawData = await pointModel.getLeaderboardData(classId);

        // Transformasi Data (Pivot)
        // Dari baris memanjang menjadi: { NPM: { nama, total_semua, pertemuan: { "Pert 1": 50, "Pert 2": 0 } } }
        const leaderboardMap = {};

        rawData.forEach(row => {
            if (!leaderboardMap[row.npm]) {
                leaderboardMap[row.npm] = {
                    student_id: row.student_id,
                    npm: row.npm,
                    full_name: row.full_name,
                    grand_total: 0,
                    meetings: {} // Menyimpan detail per pertemuan
                };
            }

            // Masukkan poin per pertemuan
            const pointPerMeeting = parseInt(row.total_points, 10);
            leaderboardMap[row.npm].meetings[row.meeting_title] = pointPerMeeting;
            
            // Tambahkan ke Grand Total keseluruhan
            leaderboardMap[row.npm].grand_total += pointPerMeeting;
        });

        // Ubah dari Object ke Array dan urutkan berdasarkan Grand Total Tertinggi (Ranking)
        const sortedLeaderboard = Object.values(leaderboardMap).sort((a, b) => b.grand_total - a.grand_total);

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data leaderboard",
            data: sortedLeaderboard
        });

    } catch (error) {
        console.error("Error getClassLeaderboard:", error);
        res.status(500).json({ 
            success: false, 
            message: "Gagal mengambil data leaderboard", 
            error: error.message 
        });
    }
};