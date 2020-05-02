const fs = require("fs");
const rimraf = require("rimraf");

const photosPath = "server/static/photos";
const modelsPath = "server/recognition/model";
const uploadsPath = "server/uploads";

const removeFolder = async (folder) => {
    await rimraf.sync(`${photosPath}/${folder}`)
};

const createFolderIfMissing = (path, newFolder) => {
    const newFolderPath = `${path}/${newFolder}`;
    if (!fs.existsSync(newFolderPath)) {
        fs.mkdirSync(newFolderPath);
    }
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

module.exports = {getImageURLs, writeBase64Image, saveTrainedModel, createFolderIfMissing, removeFolder};