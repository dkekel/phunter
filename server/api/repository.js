const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'phunter';

//Collection name
const collectionName = "userData";

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
  const storage = await getStorage();
  const insertResult = await storage.insertOne(userData);
  console.info(`User ${userData.user} insertion result: ${insertResult.result.ok}`);
}

const setUserPrettyFlag = async (userId, pretty) => {
  const storage = await getStorage();
  const updateResult = await storage.updateOne({user: userId}, {$set: {pretty: pretty}});
  console.info(`User ${userId} pretty flag ${pretty} update result: ${updateResult.result.ok}`);
}

const getUnverifiedResults = async (offset, maxResults) => {
  const storage = await getStorage();
  return storage.find({pretty: null}).skip(offset).limit(maxResults).toArray();
}

const countUnverifiedResults = async () => {
  const storage = await getStorage();
  return storage.countDocuments({pretty: null});
}

const getVerifiedResults = async (pretty) => {
  const storage = await getStorage();
  return storage.find({pretty: pretty, processed: false, score: {"$lt": 0.4}}).toArray();
}

const markVerifiedResultProcessed = async (userId) => {
  const storage = await getStorage();
  const updateResult = await storage.updateOne({user: userId}, {$set: {processed: true}});
  console.info(`User ${userId} set processed result: ${updateResult.result.ok}`);
}

const getStorage = async () => {
  const connection = await getDbConnection();
  return connection.collection(collectionName);
}

module.exports = {
  storeUserData,
  setUserPrettyFlag,
  markVerifiedResultProcessed,
  getUnverifiedResults,
  getVerifiedResults,
  countUnverifiedResults
};