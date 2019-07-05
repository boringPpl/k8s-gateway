import server from '../src/index';

after(() => server.close());
