import k8sClient from './k8s/client';

Promise.all([
  k8sClient.cleanKernels(),
  k8sClient.cleanCronjobs(),
])
  .then(() => process.exit())
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
