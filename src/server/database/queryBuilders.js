import { ObjectID } from 'mongodb';

import log from '../../utils/logger';
import { capitalizeFirstChar } from '../../utils/textUtils';
import definitions from '../../models/definitions';

/* Builders return a Promise that resolves data, they dont handle errors */

let builders = {
  
  // Reads all documents for a given collection
  readAll: (db, params) => db.collection(params.collection).find().toArray().then(normalize),
  
};

// Defaults can be overwritten
export default Object.assign({}, createDefaultCRUDBuilders(), builders);

// Default CRUD operations for models
function createDefaultCRUDBuilders() {
  
    const CRUDbuilders = {};
    
    for (let model in definitions) {
      const { name, pluralName } = definitions[model];
      const suffix = capitalizeFirstChar(name);
      const c = db => db.collection(pluralName);
      
      CRUDbuilders['read' + suffix] = (db, { id }) => c(db).findOne({ _id: ObjectID(id) });
      CRUDbuilders['create' + suffix] = (db, params) => c(db).insertOne(params).then(() => params); // then not here
      CRUDbuilders['update' + suffix] = (db, params) => {
        let updatedData = Object.assign({}, params);
        delete updatedData.id;
        
        return c(db).updateOne({ _id: ObjectID(params.id)}, { $set: updatedData });
      };
      CRUDbuilders['delete' + suffix] = (db, { id }) => c(db).deleteOne({ _id: ObjectID(id) });
    }
    
    // Can be overwritten
    return CRUDbuilders;
}

function normalize(array) {
  const normalized = {};
  array.forEach(doc => normalized[doc._id] = doc);
  
  return normalized;
}