import k8sClient from './k8s/client';

k8sClient.cleanKernels()
  .then(() => process.exit())
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
