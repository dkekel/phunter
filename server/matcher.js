const api = require("./api/tinder");
const utils = require("./utils/utils");
const faceApi = require("./recognition/faceapi");
const fs = require("fs");
const fileUtils = require("./utils/fileutils");
const repository = require("./api/repository");

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
    const feedProfiles = [];
    if (results !== undefined) {
        console.info(`${new Date().toLocaleString()} Fetched feed with ${results.length} results`);
        const limitedResults = utils.limitResults(results, maxResults);

        await cleanTempData();
        const iterationResults = await iterateResults(limitedResults);
        try {
            for (let userResult of iterationResults) {
                //If no faces were identified, the promise returns undefined
                if (userResult !== undefined) {
                    feedProfiles.push(userResult);
                }
            }
        } catch (e) {
            console.error(`Failed to process feed results. Reason: ${e}`);
        }
    }
    return feedProfiles;
};

const cleanTempData = async () => {
    const tempFolders = await fs.readdirSync(photosPath);
    for (let folder of tempFolders) {
        if (folder !== 'liked' && folder !== 'pretty' && folder !== 'notpretty') {
            await fileUtils.removeFolder(folder)
                .catch((error) => console.error(`Failed to remove ${folder}. Reason: ${error}`));
        }
    }
};

const fetchProfiles = async () => {
    const response = await api.getFeed();
    const json = await response.json();
    return json.data.results;
};

const iterateResults = async (results) => {
    const userIterationPromises = [];
    for (let userObject of results) {
        const userProcessPromise = new Promise(async resolve => {
            const user = userObject.user;
            const userId = user._id;
            const distance = userObject.distance_mi;
            await downloadPhotos(user);
            const facesCount = await extractFaces(userId);
            if (facesCount > 0 && distance < maxDistance) {
                const userProcessResult = {userId: userId, userName: user.name};
                resolve(userProcessResult);
            } else {
                //If no faces for a given profile, we don't want to see it again
                const reason = `${facesCount} faces; distance ${distance}`;
                await api.rejectProfile(userId, reason);
                resolve(undefined);
            }
        });
        userIterationPromises.push(userProcessPromise);
    }
    return Promise.all(userIterationPromises);
};

const downloadPhotos = async (user) => {
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
    let maxPrediction = 0;
    let userPhoto;
    const userFaces = [];
    api.setToken(token);
    for (let key in prediction) {
        photosCount++;
        userPhoto = key;

        const faceBase64 = getFaceBase64(key, user);
        const photoResult = prediction[key];
        const prettyProbability = photoResult[0].probability;

        userFaces.push(faceBase64);
        if (prettyProbability > maxPrediction) {
            maxPrediction = prettyProbability;
            userPhoto = key;
        }
        if (prettyProbability >= minPretty) {
            prettySum += prettyProbability;
        }
    }
    if (photosCount > 0) {
        //Round up to 2 decimal places
        finalPrediction = Math.ceil(prettySum / photosCount * 100) / 100;
        if (finalPrediction >= minPretty) {
            const superLike = finalPrediction >= superPretty;
            await api.likeProfile(user, superLike);
        } else {
            const reason = `final prediction ${finalPrediction}`;
            await api.rejectProfile(user, reason);
        }
        const profilePhoto = getPhotoBase64(userPhoto, user);
        await storeProcessedUser(user, profilePhoto, userFaces, finalPrediction);
    }
    return finalPrediction;
};

const getPhotoBase64 = (photoId, userId) => {
    const bitmap = fs.readFileSync(`${photosPath}/${userId}/${photoId}`);
    return Buffer.from(bitmap).toString('base64');
}

const getFaceBase64 = (photoId, userId) => {
    const bitmap = fs.readFileSync(`${photosPath}/${userId}/faces/${photoId}`);
    return Buffer.from(bitmap).toString('base64');
}

const storeProcessedUser = async (userId, userPhoto, userFaces, userScore) => {
    const userData = {
        user: userId,
        photo: userPhoto,
        faces: userFaces,
        score: userScore,
        pretty: userScore > minPretty,
        processed: false
    };
    await repository.storeUserData(userData);
}

const getTrainDataSizePerClass = async () => {
    const data = await repository.getTrainDataPerClass();
    const result = [];
    for (let classType of data) {
        const classResult = {pretty: classType._id, dataSize: classType.facesCount};
        result.push(classResult);
    }
    return result;
}

const loadFaceModels = async () => {
    await faceApi.loadModels();
};

const getUnverifiedProfiles = async (prettyFlag, offset) => {
    const unverifiedCount = await repository.countUnverifiedResults(prettyFlag);
    const pendingPrettyCount = await repository.countUnverifiedResults(true);
    const pendingNotPrettyCount = await repository.countUnverifiedResults(false);
    const storedResults = await repository.getUnverifiedResults(prettyFlag, offset, maxResults);
    const unverifiedProfiles = [];
    for (let result of storedResults) {
        const profile = {user: result.user, img: result.photo, score: result.score};
        unverifiedProfiles.push(profile);
    }
    return {
        count: unverifiedCount,
        pendingPretty: pendingPrettyCount,
        pendingNotPretty: pendingNotPrettyCount,
        list: unverifiedProfiles
    };
}

const updateUserProfileSelection = async (userData, apiToken) => {
    const userId = userData.userId;
    const pretty = userData.pretty;
    api.setToken(apiToken);
    if (pretty) {
        await api.likeProfile(userId, false);
    }
    await repository.setUserPrettyFlag(userId, pretty);
    const pendingPretty = await repository.countUnverifiedResults(true);
    const pendingNotPretty = await repository.countUnverifiedResults(false);
    return {pendingPretty: pendingPretty, pendingNotPretty: pendingNotPretty};
};

const markAllProcessed = async (prettyFlag) => {
    await repository.setAllProcessedByPretty(prettyFlag);
    const pendingPretty = await repository.countUnverifiedResults(true);
    const pendingNotPretty = await repository.countUnverifiedResults(false);
    return {pendingPretty: pendingPretty, pendingNotPretty: pendingNotPretty};
};

const extractReClassifiedProfiles = async (type) => {
    const pretty = type === 'pretty';
    const verifiedResults = await repository.getVerifiedResults(pretty);
    for (let profile of verifiedResults) {
        let index = 0;
       const userId = profile.user;
       for (let facePhoto of profile.faces) {
           const imageName = `${userId}_${index}.jpeg`;
           fileUtils.writeBase64Image(facePhoto, type, imageName);
           index++;
       }
    }
};

const getTrainingData = async () => {
    const classAModel = await repository.getVerifiedResults(true);
    let classASamples = []
    for (let result of classAModel) {
        classASamples = classASamples.concat(result.faces);
    }
    const classBModel = await repository.getVerifiedResults(false);
    let classBSamples = []
    for (let result of classBModel) {
        classBSamples = classBSamples.concat(result.faces);
    }
    return {pretty: classASamples, notPretty: classBSamples};
}

const getStoredModels = async () => {
    return repository.getStoredModels();
}

const storeTrainedModelMetadata = async (modelMeta) => {
    const metadata = {...modelMeta, default: false};
    await repository.storeTrainedModel(metadata)
}

module.exports = {
    loadFaceModels,
    processFeed,
    getStoredFeed,
    getUnverifiedProfiles,
    getTrainingData,
    getStoredModels,
    getTrainDataSizePerClass,
    extractReClassifiedProfiles,
    categorizeUser,
    updateUserProfileSelection,
    storeTrainedModelMetadata,
    markAllProcessed
};