// utils/gameLogic.js
exports.generateBlurredIndices = (answerString) => {
    const words = answerString.split(' ');
    const totalWords = words.length;
    
    // Kita set misal 50% dari total kata akan di-blur (maksimal disisakan 1 kata jika terlalu pendek)
    const blurCount = Math.max(1, Math.floor(totalWords / 2)); 
    const indices = [];
    
    while(indices.length < blurCount) {
        const randomIndex = Math.floor(Math.random() * totalWords);
        if(!indices.includes(randomIndex)) {
            indices.push(randomIndex);
        }
    }
    return indices; // Contoh output: [3, 6, 12]
};

exports.maskAnswer = (answerString, blurredIndices, unlockedIndices) => {
    const words = answerString.split(' ');
    return words.map((word, index) => {
        // Jika index ini termasuk yang di-blur DAN belum di-unlock (dibeli)
        if (blurredIndices.includes(index) && !unlockedIndices.includes(index)) {
            return word.replace(/[a-zA-Z0-9]/g, '*'); // Ubah huruf/angka jadi bintang
        }
        return word; // Tampilkan kata asli
    }).join(' ');
};