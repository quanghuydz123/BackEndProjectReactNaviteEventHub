const removeVietnameseTones = (str) => {
  return str
    .normalize('NFD') // Tách tổ hợp ký tự và dấu
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
    .replace(/đ/g, 'd') // Thay thế ký tự 'đ'
    .replace(/Đ/g, 'D') // Thay thế ký tự 'Đ'
    .trim(); // Loại bỏ khoảng trắng ở đầu và cuối
};

const cleanString = (str) => {
  return removeVietnameseTones(str)
    .replace(/\s+/g, ' ') // Thay thế nhiều khoảng trắng liên tiếp bằng 1 khoảng trắng
    .trim(); // Loại bỏ khoảng trắng ở đầu và cuối
};

module.exports = { removeVietnameseTones, cleanString };
