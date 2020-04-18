const fs = require("fs");
const fetch = require("node-fetch");

const photosPath = 'server/static/photos';

const downloadFile = async (url, userId) => {
    const res = await fetch(url);
    const location = splitPhotoPath(url);
    createUserFolder(userId);
    const fileStream = fs.createWriteStream(`${photosPath}/${userId}/${location.fileName}`);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", (err) => {
            reject(err);
        });
        fileStream.on("finish", function () {
            resolve();
        });
    });
};

const sleep = (miliseconds) => {
    const currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) {
    }
};

const splitPhotoPath = (path) => {
    const pathname = new URL(path).pathname;
    const splitPath = pathname.split('/');
    const folderName = splitPath[1];
    const fileName = splitPath[2];
    return {'folderName': folderName, 'fileName': fileName};
};

const createUserFolder = (folderName) => {
    const folderPath = `${photosPath}/${folderName}`;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
};

module.exports = {downloadFile, sleep};