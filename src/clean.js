import { getClient } from './k8s/client';

const k8sClient = getClient();

k8sClient.cleanKernels()
  .then(() => process.exit())
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
