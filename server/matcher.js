const api = require("./api/tinder");
const utils = require("./utils/utils");
const faceApi = require("./recognition/faceapi");
const fileUtils = require("./utils/fileutils");
const repository = require("./api/repository");
const imageUtils = require("./utils/imageutils");
const seedrandom = require("seedrandom");

const SEED_WORD = "fobonaccigirls";
const classLabels = ['pretty', 'notPretty'];

const processFeed = async (config, token) => {
    api.setToken(token);
    const maxDistance = config.maxDistance;
    const maxResults = config.maxResults;
    const results = await fetchProfiles();
    const feedProfiles = [];
    if (results !== undefined) {
        console.info(`${new Date().toLocaleString()} Fetched feed with ${results.length} results`);
        const limitedResults = utils.limitResults(results, maxResults);

        await fileUtils.cleanTempData();
        const iterationResults = await iterateResults(limitedResults, maxDistance);
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

const fetchProfiles = async () => {
    const response = await api.getFeed();
    const json = await response.json();
    return json.data.results;
};

const iterateResults = async (results, maxDistance) => {
    const userIterationPromises = [];
    for (let userObject of results) {
        const userProcessPromise = new Promise(async resolve => {
            const user = userObject.user;
            const userId = user._id;
            const distance = userObject.distance_mi;
            await downloadPhotos(user);
            const extractedFaces = await extractFaces(userId);
            if (extractedFaces.facesCount > 0 && distance < maxDistance) {
                const userProcessResult = {userId: userId, userName: user.name, faces: extractedFaces.faces};
                resolve(userProcessResult);
            } else {
                //If no faces for a given profile, we don't want to see it again
                const reason = `${extractedFaces.facesCount} faces; distance ${distance}`;
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
    const photosFolder = fileUtils.getUserPhotosFolder(userId);
    const photoFiles = fileUtils.getUserPhotos(userId);
    console.info(`Detecting faces for ${photosFolder}`);
    const recognitionResult = await faceApi.recognizeFaces(photosFolder, photoFiles)
        .catch((error) => console.log(`Failed to extract face ${error}`));
    let facesCount = 0;
    const faceImages = [];
    try {
        for (let filePromise of recognitionResult) {
            const faceResult = await filePromise;
            if (faceResult.faceFound) {
                facesCount++;
                faceImages.push({face: faceResult.faceImage, file: faceResult.imageFile});
            }
        }
    } catch (e) {
        console.error(`No faces detected for ${userId}`);
    }
    return {facesCount: facesCount, faces: faceImages};
};

const categorizeUser = async (profileResults, user, config, token) => {
    const minPretty = config.minPretty;
    const superPretty = config.superPretty;
    let prettySum = 0;
    let photosCount = 0;
    let finalPrediction = 0;
    let maxPrediction = 0;
    let userPhoto;
    const userFaces = [];
    api.setToken(token);
    for (let result of profileResults) {
        photosCount++;

        const faceBase64 = result.face;
        const photoResult = result.prediction;
        const prettyProbability = photoResult[0].probability;

        userFaces.push(faceBase64);
        if (prettyProbability > maxPrediction) {
            maxPrediction = prettyProbability;
            userPhoto = result.file;
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
        await imageUtils.cropProfileImage(user, userPhoto);
        const profilePhoto = imageUtils.getPhotoBase64(userPhoto, user);
        await storeProcessedUser(user, profilePhoto, userFaces, finalPrediction, minPretty);
    }
    return finalPrediction;
};

const storeProcessedUser = async (userId, userPhoto, userFaces, userScore, minPretty) => {
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

const getUnverifiedProfiles = async (prettyFlag, pageSize, offset) => {
    const unverifiedCount = await repository.countUnverifiedResults(prettyFlag);
    const pendingPrettyCount = await repository.countUnverifiedResults(true);
    const pendingNotPrettyCount = await repository.countUnverifiedResults(false);
    const storedResults = await repository.getUnverifiedResults(prettyFlag, pageSize, offset);
    return {
        count: unverifiedCount,
        pendingPretty: pendingPrettyCount,
        pendingNotPretty: pendingNotPrettyCount,
        list: storedResults
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

const getTrainingData = async (dataSetSize) => {
    const classModels = await repository.getVerifiedResults();
    let classASamples = [];
    let classBSamples = [];
    let result = await classModels.next()
    while (!!result) {
        if (result._id === true) {
            classASamples.push(result.faceSet);
        } else if (result._id === false) {
            classBSamples.push(result.faceSet);
        }
        result = await classModels.next()
    }

    const dataSets = {pretty: classASamples, notPretty: classBSamples};
    return shuffleAndLimitDataSize(dataSets, dataSetSize);
}

const shuffleAndLimitDataSize = (dataSets, dataSetSize) => {
    const maxTrainData = Math.max(dataSets.pretty.length, dataSets.notPretty.length);
    const minTrainData = Math.min(dataSets.pretty.length, dataSets.notPretty.length);

    let imagePerClass = Math.ceil(maxTrainData / classLabels.length);
    if (!!dataSetSize && maxTrainData > dataSetSize) {
        imagePerClass = dataSetSize;
    }

    if (imagePerClass > minTrainData) {
        imagePerClass = minTrainData;
    }

    console.info(`train size: ${imagePerClass * classLabels.length}`);

    return createDataSets(dataSets, imagePerClass);
}

const createDataSets = (dataSets, imagePerClass) => {
    // fill in an array with unique numbers
    let trainAndValidationIndices = [];
    for (let i = 0; i < imagePerClass; ++i) {
        trainAndValidationIndices[i] = i;
    }
    trainAndValidationIndices = fisherYates(trainAndValidationIndices); // shuffle

    const trainAndValidationImages = [];

    for (const trainClass of classLabels) {
        const load = [];
        const classFaces = dataSets[trainClass];
        for (const i of trainAndValidationIndices) {
            load.push(classFaces[i]);
        }
        trainAndValidationImages.push(load);
    }

    return trainAndValidationImages;
}

const fisherYates = (array) => {
    const seed = seedrandom(SEED_WORD);
    const length = array.length;
    const shuffled = array.slice(0);
    for (let i = length - 1; i > 0; i -= 1) {
        let randomIndex;
        if (seed) {
            randomIndex = Math.floor(seed() * (i + 1));
        } else {
            randomIndex = Math.floor(Math.random() * (i + 1));
        }
        [shuffled[i], shuffled[randomIndex]] = [
            shuffled[randomIndex],
            shuffled[i]
        ];
    }
    return shuffled;
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