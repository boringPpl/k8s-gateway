import chai from 'chai';
import chaiHttp from 'chai-http';

import server from '../../src/index';

chai.use(chaiHttp);
const requester = chai.request(server).keepOpen();
const { expect } = chai;

export {
  requester,
  expect,
};
