import { requester, expect } from '../../../utils/chai-tools';
import { getMessage } from '../../../utils/error-response';

describe('V1', () => {
  describe('Secrets', () => {
    describe('Upsert', () => {
      const dockerConfig = 'eyJhdXRocyI6eyJkb2NrZXIuaW8iOnsidXNlcm5hbWUiOiJ0dW5nIiwicGFzc3dvcmQiOiJ0dW5nIiwiZW1haWwiOiJ0dW5nQG1zdGFnZS5pbyJ9fX0=';

      it('Create', (done) => {
        const secretName = 'test';
        requester.put(`/v1/secrets/${secretName}`)
          .send({ data: { '.dockerconfigjson': dockerConfig }, type: 'kubernetes.io/dockerconfigjson' })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });

      it('Update', (done) => {
        const secretName = 'test2';
        requester.put(`/v1/secrets/${secretName}`)
          .send({ data: { '.dockerconfigjson': dockerConfig }, type: 'kubernetes.io/dockerconfigjson' })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.put(`/v1/secrets/${secretName}`)
              .send({ data: { '.dockerconfigjson': dockerConfig }, type: 'kubernetes.io/dockerconfigjson' });
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });
    });

    describe('Delete', () => {
      const dockerConfig = 'eyJhdXRocyI6eyJkb2NrZXIuaW8iOnsidXNlcm5hbWUiOiJ0dW5nIiwicGFzc3dvcmQiOiJ0dW5nIiwiZW1haWwiOiJ0dW5nQG1zdGFnZS5pbyJ9fX0=';

      it('Delete', (done) => {
        const secretName = 'test3';
        requester.put(`/v1/secrets/${secretName}`)
          .send({ data: { '.dockerconfigjson': dockerConfig }, type: 'kubernetes.io/dockerconfigjson' })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            return requester.delete(`/v1/secrets/${secretName}`);
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });
    });
  });
});
