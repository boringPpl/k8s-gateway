import { initK8sClient } from './k8s-client';
import * as FakeClient from './fake-client';
import * as FlownoteClient from './flownote-client';

const getClient = () => {
  const { NODE_ENV } = process.env;
  const testEnvs = ['test', 'development'];

  if (testEnvs.includes(NODE_ENV)) return FakeClient;

  initK8sClient().then(() => console.log('LOADED K8S CLIENT SPEC'));
  return FlownoteClient;
};

export default getClient();
