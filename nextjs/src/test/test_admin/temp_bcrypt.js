import bcrypt from 'bcryptjs';

// 生成admin密码的哈希值
const password = 'admin';
const saltRounds = 12;

console.log('原密码:', password);
console.log('加密轮数:', saltRounds);

const hash = bcrypt.hashSync(password, saltRounds);
console.log('BCrypt 哈希值:', hash);

// 验证哈希是否正确
const isValid = bcrypt.compareSync(password, hash);
console.log('验证结果:', isValid); 