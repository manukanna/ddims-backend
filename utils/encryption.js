const crypto = require("crypto");
require("dotenv").config();

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_SECRET); // 32 bytes (256 bits)

function encrypt(text) {
  const iv = crypto.randomBytes(16); // 16 bytes for AES
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex")
  };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, "hex")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData.content, "hex")),
    decipher.final()
  ]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
