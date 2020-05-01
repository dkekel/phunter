const fs = require("fs");
const rimraf = require("rimraf");

const photosPath = "server/static/photos";

const removeFolder = async (folder) => {
    await rimraf.sync(`${photosPath}/${folder}`)
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

module.exports = {getImageURLs, createFolderIfMissing, removeFolder};