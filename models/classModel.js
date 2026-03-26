const supabase = require('../config/supabaseClient');

const classModel = {
    // Fungsi get semua kelas
    getAllClasses: async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Fungsi create kelas baru
    createClass: async (classData) => {
        const { data, error } = await supabase
            .from('classes')
            .insert([classData])
            .select(); // Return data yang baru di-insert
            
        if (error) throw error;
        return data;
    },

    // Tambahkan di dalam object classModel
    updateClass: async (classId, updateData) => {
        const { data, error } = await supabase
            .from('classes')
            .update(updateData)
            .eq('id', classId)
            .select();
        if (error) throw error;
        return data[0];
    },

    deleteClass: async (classId) => {
        const { data, error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId);
        if (error) throw error;
        return data;
    }
};

module.exports = classModel;