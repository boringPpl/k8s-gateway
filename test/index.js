import { requester } from './utils/chai-tools';
import server from '../src/index';

after(() => server.close());
after(() => requester.close());
