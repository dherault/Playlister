import { MongoClient } from 'mongodb';

import config from '../config';

// Only promisers (fn that returns a promise)

export function connect() {
  
  return new Promise((resolve, reject) => {
  
    MongoClient.connect(config.mongoURL, (err, db) => {
      if (err) return reject(err);
      
      console.log("Connected correctly to mongo");
      
      resolve(db);
    });
  });
}

export function disconnect(db) {
  
  return new Promise((resolve, reject) => db.close(err => err ? reject(err) : resolve(db)));
}

// Will create the collection unless already existant
export function createTables(db) {
  
  // to be modified
  const tables = ['users'];
  
  // Will resolve 'db'
  return new Promise((resolve, reject) => {
    
    Promise.all(tables.map(table => new Promise((resolve, reject) => {
      console.log('Creating table', table);
      db.createCollection(table, (err, collection) => err ? reject(err) : resolve());
    })))
    .then(() => resolve(db), reject);
  });
}
