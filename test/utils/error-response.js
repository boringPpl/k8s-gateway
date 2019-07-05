export const getMessage = (res) => {
  const wrapper = `Body ${'='.repeat(50)}`;
  const endWrapper = '='.repeat(wrapper.length);
  const body = JSON.stringify(res.body, null, 2);
  return `\n${wrapper}\n${body}\n${endWrapper}\n\tError`;
};
