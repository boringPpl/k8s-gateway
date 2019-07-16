import chai from 'chai';
import chaiHttp from 'chai-http';

import server from '../../src/index';
import { generateToken } from './token';

chai.use(chaiHttp);
const chaiRequester = chai.request(server).keepOpen();
const { expect } = chai;

const defaultToken = generateToken({ profileId: 'test', role: 'ADMIN' });
const requester = {
  get: (...args) => chaiRequester.get(...args).set('X-Auth-Token', defaultToken),
  post: (...args) => chaiRequester.post(...args).set('X-Auth-Token', defaultToken),
  put: (...args) => chaiRequester.put(...args).set('X-Auth-Token', defaultToken),
  delete: (...args) => chaiRequester.delete(...args).set('X-Auth-Token', defaultToken),
  patch: (...args) => chaiRequester.patch(...args).set('X-Auth-Token', defaultToken),
  close: () => chaiRequester.close(),
};

export {
  requester,
  expect,
};
