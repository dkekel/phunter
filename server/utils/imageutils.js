const canvas = require("canvas");
const Clipper = require('image-clipper');
const fileUtils = require("../utils/fileutils");

const clipper = Clipper({canvas: canvas});

const FACE_IMAGE_SIZE = 224;
const PROFILE_IMAGE_SIZE = 500;

const cropFaceImage = (folder, file, context) => {
  const sourcePath = `${folder}/${file}`;
  const destinationPath = `${folder}/faces/${file}`;
  fileUtils.createFolderIfMissing(folder, "faces");
  return new Promise(function (resolve, reject) {
    const cropCoordinates = calculateCropCoordinated(context);
    clipper.image(sourcePath, function () {
      this.crop(cropCoordinates.x, cropCoordinates.y, cropCoordinates.width, cropCoordinates.height)
        .resize(FACE_IMAGE_SIZE, FACE_IMAGE_SIZE)
        .quality(90)
        .toFile(destinationPath, (error) => {
          if (error) {
            console.error(`Failed to crop ${sourcePath}. Reason: ${error}`);
            reject(error);
          } else {
            const faceImage = fileUtils.getFile(destinationPath);
            resolve(faceImage.toString("base64"));
          }
        });
    });
  });
};

const calculateCropCoordinated = (context) => {
  const x = context._x;
  const y = context._y;
  const width = context._width;
  const height = context._height;

  const min = Math.min(width, height);
  const scale = FACE_IMAGE_SIZE / min;
  const scaledW = Math.ceil(width * scale);
  const scaledH = Math.ceil(height * scale);
  const dx = scaledW - FACE_IMAGE_SIZE;
  const dy = scaledH - FACE_IMAGE_SIZE;
  const xStart = x + ~~(dx / 2);
  const yStart = y + ~~(dy / 2);

  return {x: xStart / scale, y: yStart / scale, width: min, height: min};
}

const cropProfileImage = (folder, file) => {
  const photoPath = `${fileUtils.photosPath}/${folder}/${file}`;
  return new Promise(function (resolve, reject) {
    clipper.image(photoPath, function () {
      this.resize(null, PROFILE_IMAGE_SIZE)
        .quality(90)
        .toFile(photoPath, (error) => {
          if (error) {
            console.error(`Failed to resize ${photoPath}. Reason: ${error}`);
            reject(error);
          } else {
            resolve();
          }
        });
    });
  });
};

const getPhotoBase64 = (photoId, userId) => {
  const bitmap = fileUtils.getProfileImage(photoId, userId);
  return Buffer.from(bitmap).toString('base64');
}

const getFaceBase64 = (photoId, userId) => {
  const bitmap = fileUtils.getFaceImage(photoId, userId)
  return Buffer.from(bitmap).toString('base64');
}

module.exports = {cropFaceImage, cropProfileImage, getFaceBase64, getPhotoBase64};