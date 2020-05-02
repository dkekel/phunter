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
  const updateResult = await storage.updateOne({user: userId}, {$set: {pretty: pretty, processed: true}});
  console.info(`User ${userId} pretty flag ${pretty} update result: ${updateResult.result.ok}`);
}

const getUnverifiedResults = async (pretty, offset, maxResults) => {
  const storage = await getStorage();
  return storage.find({pretty: pretty, processed: false}).skip(offset).limit(maxResults).toArray();
}

const countUnverifiedResults = async (pretty) => {
  const storage = await getStorage();
  return storage.countDocuments({pretty: pretty, processed: false});
}

const getVerifiedResults = async (pretty) => {
  const storage = await getStorage();
  return storage.find({pretty: pretty, processed: true}).toArray();
}

const getStorage = async () => {
  const connection = await getDbConnection();
  return connection.collection(collectionName);
}

module.exports = {
  storeUserData,
  setUserPrettyFlag,
  getUnverifiedResults,
  getVerifiedResults,
  countUnverifiedResults
};