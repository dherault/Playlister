const _ = console.log;
// var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/test');

// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log('co');
//   // we're connected!
// });

// console.log('end');


// const a = new Promise((y, n) => {
//   throw 'No!'
// });

// a.then(x => _('success1', x), x => _('faillure1', x))
// .then(x => _('success2', x), x => _('faillure2', x))

// const a = new Promise((y, n) => {
//   n('No');
// }).catch(err => {
//   _('caught', err);
//   return 'yolo';
// });

// a.then(r => {
//   _(r);
// });

// a.then(x => _('success1', x)).catch(x => { _('faillure1', x); throw x})
// .then(x => _('success2', x), x => _('faillure2', x))

// const a = [{a: 1}, {a: 1}];
// _(Array.from(new Set(a))); // :'(
// const a = {a: 1};
// const b= [a, a];
// _(Array.from(new Set(b))); // :)

// const x = Promise.resolve();
// const y = Promise.resolve(true);

// const a = [x, x, y, x];

// _(a);

// const x = Promise.resolve();
// const y = Promise.resolve(true);

// const a = [x, x, y, x];

// Promise.all(a).then(r => _(r.some(r => r)))
