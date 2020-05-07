const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://bluebrain:27017';

// Database Name
const dbName = 'phunter';

//Collection names
const profilesCollection = "userData";
const modelsCollection = "tfModels";

// Create a new MongoClient
let dbConnection;

const getDbConnection = async () => {
    if (dbConnection === undefined) {
        return new Promise(async resolve => {
            const client = await MongoClient.connect(url,
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
            dbConnection = await client.db(dbName);
            resolve(dbConnection);
        })
    }
    return dbConnection;
}

const storeUserData = async (userData) => {
  const storage = await getProfilesStorage();
  const existingRecords = await storage.countDocuments({user: userData.user});
  if (existingRecords > 0) {
    console.error(`Found existing record for ${userData.user}. Skipping insertion!`);
    return new Promise(resolve => resolve());
  }
  const insertResult = await storage.insertOne(userData);
  console.info(`User ${userData.user} insertion result: ${insertResult.result.ok}`);
}

const setUserPrettyFlag = async (userId, pretty) => {
  const storage = await getProfilesStorage();
  const updateResult = await storage.updateOne({user: userId}, {$set: {pretty: pretty, processed: true}});
  console.info(`User ${userId} pretty flag ${pretty} update result: ${updateResult.result.ok}`);
}

const setAllProcessedByPretty = async (pretty) => {
  const storage = await getProfilesStorage();
  const updateResult = await storage.updateMany({pretty: pretty, processed: false}, {$set: {processed: true}});
  console.info(`Mark processed for pretty flag ${pretty} result: ${updateResult.result.ok}`);
}

const getTrainDataPerClass = async () => {
  const storage = await getProfilesStorage();
  return storage.aggregate([{$group: {_id: "$pretty", facesCount: {$sum: {$size: "$faces"}}}}]).toArray();
}

const getUnverifiedResults = async (pretty, pageSize, offset) => {
  const storage = await getProfilesStorage();
  //TODO: improve performance with (see https://stackoverflow.com/a/7230040)
  return storage
    .find({pretty: pretty, processed: false}, {_id: 0, faces: 0, pretty: 0, processed: 0})
    .skip(offset)
    .limit(pageSize)
    .toArray();
}

const countUnverifiedResults = async (pretty) => {
  const storage = await getProfilesStorage();
  return storage.countDocuments({pretty: pretty, processed: false});
}

const getVerifiedResults = async (pretty) => {
  const storage = await getProfilesStorage();
  return storage.find({pretty: pretty, processed: true}, {_id: 0, faces: 1}).toArray();
}

const getStoredModels = async () => {
  const storage = await getModelsStorage();
  return storage.find().toArray();
}

const storeTrainedModel = async (modelData) => {
  const storage = await getModelsStorage();
  const insertResult = await storage.insertOne(modelData);
  console.info(`Model ${modelData.name} insertion result: ${insertResult.result.ok}`);
}

const getProfilesStorage = async () => {
  const connection = await getDbConnection();
  return connection.collection(profilesCollection);
}

const getModelsStorage = async () => {
  const connection = await getDbConnection();
  return connection.collection(modelsCollection);
}

module.exports = {
  storeUserData,
  setUserPrettyFlag,
  setAllProcessedByPretty,
  storeTrainedModel,
  getUnverifiedResults,
  getVerifiedResults,
  getStoredModels,
  getTrainDataPerClass,
  countUnverifiedResults
};