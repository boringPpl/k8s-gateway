import { requester, expect } from '../../../utils/chai-tools';
import { getMessage } from '../../../utils/error-response';

describe('V1', () => {
  describe('Kernels', () => {
    describe('Create', () => {
      it('Create', (done) => {
        // notebookPath to construct url(default to podName)
        const pod = {
          metadata: {
            name: 'test',
            labels: {
              profileId: 'tung',
              notebookPath: 'test',
              shutdownTime: (Date.now() + 10000).toString(),
            },
          },
          container: {
            image: 'jupyter/minimal-notebook',
            ports: [{ containerPort: 3000 }],
            args: ['--NotebookApp.port=3000'],
          },
          spec: {
            securityContext: {},
            dnsPolicy: 'ClusterFirstWithHostNet',
            hostNetwork: true,
            imagePullSecrets: [{ name: 'tung' }],
          },
        };

        const service = {
          port: { port: 9999 },
        };

        const ingress = {
          host: 'shopee.kernel.hasbrain.com',
          spec: {
            tls: [],
          },
        };

        requester.post('/v1/kernels')
          .send({ pod, service, ingress })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });

      it('Create Fail then Rollback', (done) => {
        const pod = {
          metadata: {
            name: 'test2',
            labels: {
              profileId: 'tung',
            },
          },
          container: { image: 'jupyter/minimal-notebook' },
          spec: { securityContext: {} },
        };

        const service = {
          metadata: { name: '' },
        };

        requester.post('/v1/kernels')
          .send({ pod, service })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(422);
            done();
          })
          .catch(done);
      });
    });

    describe('Get One', () => {
      it('OK', (done) => {
        const pod = {
          metadata: {
            name: 'test3',
            labels: {
              profileId: 'tung',
              notebookPath: 'test3',
            },
          },
          container: {
            image: 'jupyter/minimal-notebook',
          },
          spec: {
            securityContext: {},
          },
        };

        const service = {
          port: { port: 9090 },
        };

        const ingress = {
          host: 'shopee.kernel.hasbrain.com',
          spec: {
            tls: [],
          },
        };

        requester.post('/v1/kernels')
          .send({ pod, service, ingress })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.get(`/v1/kernels/${pod.metadata.name}`);
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });
    });

    describe('List', () => {
      it('OK', (done) => {
        const pod = {
          metadata: {
            name: 'test4',
            labels: {
              profileId: 'tung',
              specialNotebook: 'test',
              notebookPath: 'test4',
            },
          },
          container: { image: 'jupyter/minimal-notebook' },
          spec: {
            securityContext: {},
          },
        };

        const service = {
          port: { port: 9091 },
        };

        const ingress = {
          host: 'shopee.kernel.hasbrain.com',
          spec: {
            tls: [],
          },
        };

        requester.post('/v1/kernels')
          .send({ pod, service, ingress })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.get('/v1/kernels?labels=specialNotebook%3Dtest');
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            expect(res.body.data).to.have.lengthOf(1);
            done();
          })
          .catch(done);
      });
    });

    describe('Delete', () => {
      it('Delete', (done) => {
        // notebookPath to construct url(default to podName)
        const pod = {
          metadata: {
            name: 'test5',
            labels: {
              profileId: 'tung',
              notebookPath: 'test5',
              shutdownTime: (Date.now() + 10000).toString(),
            },
          },
          container: {
            image: 'jupyter/minimal-notebook',
            ports: [{ containerPort: 3000 }],
            args: ['--NotebookApp.port=3000'],
          },
          spec: {
            securityContext: {},
            dnsPolicy: 'ClusterFirstWithHostNet',
            hostNetwork: true,
            imagePullSecrets: [{ name: 'tung' }],
          },
        };

        const service = {
          port: { port: 9999 },
        };

        const ingress = {
          host: 'shopee.kernel.hasbrain.com',
          spec: {
            tls: [],
          },
        };

        requester.post('/v1/kernels')
          .send({ pod, service, ingress })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.delete(`/v1/kernels/${pod.metadata.name}`);
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });
    });

    describe('Patch', () => {
      it('OK', (done) => {
        const pod = {
          metadata: {
            name: 'test6',
            labels: {
              profileId: 'tung',
              notebookPath: 'test6',
            },
          },
          container: {
            image: 'jupyter/minimal-notebook',
          },
        };

        const service = {
          port: { port: 9999 },
        };

        const ingress = {
          host: 'shopee.kernel.hasbrain.com',
          spec: {
            tls: [],
          },
        };

        const shutdownTime = Date.now() + 10000;

        requester.post('/v1/kernels')
          .send({ pod, service, ingress })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.patch(`/v1/kernels/${pod.metadata.name}`)
              .send({ shutdownTime });
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.get(`/v1/kernels/${pod.metadata.name}`);
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            expect(res.body.shutdownTime).to.equal(shutdownTime);
            done();
          })
          .catch(done);
      });
    });
  });
});
