import { MongoClient } from 'mongodb';

import config from '../config';
import definitions from '../../models/definitions';

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
export function createCollections(db) {
  
  let promises = [];
  for (let model in definitions) {
    const { pluralName, uniqueIndexs } = definitions[model];
    
    promises.push(new Promise((resolve, reject) => {
      console.log('Creating collection', pluralName);
      
      const params = { autoIndexId: false }; // till someone tells me why i should keep '_id'
      db.createCollection(pluralName, params, (err, col) => {
        if (err) return reject(err);
        
        // Custom indexs
        // Assumes uniqueIndexs is array. if (Array.isArray(uniqueIndexs)) 
        if (uniqueIndexs) uniqueIndexs.forEach(i => col.ensureIndex({ [i]: 1 }, { unique: true }));
        
        resolve();
      });
    }));
  }
  
  return Promise.all(promises).then(() => db);
}

export function dropDatabase(db) {
  console.log('Dropping db');
  
  return db.dropDatabase().then(() => db);
}
