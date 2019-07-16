import express from 'express';
import bodyParser from 'body-parser';

import { authorize, cors } from './auth/middlewares';
import kernels from './routers/v1/kernels';
import secrets from './routers/v1/secrets';
import daemonsets from './routers/v1/daemonsets';

const app = express();
const port = process.env.EXPRESS_PORT || 3000;

app.use(cors);
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(authorize);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => res.sendStatus(200));
app.use('/v1/kernels', kernels);
app.use('/v1/secrets', secrets);
app.use('/v1/daemonsets', daemonsets);

const server = app.listen(port);

export default server;
