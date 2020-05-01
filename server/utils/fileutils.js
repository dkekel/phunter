const fs = require("fs");
const rimraf = require("rimraf");

const photosPath = "server/static/photos";

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
}

module.exports = {getImageURLs, writeBase64Image, createFolderIfMissing, removeFolder};