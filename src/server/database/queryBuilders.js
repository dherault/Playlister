import { ObjectID } from 'mongodb';

import log from '../../shared/utils/logger';
import { capitalizeFirstChar } from '../../shared/utils/textUtils';
import definitions from '../../shared/models/definitions';

// Field filtering on/off
const noDisclosure = { fields: { createdAt: 0, updatedAt: 0, creationIp: 0, passwordHash: 0 } };
const noDisclosureLogin = { fields: { createdAt: 0, updatedAt: 0, creationIp: 0 } };

/* Builders return a Promise that resolves data, they dont handle errors */
let builders = {
  
  // Drops collections
  drop: db => db.dropDatabase(),
  
  // Reads all documents for a given collection
  readAll: (db, params) => db.collection(params.collection).find({}, noDisclosure).toArray().then(normalize),
  
  login: (db, { email }) => db.collection('users').findOne({ email }, noDisclosureLogin),
  logout: () => Promise.resolve(),
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
      
      CRUDbuilders['read' + suffix] = (db, { id }) => c(db).findOne({ _id: ObjectID(id) }, noDisclosure);
      CRUDbuilders['create' + suffix] = (db, params) => c(db).insertOne(params).then(() => params); // then not here
      CRUDbuilders['update' + suffix] = (db, params) => {
        let updatedData = Object.assign({}, params);
        delete updatedData.id;
        
        return c(db).updateOne({ _id: ObjectID(params.id)}, { $set: updatedData }).then(r => r.result);
      };
      CRUDbuilders['delete' + suffix] = (db, { id }) => c(db).deleteOne({ _id: ObjectID(id) });
    }
    
    return CRUDbuilders;
}

function normalize(array) {
  const x = {};
  array.forEach(doc => x[doc._id] = doc);
  
  return x;
}
