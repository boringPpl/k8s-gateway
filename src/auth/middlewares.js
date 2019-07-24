import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { get } from 'lodash/fp';

const { VALID_ORIGINS, FLOWNOTE_KEY_PUB, CLUSTER_ID } = process.env;
const publicKeyFilePath = FLOWNOTE_KEY_PUB || '/etc/flownote/token/key.pub';
const publicKeyCacheTime = 60 * 60 * 1000;
const publicKeyStore = {};

export const authorize = (req, res, next) => {
  const now = Date.now();
  if (!publicKeyStore.key || publicKeyStore.exp < now) {
    const resolvedPath = path.resolve(__dirname, publicKeyFilePath);
    publicKeyStore.key = fs.readFileSync(resolvedPath);
    publicKeyStore.exp = now + publicKeyCacheTime;
  }

  const token = req.headers['x-auth-token'] || req.query.token;

  return jwt.verify(token, publicKeyStore.key, (err, payload) => {
    if (err) return res.sendStatus(401);
    if (CLUSTER_ID !== payload.clusterId) return res.sendStatus(403);
    req.user = payload;
    return next();
  });
};

const validOriginsFromENV = VALID_ORIGINS && VALID_ORIGINS.split(',').map(o => o.trim());
const validOrigins = validOriginsFromENV || [
  'hasbrain.com',
  'flownote.ai',
];
const validOriginsRegex = validOrigins.map(origin => new RegExp(`${origin}$`));

export const cors = (req, res, next) => {
  const { headers: { origin } } = req;
  if (!origin) return next();
  if (!validOriginsRegex.some(rgx => origin.match(rgx))) return next();

  res.header('Access-Control-Allow-Origin', origin);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token',
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Vary', 'Origin');

  return next();
};

export const allow = roles => (req, res, next) => {
  const role = get('user.role')(req);

  if (roles.includes(role)) {
    next();
  } else {
    res.sendStatus(403);
  }
};
