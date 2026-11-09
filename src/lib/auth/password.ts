import argon2 from 'argon2';





export async function hashPassword(plainText: string): Promise<string> {
  return await argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 19456, 
    timeCost: 2,
    parallelism: 1
  });
}




export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch (err) {
    console.error('[Auth] 密碼驗證異常:', err);
    return false;
  }
}
