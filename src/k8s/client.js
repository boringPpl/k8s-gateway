import * as fakeClient from './fake-client';
import * as inclusterClient from './incluster-client';

export const getClient = () => {
  if (process.env.NODE_ENV === 'test') {
    return fakeClient;
  }

  inclusterClient.initClient();
  return inclusterClient;
};
