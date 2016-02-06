const _ = console.log;

const x = Promise.resolve();
const y = Promise.resolve(true);

const a = [x, x, y, x];

Promise.all(a).then(r => _(r.some(r => r)))
