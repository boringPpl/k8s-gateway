// Caution: This function modify root argument
// exec func should resolve object {}
import { pick } from 'lodash/fp';

const rollbackWaterFall = (actions = []) => {
  const rollbacks = [];
  const root = {};

  return actions.reduce(
    (waterfall, { pickAttr = [], exec, rollback }, step) => {
      const flow = (droplet = {}) => {
        const attrs = pick(pickAttr)(droplet);
        Object.assign(root, { ...attrs, step: step + 1 });
        if (rollback) rollbacks.push(rollback);
        return exec(root);
      };

      const stop = (error) => {
        if (rollbacks.length === 0) return Promise.reject(error);

        Object.assign(root, { error });
        if (rollback) rollbacks.pop();

        return rollbacks.reduce(
          (rs, rb) => rs.then(() => rb(root)).catch(console.log),
          Promise.resolve(),
        )
          .then(() => {
            rollbacks.length = 0;
            return Promise.reject(error);
          });
      };

      return waterfall.then(flow).catch(stop);
    },
    Promise.resolve(root),
  );
};

export default rollbackWaterFall;
