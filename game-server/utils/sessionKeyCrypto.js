/**
 * session_key 加密存储：AES-256-GCM，避免明文落库
 * 密钥通过环境变量 SESSION_KEY_ENCRYPTION_KEY 配置（64 位十六进制字符串，即 32 字节）
 * 生成密钥：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LEN = 12;
const SEP = ':';

/**
 * 获取加密密钥（32 字节）。未配置时抛出错误，避免误存明文。
 * @returns {Buffer}
 */
function getKey() {
  const raw = process.env.SESSION_KEY_ENCRYPTION_KEY;
  if (!raw || raw.length !== 64 || !/^[0-9a-fA-F]+$/.test(raw)) {
    throw new Error(
      'SESSION_KEY_ENCRYPTION_KEY 未配置或格式错误：请在服务器环境变量中配置，值为 64 位十六进制字符串。生成命令: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(raw, 'hex');
}

/**
 * 加密 session_key，返回可落库的字符串（iv:authTag:ciphertext，均为 base64）
 * @param {string} plainText
 * @returns {string}
 */
function encryptSessionKey(plainText) {
  if (plainText == null || plainText === '') return plainText;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(SEP);
}

/**
 * 解密已存储的 session_key
 * @param {string} cipherText - 格式为 iv:authTag:ciphertext
 * @returns {string}
 */
function decryptSessionKey(cipherText) {
  if (cipherText == null || cipherText === '') return cipherText;
  const parts = cipherText.split(SEP);
  if (parts.length !== 3) {
    throw new Error('session_key 密文格式错误');
  }
  const key = getKey();
  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const enc = Buffer.from(parts[2], 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final('utf8');
}

module.exports = {
  encryptSessionKey,
  decryptSessionKey,
};
