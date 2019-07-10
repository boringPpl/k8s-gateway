import express from 'express';
import bodyParser from 'body-parser';

import kernels from './routers/v1/kernels';
import secrets from './routers/v1/secrets';

const app = express();
const { EXPRESS_PORT, VALID_ORIGINS } = process.env;
const port = EXPRESS_PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const validOriginsFromENV = VALID_ORIGINS && VALID_ORIGINS.split(',').map(o => o.trim());
const validOrigins = validOriginsFromENV || [
  'hasbrain.com',
  'flownote.ai',
];
const validOriginsRegex = validOrigins.map(origin => new RegExp(`${origin}$`));

app.use((req, res, next) => {
  const { headers: { origin } } = req;
  if (!origin) return next();
  if (!validOriginsRegex.some(rgx => origin.match(rgx))) return next();

  res.header('Access-Control-Allow-Origin', origin);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Vary', 'Origin');
  return next();
});


app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get('/', (req, res) => res.sendStatus(200));
app.use('/v1/kernels', kernels);
app.use('/v1/secrets', secrets);

const server = app.listen(port);

export default server;
