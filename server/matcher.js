const api = require("./api/tinder");
const utils = require("./utils/utils");
const faceApi = require("./recognition/faceapi");
const fs = require("fs");
const fileUtils = require("./utils/fileutils");

const photosPath = 'server/static/photos';
const maxDistance = 300;
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
    if (results !== undefined) {
        console.info(`${new Date().toLocaleString()} Fetched feed with ${results.length} results`);
        const limitedResults = limitResults(results);
        await cleanTempData();
        return await iterateResults(limitedResults);
    }
    return [];
};

const cleanTempData = async () => {
    const tempFolders = await fs.readdirSync(photosPath);
    for (let folder of tempFolders) {
        if (folder !== 'liked' && folder !== 'pretty' && folder !== 'notpretty') {
            await fileUtils.removeFolder(folder);
        }
    }
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
        const user = userObject.user;
        const userId = user._id;
        const city = user.city !== undefined ? user.city.name : undefined;
        const distance = userObject.distance_mi;
        await parsePhotos(user);
        const facesCount = await extractFaces(userId);
        if (facesCount > 0 && distance < maxDistance) {
            userList.push({userId: userId, userName: user.name, city: city});
        } else {
            //If no faces for a given profile, we don't want to see it again
            const reason = facesCount === 0 ? `profile has ${facesCount} faces` :
                distance < maxDistance ? `profile locations is ${distance}` : 'unknown';
            await api.rejectProfile(userId, reason);
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
    const photosFolder = `${photosPath}/${userId}`;
    const photoFiles = await fs.readdirSync(photosFolder);
    console.info(`Detecting faces for ${photosFolder}`);
    const recognitionResult = await faceApi.recognizeFaces(photosFolder, photoFiles)
        .catch((error) => console.log(`Failed to extract face ${error}`));
    let facesCount = 0;
    try {
        for (let filePromise of recognitionResult) {
            const faceFound = await filePromise;
            if (faceFound) {
                facesCount++;
            }
        }
    } catch (e) {
        console.error(`No faces detected for ${userId}`);
    }
    return facesCount;
};

const categorizeUser = async (prediction, user, token) => {
    let prettySum = 0;
    let photosCount = 0;
    let finalPrediction = 0;
    let maxPrettyScore = 0;
    let prettyPhotoId;
    api.setToken(token);
    for (let key in prediction) {
        photosCount++;
        const photoResult = prediction[key];
        const prettyProbability = photoResult[0].probability;
        if (prettyProbability >= minPretty) {
            if (prettyProbability > maxPrettyScore) {
                prettyPhotoId = key;
                maxPrettyScore = prettyProbability;
            }
            await fileUtils.moveFile(key, user, "pretty");
            prettySum += prettyProbability;
        } else {
            await fileUtils.moveFile(key, user, "notpretty");
        }
    }
    if (photosCount > 0) {
        //Round up to 2 decimal places
        finalPrediction = Math.ceil(prettySum / photosCount * 100) / 100;
        if (finalPrediction >= minPretty) {
            const superLike = finalPrediction >= superPretty;
            await fileUtils.moveSelectedPhotos(user, prettyPhotoId, "liked");
            await api.likeProfile(user, superLike);
        } else {
            const reason = `final prediction ${finalPrediction}`;
            await api.rejectProfile(user, reason);
        }
    }
    return finalPrediction;
};

const loadFaceModels = async () => {
    await faceApi.loadModels();
};

module.exports = {loadFaceModels, processFeed, getStoredFeed, categorizeUser};