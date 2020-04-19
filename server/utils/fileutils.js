const fs = require("fs");
const rimraf = require("rimraf");

const photosPath = "server/static/photos";

const moveFile = async (fileName, userId, destinationFolder) => {
    const userPhotoPath = `${photosPath}/${userId}`;
    await createFolderIfMissing(photosPath, destinationFolder);
    await fs.renameSync(`${userPhotoPath}/faces/${fileName}`, `${photosPath}/${destinationFolder}/${fileName}`);
};

const moveSelectedPhotos = async (userId, destinationFolder) => {
    const userPhotoPath = `${photosPath}/${userId}`;
    await createFolderIfMissing(photosPath, destinationFolder);
    const dirScan = await fs.readdirSync(userPhotoPath);
    for (let file of dirScan) {
        if (!fs.lstatSync(`${userPhotoPath}/${file}`).isDirectory()) {
            await fs.renameSync(`${userPhotoPath}/${file}`, `${photosPath}/${destinationFolder}/${file}`);
        }
    }
};

const removeUserFolder = async (userId) => {
    await rimraf.sync(`${photosPath}/${userId}`)
};

const createFolderIfMissing = async (path, newFolder) => {
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

module.exports = {getImageURLs, moveFile, moveSelectedPhotos, removeUserFolder};