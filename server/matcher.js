const api = require("./api/tinder");
const utils = require("./utils/utils");
const faseApi = require("./recognition/faceapi");
const fs = require("fs");
const fileUtils = require("./utils/fileutils");

const photosPath = 'server/static/photos';
const token = '9056f910-f148-4264-8a76-6c4cc6cf07eb';
const minPretty = 0.5;
const superPretty = 0.8;

const matcher = async () => {
    let results = await fetchProfiles();
    while (results !== undefined && results.length > 0) {
        console.log(`Fetched feed with ${results.length} results`);
        await iterateResults(results);
        results = await fetchProfiles();
    }
};

const getStoredFeed = async () => {
    const userList = [];
    const dirScan = await fs.readdirSync(photosPath);
    for (let file of dirScan) {
        if (file !== "notpretty" && file !== "pretty") {
            userList.push({userId: file, userName: 'Fake'});
        }
    }
    return userList;
};

const processFeed = async () => {
    api.setToken(token);
    const results = await fetchProfiles();
    console.log(`Fetched feed with ${results.length} results`);
    const limitedResults = limitResults(results);
    const userList = await iterateResults(limitedResults);
    return userList;
};

const limitResults = (results) => {
    if (results.length > 10) {
        return results.slice(0, 10);
    }
    return results;
};

const fetchProfiles = async () => {
    const response = await api.getFeed();
    const json = await response.json();
    return json.data.results;
};

const iterateResults = async (results) => {
    const userList = [];
    for (let userObject of results) {
        let user = userObject.user;
        let userId = user._id;
        await parsePhotos(user);
        const facesCount = await extractFaces(userId);
        if (facesCount > 0) {
            userList.push({userId: userId, userName: user.name});
        }
    }
    return userList;
};

const parsePhotos = async (user) => {
    const userId = user._id;
    const photos = user.photos;
    for (let photo of photos) {
        const photoUrl = photo.url;
        await utils.downloadFile(photoUrl, userId)
            .catch(error => `Error downloading photo for user ${userId}; Reason: ${error}`);
    }
    console.log(`Downloaded ${photos.length} photos for user ${userId}`);
};

const extractFaces = async (userId) => {
    const userPhotos = `${photosPath}/${userId}`;
    return await faseApi.recognizeFaces(userPhotos);
};

const categorizeUser = async (prediction, user) => {
    let prettySum = 0;
    let photosCount = 0;
    for (let key in prediction) {
        photosCount++;
        const photoResult = prediction[key];
        const prettyProbability = photoResult[0].probability;
        if (prettyProbability >= minPretty) {
            await fileUtils.moveFile(key, user, "pretty");
            prettySum += prettyProbability;
        } else {
            await fileUtils.moveFile(key, user, "notpretty");
        }
    }
    if (photosCount > 0) {
        const finalPrediction = prettySum / photosCount;
        console.log(`Final prediction for ${user}: ${finalPrediction}`);
        if (finalPrediction >= minPretty) {
            const superLike = finalPrediction >= superPretty;
            await likeUser(user, superLike);
        } else {
            await rejectUser(user);
        }
    }
};

const likeUser = async (userId, superLike) => {
    api.setToken(token);
    await api.likeProfile(userId, superLike);
};

const rejectUser = async (userId) => {
    api.setToken(token);
    await api.rejectProfile(userId);
};


module.exports = {processFeed, getStoredFeed, categorizeUser};