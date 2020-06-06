const fs = require("fs");
const rimraf = require("rimraf");

const photosPath = "server/static/photos";
const modelsPath = "server/recognition/model";
const uploadsPath = "server/uploads";

const removeFolder = async (folder) => {
    await rimraf.sync(`${photosPath}/${folder}`)
};

const getFile = (filePath) => {
    return fs.readFileSync(filePath);
}

const createFolderIfMissing = (path, newFolder) => {
    const newFolderPath = `${path}/${newFolder}`;
    if (!fs.existsSync(newFolderPath)) {
        fs.mkdirSync(newFolderPath);
    }
};

const getUserPhotosFolder = (userId) => {
    return `${photosPath}/${userId}`;
};

const getFaceImage = (photoId, userId) => {
    return fs.readFileSync(`${photosPath}/${userId}/faces/${photoId}`);
}

const getProfileImage = (photoId, userId) => {
    return fs.readFileSync(`${photosPath}/${userId}/${photoId}`);
}

const getUserPhotos = (userId) => {
    const photosFolder = getUserPhotosFolder(userId);
    return fs.readdirSync(photosFolder);
}

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

const getImageURLs = async (userId) => {
    const images = [];
    const path = `${photosPath}/${userId}/faces`;
    const dirScan = await fs.readdirSync(path);
    for (let file of dirScan) {
        if (!fs.lstatSync(`${path}/${file}`).isDirectory()) {
            images.push(file);
        }
    }
    return images;
};

const writeBase64Image = (base64Data, imageFolder, imageName) => {
    const path = `${photosPath}/${imageFolder}`;
    createFolderIfMissing(photosPath, imageFolder);
    fs.writeFileSync(`${path}/${imageName}`, base64Data, 'base64');
};

const saveTrainedModel = (uploadedFile, originalName, modelFolder) => {
    const fromFile = `${uploadsPath}/${uploadedFile}`;
    const toFile = `${modelsPath}/${modelFolder}/${originalName}`;
    createFolderIfMissing(modelsPath, modelFolder);
    moveUploadedFile(fromFile, toFile);
};

const moveUploadedFile = (fromFile, toFile) => {
    fs.renameSync(fromFile, toFile);
};

const cleanTempData = async () => {
    const tempFolders = await fs.readdirSync(photosPath);
    for (let folder of tempFolders) {
        if (folder !== 'liked' && folder !== 'pretty' && folder !== 'notpretty') {
            await removeFolder(folder)
              .catch((error) => console.error(`Failed to remove ${folder}. Reason: ${error}`));
        }
    }
};

module.exports = {getFile, getImageURLs, getStoredFeed, getUserPhotos, getUserPhotosFolder, getFaceImage, getProfileImage,
    writeBase64Image, saveTrainedModel, createFolderIfMissing, removeFolder, cleanTempData, photosPath};