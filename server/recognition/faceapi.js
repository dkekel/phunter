require("@tensorflow/tfjs-node");
const faceApi = require("face-api.js");
const canvas = require("canvas");
const gm = require("gm");
const fs = require("fs");

const {Canvas, Image, ImageData} = canvas;
faceApi.env.monkeyPatch({Canvas, Image, ImageData});

const MODEL_URL = `${__dirname}/facemodel`;
const minFaceSize = 150;

const recognizeFaces = async (folder) => {
    await loadModels();
    const dirScan = await fs.readdirSync(folder);
    let facesCount = 0;
    console.info(`Detecting faces for ${folder}`);
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
        await faceApi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
        await faceApi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
        await faceApi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
        await faceApi.nets.ageGenderNet.loadFromDisk(MODEL_URL);
    } catch (e) {
        console.error(e);
    }
};

const processFile = async (folder, file) => {
    let faceFound = false;
    try {
        const photo = await canvas.loadImage(`${folder}/${file}`);
        const faceDescriptors = await faceApi.detectSingleFace(photo).withAgeAndGender();
        if (faceDescriptors !== undefined) {
            const faceScore = faceDescriptors.detection.score;
            const faceBox = faceDescriptors.detection.box;
            const gender = faceDescriptors.gender;
            if (faceScore > 0.7 && gender === 'female' && isMinFaceSize(faceBox)) {
                await cropImage(folder, file, faceBox)
                    .catch(() => console.error("Face was not cropped"));
                faceFound = true;
            }
        }
    } catch (e) {
        console.error(`Skipping ${folder}/${file} due to recognition error: ${e}`);
    }
    return faceFound;
};

const isMinFaceSize= (faceBox) => {
    return faceBox._width >= minFaceSize || faceBox._height >= minFaceSize;
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
                    console.error(`Failed to crop ${sourcePath}. Reason: ${error}`);
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