import bcrypt from 'bcryptjs';

// 从数据库获取的哈希值
const hashFromDB = '$2a$12$PQK6MEos5o4rvg6vtlfuvuUYYNM45UeuVCfIlEfxvoIv68WfWFUM.';

// 测试密码验证
console.log('=== Admin 密码验证测试 ===');
console.log('数据库中的哈希值:', hashFromDB);

// 测试正确密码
const correctPassword = 'admin';
const isCorrectValid = bcrypt.compareSync(correctPassword, hashFromDB);
console.log(`密码 "${correctPassword}" 验证结果:`, isCorrectValid ? '✅ 正确' : '❌ 错误');

// 测试错误密码
const wrongPassword = 'wrongpassword';
const isWrongValid = bcrypt.compareSync(wrongPassword, hashFromDB);
console.log(`密码 "${wrongPassword}" 验证结果:`, isWrongValid ? '✅ 正确' : '❌ 错误');

// 测试空密码
const emptyPassword = '';
const isEmptyValid = bcrypt.compareSync(emptyPassword, hashFromDB);
console.log(`密码 "${emptyPassword}" 验证结果:`, isEmptyValid ? '✅ 正确' : '❌ 错误');

console.log('\n=== 总结 ===');
console.log('admin 用户密码设置成功:', isCorrectValid ? '✅' : '❌');
console.log('密码安全性测试通过:', !isWrongValid && !isEmptyValid ? '✅' : '❌'); 