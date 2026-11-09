import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';


dotenv.config();

const envSchema = z.object({
  SCHOOL_NAME: z.string().min(1).default('XX大學'),
  PORT: z.coerce.number().default(4321),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_PATH: z.string().default('./data/database.sqlite'),
  UPLOAD_DIR: z.string().default('./data/uploads'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET 必須至少 32 個字元').default('default_session_secret_for_local_development_only_32_bytes!'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET 必須至少 32 個字元').default('default_csrf_secret_for_local_development_only_32_bytes!!'),
  TRUST_PROXY: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).default(false),
  TUNNEL_TOKEN: z.string().optional().default('')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ 環境變數設定錯誤:', parsed.error.format());
  throw new Error('環境變數設定不符規格');
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  isDev: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',
  resolvedDbPath: path.resolve(process.cwd(), parsed.data.DATABASE_PATH),
  resolvedUploadDir: path.resolve(process.cwd(), parsed.data.UPLOAD_DIR)
};
