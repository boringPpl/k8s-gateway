export const writeSSEHeaders = (res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
};

export const sendSSEData = res => (data) => {
  const formatted = `data: ${data}\n\n`;
  res.write(formatted);
};


export const sendSSEJSONData = res => (data) => {
  const jsonString = JSON.stringify(data);
  sendSSEData(res)(jsonString);
};
