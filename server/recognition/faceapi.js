require("@tensorflow/tfjs-node");
const faceApi = require("face-api.js");
const canvas = require("canvas");
const fs = require("fs");
const imageUtils = require("../utils/imageutils");

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
        try {
            let faceFound = false;
            let croppedFace;
            const photo = await canvas.loadImage(`${folder}/${file}`);
            const faceDescriptors = await faceApi.detectSingleFace(photo);
            if (faceDescriptors !== undefined) {
                const faceScore = faceDescriptors._score;
                const faceBox = faceDescriptors._box;
                if (faceScore > minFaceScore && isMinFaceSize(faceBox)) {
                    croppedFace = await imageUtils.cropFaceImage(folder, file, faceBox)
                        .catch((error) => console.error(`Face was not cropped ${error}`));
                    if (!!croppedFace) {
                        faceFound = true;
                    }
                }
            }
            resolve({faceFound: faceFound, faceImage: croppedFace, imageFile: file});
        } catch (e) {
            console.error(`Skipping ${folder}/${file} due to recognition error: ${e}`);
            reject();
        }
    });
};

const isMinFaceSize = (faceBox) => {
    return faceBox._width >= minFaceSize || faceBox._height >= minFaceSize;
};

module.exports = {loadModels, recognizeFaces};