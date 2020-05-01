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
    const connection = await getDbConnection();
    const storage = await connection.collection(collectionName);
    const insertResult = await storage.insertOne(userData);
    console.info(`User ${userData.user} insertion result: ${insertResult.result.ok}`);
}

const setUserPrettyFlag = async (userId, pretty) => {
  const connection = await getDbConnection();
  const storage = await connection.collection(collectionName);
  const updateResult = await storage.updateOne({user: userId}, {$set: {pretty: pretty}});
  console.info(`User ${userId} pretty flag ${pretty} update result: ${updateResult.result.ok}`);
}

const getUnverifiedResults = async (offset, maxResults) => {
    const connection = await getDbConnection();
    const storage = await connection.collection(collectionName);
    return storage.find({pretty: null}).skip(offset).limit(maxResults).toArray();
}

module.exports = {storeUserData, setUserPrettyFlag, getUnverifiedResults};