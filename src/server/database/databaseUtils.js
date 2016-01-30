import { MongoClient } from 'mongodb';

// import config from '../../config';
import log from '../../shared/utils/logger';
import definitions from '../../shared/models/definitions';

// Only promisers (fn that returns a promise)

export function connect(url) {
  
  return new MongoClient.connect(url).then(db => {
    log("... Connected correctly to mongo");
    return db;
  });
}

export function disconnect(db) {
  
  return db.close().then(() => {
    log("... Disconnected correctly from mongo");
    return db;
  });
}

// Will create the collection unless already existant
export function createCollections(db) {
  
  let promises = [];
  for (let model in definitions) {
    const { pluralName, uniqueIndexs } = definitions[model];
    
    promises.push(new Promise((resolve, reject) => {
      log('... Creating collection', pluralName);
      
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
  log('... Dropping db');
  
  return db.dropDatabase().then(() => db);
}
