const fs = require("fs");

const photosPath = "server/static/photos";

const moveFile = async (fileName, userId, destinationFolder) => {
    const userPhotoPath = `${photosPath}/${userId}`;
    await createFolderIfMissing(photosPath, destinationFolder);
    await fs.renameSync(`${userPhotoPath}/faces/${fileName}`, `${photosPath}/${destinationFolder}/${fileName}`);
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

module.exports = {getImageURLs, moveFile};