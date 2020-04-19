require("@tensorflow/tfjs-node");
const faceapi = require("face-api.js");
const canvas = require("canvas");
const gm = require("gm");
const fs = require("fs");
const fileUtils = require("../utils/fileutils");

const {Canvas, Image, ImageData} = canvas;
faceapi.env.monkeyPatch({Canvas, Image, ImageData});

const MODEL_URL = `${__dirname}/facemodel`;

const recognizeFaces = async (folder) => {
    await loadModels();
    const dirScan = await fs.readdirSync(folder);
    let facesCount = 0;
    for (let file of dirScan) {
        let filePath = `${folder}/${file}`;
        if (!fs.lstatSync(filePath).isDirectory()) {
            const faceFound = await processFile(folder, file);
            if (faceFound) {
                facesCount++;
            }
        }
    }
    return facesCount;
};

const loadModels = async () => {
    try {
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
    } catch (e) {
        console.error(e);
    }
};

const processFile = async (folder, file) => {
    let faceFound = false;
    try {
        const photo = await canvas.loadImage(`${folder}/${file}`);
        const faceDescriptors = await faceApi.detectSingleFace(photo);
        if (faceDescriptors !== undefined) {
            const faceScore = faceDescriptors._score;
            if (faceScore > 0.7) {
                await cropImage(folder, file, faceDescriptors._box)
                    .catch(() => console.error("Face was not cropped"));
                faceFound = true;
            }
        }
    } catch (e) {
        console.error(`Skipping ${folder}/${file} due to recognition error: ${e}`);
    }
    return faceFound;
};

const cropImage = async (folder, file, context) => {
    const sourcePath = `${folder}/${file}`;
    const destinationPath = `${folder}/faces/${file}`;
    await createFolderIfMissing(folder, "faces");
    return new Promise(function (resolve, reject) {
        gm(sourcePath)
            .crop(context._width, context._height, context._x, context._y)
            .write(destinationPath, (error) => {
                if (error) {
                    console.log(`Failed to crop ${sourcePath}. Reason: ${error}`);
                    reject(error);
                } else {
                    resolve();
                }
            });
    });
};

const createFolderIfMissing = async (path, newFolder) => {
    const newFolderPath = `${path}/${newFolder}`;
    if (!fs.existsSync(newFolderPath)) {
        fs.mkdirSync(newFolderPath);
    }
};

module.exports = {recognizeFaces};