

const generateUniqueID = ()=>{
    const timestamp = Date.now().toString();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(6, '0'); // Số ngẫu nhiên 3 chữ số
    return timestamp + randomSuffix;
}

module.exports = generateUniqueID;
