// var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/test');

// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log('co');
//   // we're connected!
// });

// console.log('end');

const l = console.log;

// const a = new Promise((y, n) => {
//   throw 'No!'
// });

// a.then(x => l('success1', x), x => l('faillure1', x))
// .then(x => l('success2', x), x => l('faillure2', x))

const a = new Promise((y, n) => {
  n('No');
}).catch(err => {
  l('caught', err);
  return 'yolo';
});

a.then(r => {
  l(r);
});

// a.then(x => l('success1', x)).catch(x => { l('faillure1', x); throw x})
// .then(x => l('success2', x), x => l('faillure2', x))
