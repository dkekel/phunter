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
    clipper.image(sourcePath, function () {
      this.crop(context._x, context._y, context._width, context._height)
        .resize(null, context._height > FACE_IMAGE_SIZE ? FACE_IMAGE_SIZE : context._height)
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

const cropProfileImage = (folder, file) => {
  const photoPath = `${folder}/${file}`;
  return new Promise(function (resolve, reject) {
    clipper.image(sourcePath, function () {
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