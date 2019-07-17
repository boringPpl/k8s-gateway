import { requester, expect } from '../../../utils/chai-tools';
import { getMessage } from '../../../utils/error-response';
import { generateToken } from '../../../utils/token';

describe('V1', () => {
  describe('Kernels', () => {
    describe('Create', () => {
      it('Create', (done) => {
        const pod = {
          metadata: {
            name: 'test',
            labels: {
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

        const ingress = {};

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
        const pod = {
          metadata: {
            name: 'test5',
            labels: {
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

    describe('Watch', () => {
      it('OK', (done) => {
        const pod = {
          metadata: {
            name: 'test7',
            labels: {
              notebookPath: 'test7',
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

        requester.post('/v1/kernels')
          .set('X-Auth-Token', generateToken({ profileId: 'test7', role: 'MEMBER' }))
          .send({ pod, service, ingress })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.get('/v1/kernels/watch')
              .set('X-Auth-Token', generateToken({ profileId: 'test7', role: 'MEMBER' }))
              .buffer(true)
              .parse((resp) => {
                resp.on('data', (chunk) => {
                  const data = chunk.toString('utf8');
                  if (data.includes('data: ')) done();
                });
              });
          })
          .catch(done);
      });
    });
  });
});
