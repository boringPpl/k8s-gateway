import { assign } from 'lodash/fp';

export const addSelector = selectors => (query) => {
  const adds = Object.keys(selectors).reduce((rs, key) => {
    const before = (query[key] && query[key].split(',')) || [];
    const after = before.concat([selectors[key]]).join(',');
    return assign(rs)({ [key]: after });
  }, {});

  return assign(query)(adds);
};
