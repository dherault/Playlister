import { ObjectID } from 'mongodb';

import log from '../../utils/logger';
import { capitalizeFirstChar } from '../../utils/textUtils';
import definitions from '../../models/definitions';

function addDefaultCRUDBuilders(db, builders) {
  const CRUDbuilders = {};
  
  for (let model in definitions) {
    const { name, pluralName } = definitions[model];
    const suffix = capitalizeFirstChar(name);
    const collection = db.collection(pluralName);
    
    CRUDbuilders['create' + suffix] = params => new Promise((resolve, reject) => {
      collection.insertOne(params, (err, r) => {
        if (err) return reject(err);
        if (r.insertedCount !== 1) return reject(new Error('insertedCount !== 1'));
        resolve(params);
      });
    });
    CRUDbuilders['read' + suffix] = ({ id }) => new Promise((resolve, reject) => {
      collection.findOne({ _id: ObjectID(id) }, (err, r) => {
        if (err) return reject(err);
        // if (r.deletedCount !== 1) return reject(new Error('deletedCount !== 1'));
        resolve(r); // to be tested
      });
    });
    CRUDbuilders['update' + suffix] = ({ id }) => new Promise((resolve, reject) => {
      resolve({});
    });
    CRUDbuilders['delete' + suffix] = ({ id }) => new Promise((resolve, reject) => {
      collection.deleteOne({ _id: id }, (err, r) => {
        if (err) return reject(err);
        if (r.deletedCount !== 1) return reject(new Error('deletedCount !== 1'));
        resolve(true); // to be tested
      });
    });
  }
  
  // Defaults can be overwritten
  return Object.assign(CRUDbuilders, builders);
}

/* Builders return a Promise that resolves the data */
export default db => addDefaultCRUDBuilders(db, {
  
  // Reads all items for a given collection
  readAll: params => new Promise((resolve, reject) => {
    db.collection(params.collection)
    // .find({}, { 
    //   createdAt: 0,
    //   updatedAt: 0,
    //   creationIp: 0,
    // })
    .find()
    .toArray((err, items) => {
      if (err) return reject(err);
      
      // Result normalization
      const normalized = {};
      items.forEach(item => normalized[item._id] = item);
      resolve(normalized);
    });
  }),
  
  
});
