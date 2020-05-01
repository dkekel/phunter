require("@tensorflow/tfjs-node");
const faceApi = require("face-api.js");
const canvas = require("canvas");
const fs = require("fs");
const Clipper = require('image-clipper');
const fileUtils = require("../utils/fileutils");

const {Canvas, Image, ImageData} = canvas;
faceApi.env.monkeyPatch({Canvas, Image, ImageData});

const MODEL_URL = `${__dirname}/facemodel`;
const minFaceSize = 150;
const minFaceScore = 0.65;

const recognizeFaces = (photoFolder, photoFiles) => {
    const dirPromises = photoFiles.map(file => {
        let filePath = `${photoFolder}/${file}`;
        if (!fs.lstatSync(filePath).isDirectory()) {
            return processFile(photoFolder, file);
        }
        return new Promise(resolve => resolve());
    });
    return Promise.all(dirPromises);
};

const loadModels = async () => {
    try {
        await faceApi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
        await faceApi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
        await faceApi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
    } catch (e) {
        console.error(e);
    }
};

const processFile = (folder, file) => {
    return new Promise(async (resolve, reject) => {
        let faceFound = false;
        try {
            const photo = await canvas.loadImage(`${folder}/${file}`);
            const faceDescriptors = await faceApi.detectSingleFace(photo);
            if (faceDescriptors !== undefined) {
                const faceScore = faceDescriptors._score;
                const faceBox = faceDescriptors._box;
                if (faceScore > minFaceScore && isMinFaceSize(faceBox)) {
                    await cropImage(folder, file, faceBox)
                        .catch((error) => console.error(`Face was not cropped ${error}`));
                    faceFound = true;
                }
            }
            resolve(faceFound);
        } catch (e) {
            console.error(`Skipping ${folder}/${file} due to recognition error: ${e}`);
            reject();
        }
    });
};

const isMinFaceSize = (faceBox) => {
    return faceBox._width >= minFaceSize || faceBox._height >= minFaceSize;
};

const cropImage = async (folder, file, context) => {
    const sourcePath = `${folder}/${file}`;
    const destinationPath = `${folder}/faces/${file}`;
    await fileUtils.createFolderIfMissing(folder, "faces");
    const clipper = Clipper({canvas: canvas});
    return new Promise(function (resolve, reject) {
        clipper.image(sourcePath, function () {
            this.crop(context._x, context._y, context._width, context._height)
                .quality(90)
                .toFile(destinationPath, (error) => {
                    if (error) {
                        console.error(`Failed to crop ${sourcePath}. Reason: ${error}`);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
        });
    });
};

module.exports = {loadModels, recognizeFaces};