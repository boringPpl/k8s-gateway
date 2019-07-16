import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';

const resolvedPath = path.resolve(__dirname, '../secrets/key');
const privateKey = fs.readFileSync(resolvedPath);
export const generateToken = payload => jwt.sign(payload, privateKey, { algorithm: 'RS256' });
