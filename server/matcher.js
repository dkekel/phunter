const api = require("./api/tinder");
const utils = require("./utils/utils");
const faceApi = require("./recognition/faceapi");
const fs = require("fs");
const fileUtils = require("./utils/fileutils");

const photosPath = 'server/static/photos';
const minPretty = 0.4;
const superPretty = 0.8;
const maxResults = 10;

const matcher = async () => {
    let results = await fetchProfiles();
    while (results !== undefined && results.length > 0) {
        console.info(`Fetched feed with ${results.length} results`);
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

const processFeed = async (token) => {
    api.setToken(token);
    const results = await fetchProfiles();
    console.info(`Fetched feed with ${results.length} results`);
    const limitedResults = limitResults(results);
    const userList = await iterateResults(limitedResults);
    return userList;
};

const limitResults = (results) => {
    if (results.length > maxResults) {
        return results.slice(0, maxResults);
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
    console.info(`Downloaded ${photos.length} photos for user ${userId}`);
};

const extractFaces = async (userId) => {
    const userPhotos = `${photosPath}/${userId}`;
    return await faceApi.recognizeFaces(userPhotos);
};

const categorizeUser = async (prediction, user, token) => {
    let prettySum = 0;
    let photosCount = 0;
    api.setToken(token);
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
        if (finalPrediction >= minPretty) {
            console.info(`Final prediction for ${user}: ${finalPrediction}`);
            const superLike = finalPrediction >= superPretty;
            await api.likeProfile(user, superLike);
        } else {
            await api.rejectProfile(user);
        }
    }
};

module.exports = {processFeed, getStoredFeed, categorizeUser};