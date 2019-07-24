import { requester, expect } from '../../../utils/chai-tools';
import { getMessage } from '../../../utils/error-response';
import { generateName } from '../../../utils/generator';

describe('V1', () => {
  describe('Cronjobs', () => {
    describe('Get All', () => {
      it('OK', (done) => {
        requester.post('/v1/cronjobs')
          .send({
            metadata: {
              name: generateName('cronjob'),
              labels: {
                shutdownTime: Date.now().toString(),
                good: 'one',
              },
            },
            schedule: '0 * * * *',
            container: {
              image: 'jupyter/minimal-notebook',
              args: [
                '/bin/sh',
                '-c',
                'date; echo Hello from the Kubernetes cluster',
              ],
            },
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.get('/v1/cronjobs?labels=good%3Done');
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            expect(res.body.data).to.have.lengthOf(1);
            done();
          })
          .catch(done);
      });
    });

    describe('Create', () => {
      it('OK', (done) => {
        requester.post('/v1/cronjobs')
          .send({
            metadata: {
              name: generateName('cronjob'),
              labels: {
                shutdownTime: Date.now().toString(),
              },
            },
            schedule: '0 * * * *',
            container: {
              image: 'jupyter/minimal-notebook',
              args: [
                '/bin/sh',
                '-c',
                'date; echo Hello from the Kubernetes cluster',
              ],
            },
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });
    });

    describe('Delete', () => {
      it('OK', (done) => {
        const name = generateName('cronjob');

        requester.post('/v1/cronjobs')
          .send({
            metadata: {
              name,
              labels: {
                shutdownTime: Date.now().toString(),
              },
            },
            schedule: '0 * * * *',
            container: {
              image: 'jupyter/minimal-notebook',
              args: [
                '/bin/sh',
                '-c',
                'date; echo Hello from the Kubernetes cluster',
              ],
            },
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.delete(`/v1/cronjobs/${name}`);
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });
    });

    describe('Update', () => {
      it('OK', (done) => {
        const name = generateName('cronjob');
        const shutdownTime = 123;

        requester.post('/v1/cronjobs')
          .send({
            metadata: {
              name,
              labels: {
                shutdownTime: Date.now().toString(),
              },
            },
            schedule: '* * * * *',
            container: {
              image: 'jupyter/minimal-notebook',
              args: [
                '/bin/sh',
                '-c',
                'date; echo Hello from the Kubernetes cluster',
              ],
            },
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.patch(`/v1/cronjobs/${name}`)
              .send({ shutdownTime: 123 });
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
