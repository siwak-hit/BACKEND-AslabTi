const sessionModel = require('../models/sessionModel');
const { generateBlurredIndices, maskAnswer } = require('../utils/gameLogic');

exports.initLiveSession = async (req, res) => {
    try {
        // Asumsinya Frontend Astro akan mengirim JSON seperti ini:
        // { 
        //   "meetingId": "uuid-pertemuan", 
        //   "maxPoints": 350, 
        //   "questions": [
        //      { "text": "Sebutkan kepanjangan dari HTML!", "answer": "Hypertext Markup Language", "points": 50 },
        //      { "text": "Tag untuk membuat paragraf adalah?", "answer": "<p>", "points": 30 }
        //   ] 
        // }
        const { meetingId, maxPoints, questions } = req.body;

        // Validasi input
        if (!meetingId || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Meeting ID dan minimal satu pertanyaan wajib diisi." 
            });
        }

        // 1. Buat Sesi Induknya terlebih dahulu
        const session = await sessionModel.createLiveSession(meetingId, maxPoints);

        // 2. Format array pertanyaan agar sesuai dengan nama kolom di tabel database
        const formattedQuestions = questions.map(q => ({
            session_id: session.id,
            question_text: q.text,
            answer_key: q.answer,
            points_value: q.points || 50 // Default 50 poin jika tidak diisi
        }));

        // 3. Masukkan semua pertanyaan ke database secara serentak
        const savedQuestions = await sessionModel.insertQuestions(formattedQuestions);

        res.status(201).json({
            success: true,
            message: "Sesi live berhasil disiapkan (Status: Preparing). Mahasiswa belum bisa masuk.",
            data: {
                sessionId: session.id,
                status: session.status,
                questionsCount: savedQuestions.length
            }
        });

    } catch (error) {
        console.error("Error initLiveSession:", error);
        res.status(500).json({ 
            success: false, 
            message: "Gagal menyiapkan sesi live", 
            error: error.message 
        });
    }
};

exports.throwQuestion = async (req, res) => {
    try {
        const { sessionId, questionId } = req.body;

        if (!sessionId || !questionId) {
            return res.status(400).json({ 
                success: false, 
                message: "Session ID dan Question ID wajib disertakan." 
            });
        }

        // 1. Bersihkan antrian dari soal sebelumnya (jika ada)
        await sessionModel.clearSessionQueue(sessionId);

        // 2. Lempar pertanyaan baru dengan mengubah status sesi
        const activeSession = await sessionModel.activateQuestion(sessionId, questionId);

        // BEKERJANYA SUPABASE REALTIME (TIDAK PERLU KODE DI SINI):
        // Saat 'live_sessions' terupdate, Supabase akan mengirim event ke Frontend Astro.
        // Layar mahasiswa yang tadinya 'Menunggu' akan langsung menampilkan soal ini.

        res.status(200).json({
            success: true,
            message: "Pertanyaan berhasil dilontarkan! Sesi sekarang aktif.",
            data: activeSession
        });

    } catch (error) {
        console.error("Error throwQuestion:", error);
        res.status(500).json({ 
            success: false, 
            message: "Gagal melontarkan pertanyaan", 
            error: error.message 
        });
    }
};

exports.raiseHand = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const studentId = req.user.id; // Diambil dari token middleware saat mahasiswa login

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "Session ID tidak valid." });
        }

        // 1. Cek apakah siswa ini sudah ada di dalam antrian (Mencegah spam klik)
        const isAlreadyInQueue = await sessionModel.checkStudentInQueue(sessionId, studentId);
        if (isAlreadyInQueue) {
            return res.status(400).json({ 
                success: false, 
                message: "Sabar, kamu sudah masuk di dalam antrian!" 
            });
        }

        const session = await sessionModel.getSessionDetail(sessionId);
        if (session.is_queue_locked) {
            return res.status(403).json({ 
                success: false, 
                message: "Yah, gerbang antrian sudah ditutup oleh Guru!" 
            });
        }

        // 2. Cek jumlah antrian saat ini
        const currentCount = await sessionModel.getQueueCount(sessionId);

        // 3. Batasi maksimal 3 orang
        if (currentCount >= 3) {
            return res.status(403).json({ 
                success: false, 
                message: "Yah, telat. Antrian sudah penuh (Maksimal 3 orang)!" 
            });
        }

        // 4. Penentuan Status Giliran
        // Jika dia orang pertama (count == 0), maka langsung dapat giliran (is_active_turn = true)
        // Jika dia orang kedua/ketiga, statusnya 'waiting'
        const isActiveTurn = currentCount === 0 ? true : false;
        const queueStatus = currentCount === 0 ? 'answering' : 'waiting';

        // 5. Masukkan ke database
        const newQueue = await sessionModel.addStudentToQueue({
            session_id: sessionId,
            student_id: studentId,
            is_active_turn: isActiveTurn,
            status: queueStatus
        });

        // Response ke mahasiswa yang mengklik
        res.status(201).json({
            success: true,
            message: isActiveTurn 
                ? "Kamu giliran pertama! Silakan jawab." 
                : `Berhasil masuk antrian ke-${currentCount + 1}. Bersiaplah jika antrian sebelumnya gagal!`,
            data: newQueue
        });

    } catch (error) {
        console.error("Error raiseHand:", error);
        res.status(500).json({ 
            success: false, 
            message: "Gagal memproses raise hand", 
            error: error.message 
        });
    }
};

// Guru menekan tombol "Set Timer"
exports.startTimer = async (req, res) => {
    try {
        const { sessionId, durationInSeconds } = req.body; // Misal: 30 detik
        
        const updatedSession = await sessionModel.setTimerAndLockQueue(sessionId, durationInSeconds);
        
        res.status(200).json({ success: true, message: "Timer dimulai dan antrian dikunci!", data: updatedSession });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memulai timer", error: error.message });
    }
};

// Siswa (yang sedang dapat giliran) menekan tombol "Tahan Waktu"
exports.tapTimer = async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        // Ambil data sesi untuk tahu sisa waktu saat ini
        const session = await sessionModel.getSessionDetail(sessionId);
        
        // Cek apakah timer memang sedang berjalan
        if (session && session.timer_ends_at) {
            await sessionModel.extendTimer(sessionId, session.timer_ends_at);
        }

        res.status(200).json({ success: true, message: "Waktu berhasil ditahan +0.5 detik!" });
    } catch (error) {
        // Kita tidak perlu error response yang heboh di sini karena ini akan di-hit berkali-kali (spam)
        res.status(500).json({ success: false, message: "Gagal tap" });
    }
};

// Guru menilai jawaban (atau sistem Frontend mengirim trigger Timeout)
exports.evaluateAnswer = async (req, res) => {
    try {
        const { sessionId, studentId, isCorrect } = req.body;

        if (isCorrect) {
            // Jika benar, akhiri penderitaan. Mahasiswa dapat poin (Nanti kita buat integrasi ke point_logs)
            await sessionModel.addPointsLog(studentId, sessionId, 50, 'correct_answer');
    
            // 2. Akhiri antrian dengan sukses
            await sessionModel.updateQueueStatus(sessionId, studentId, 'success');
            await sessionModel.setTimerAndLockQueue(sessionId, 0); 
        
            return res.status(200).json({ success: true, message: "Jawaban Benar! +50 Poin ditambahkan." });
        } else {
            // Jika salah (atau timeout): 
            // 1. Ubah statusnya jadi failed
            await sessionModel.updateQueueStatus(sessionId, studentId, 'failed');
            
            // 2. Lempar ke orang berikutnya di antrian
            const nextStudent = await sessionModel.activateNextInQueue(sessionId);
            
            // 3. Reset timer agar layar bersih, guru bisa set timer ulang untuk antrian ke-2
            const { data, error } = await supabase
                .from('live_sessions')
                .update({ timer_ends_at: null })
                .eq('id', sessionId);

            if (nextStudent) {
                res.status(200).json({ success: true, message: "Jawaban Salah/Timeout! Giliran dilempar ke antrian berikutnya.", nextTurn: nextStudent });
            } else {
                res.status(200).json({ success: true, message: "Jawaban Salah/Timeout! Antrian sudah habis. Soal hangus." });
            }
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengevaluasi jawaban", error: error.message });
    }
};

exports.buyHint = async (req, res) => {
    try {
        const { queueId, sessionId } = req.body; // ID dari tabel session_queue
        const studentId = req.user.id;

        // 1. Cek Saldo Poin Mahasiswa
        const totalPoints = await sessionModel.getTotalPoints(studentId);
        if (totalPoints < 10) {
            return res.status(403).json({ success: false, message: "Yah, poin kamu tidak cukup untuk beli kata!" });
        }

        // 2. Ambil data antriannya dan jawaban asli
        const session = await sessionModel.getSessionDetail(sessionId);
        const { data: queueData } = await supabase.from('session_queue').select('*').eq('id', queueId).single();
        const { data: questionData } = await supabase.from('session_questions').select('answer_key').eq('id', session.current_question_id).single();

        let blurredWords = queueData.blurred_words || [];
        let unlockedWords = queueData.unlocked_words || [];

        // 3. SHUFFLE LOGIC (Hanya terjadi 1x di awal saat array masih kosong)
        if (blurredWords.length === 0) {
            blurredWords = generateBlurredIndices(questionData.answer_key);
            // Simpan pola acakan ini ke database agar tetap sama kalau di-refresh
            await supabase.from('session_queue').update({ blurred_words: blurredWords }).eq('id', queueId);
        }

        // 4. Cari kata yang masih tertutup (ada di blurred, tapi belum ada di unlocked)
        const lockedWords = blurredWords.filter(index => !unlockedWords.includes(index));

        if (lockedWords.length === 0) {
            return res.status(400).json({ success: false, message: "Semua kata yang disensor sudah terbuka!" });
        }

        // 5. Buka 1 kata secara acak dari yang masih terkunci
        const wordToUnlock = lockedWords[Math.floor(Math.random() * lockedWords.length)];
        unlockedWords.push(wordToUnlock);

        // 6. POTONG POIN (-10)
        await sessionModel.addPointsLog(studentId, sessionId, -10, 'buy_hint');

        // 7. Update database antrian dengan kata yang baru terbuka
        await sessionModel.unlockHintWord(queueId, unlockedWords);

        // 8. Rangkai ulang kalimat untuk dikirim ke Frontend
        const maskedText = maskAnswer(questionData.answer_key, blurredWords, unlockedWords);

        res.status(200).json({
            success: true,
            message: "1 Kata berhasil dibuka! -10 Poin.",
            data: { hint_text: maskedText }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memproses hint", error: error.message });
    }
};


