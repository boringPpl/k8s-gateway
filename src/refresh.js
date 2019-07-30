import k8sClient from './k8s/client';

const k8sGatewayDeployment = process.env.GATEWAY_DEPLOYMENT || 'k8s-gateway';

k8sClient.refreshDeployment(k8sGatewayDeployment)
  .then(() => process.exit())
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
