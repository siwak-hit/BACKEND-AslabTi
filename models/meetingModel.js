const supabase = require('../config/supabaseClient');

const meetingModel = {
    // 1. Buat Pertemuan Baru (misal: "Pertemuan 1")
    createMeeting: async (meetingData) => {
        const { data, error } = await supabase
            .from('meetings')
            .insert([meetingData])
            .select();
            
        if (error) throw error;
        return data[0];
    },

    // 2. Upload File Fisik ke Supabase Storage (Bucket: class-assets)
    uploadFileToStorage: async (fileBuffer, fileName, mimeType) => {
        // Biar nama file gak bentrok, kita tambahin timestamp
        const uniqueFileName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
        
        const { data, error } = await supabase.storage
            .from('class-assets')
            .upload(`materials/${uniqueFileName}`, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) throw error;
        return data.path; // Mengembalikan path, contoh: "materials/1678..._modul1.pdf"
    },

    // 3. Simpan Record/Data File ke Tabel Database
    createMaterialRecord: async (materialData) => {
        const { data, error } = await supabase
            .from('meeting_materials')
            .insert([materialData])
            .select();

        if (error) throw error;
        return data[0];
    }
};

module.exports = meetingModel;