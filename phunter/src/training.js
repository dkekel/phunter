import * as seedrandom from 'seedrandom';

const SEED_WORD = "fobonaccigirls";
const seed = seedrandom(SEED_WORD);

const IMAGE_SIZE = 224;

const getTrainModel = async (infoCallback) => {
  return new Promise(resolve => {
    const request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:3000/trainModel', true);
    request.onload = async () => {
      const model = JSON.parse(request.response);
      resolve(model);
    };

    // Send request
    infoCallback("Loading train model...");
    request.send();
  });
};

const trainModel = async (trainData, trainingConfig, infoCallback, epochCallback) => {
  const dataSetSize = trainingConfig.dataSetSize;

  // 1. Setup dataset parameters
  const classLabels = ['pretty', 'notPretty'];
  trainingConfig.classLabels = classLabels;

  const maxTrainData = Math.max(trainData[classLabels[0]].length, trainData[classLabels[1]].length);
  const minTrainData = Math.min(trainData[classLabels[0]].length, trainData[classLabels[1]].length);

  let NUM_IMAGE_PER_CLASS = Math.ceil(maxTrainData / classLabels.length);
  if (!!dataSetSize && maxTrainData > dataSetSize) {
    NUM_IMAGE_PER_CLASS = dataSetSize;
  }

  if (NUM_IMAGE_PER_CLASS > minTrainData) {
    NUM_IMAGE_PER_CLASS = minTrainData;
  }

  console.info(`train size: ${NUM_IMAGE_PER_CLASS * classLabels.length}`);

  // 2. Create our datasets once
  const datasets = await createDatasets(
    trainData,
    classLabels,
    NUM_IMAGE_PER_CLASS
  );
  const trainAndValidationImages = datasets.trainAndValidationImages;
  return startBackgroundTraining(trainAndValidationImages, trainingConfig, infoCallback, epochCallback);
}

const createDatasets = async (trainData, classes, trainSize) => {
  // fill in an array with unique numbers
  let trainAndValidationIndices = [];
  for (let i = 0; i < trainSize; ++i) {
    trainAndValidationIndices[i] = i;
  }
  trainAndValidationIndices = fisherYates(trainAndValidationIndices, seed); // shuffle

  const trainAndValidationImages = [];

  for (const trainClass of classes) {
    let load = [];
    const classFaces = trainData[trainClass];
    for (const i of trainAndValidationIndices) {
      const imageBuffer = classFaces[i];
      load.push({data: new Uint8Array(imageBuffer.data), width: IMAGE_SIZE, height: IMAGE_SIZE});
    }
    trainAndValidationImages.push(await Promise.all(load));
  }

  return {trainAndValidationImages};
}

const fisherYates = (array, seed) => {
  const length = array.length;
  const shuffled = array.slice(0);
  for (let i = length - 1; i > 0; i -= 1) {
    let randomIndex;
    if (seed) {
      randomIndex = Math.floor(seed() * (i + 1));
    } else {
      randomIndex = Math.floor(Math.random() * (i + 1));
    }
    [shuffled[i], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[i]
    ];
  }
  return shuffled;
}

const startBackgroundTraining = (trainingDataset, trainingConfig, infoCallback, epochCallback) => {
  return new Promise(resolve => {
    const blob = new Blob([`importScripts('http://localhost:3000/train');`],
      { "type": 'application/javascript' });
    const url = window.URL || window.webkitURL;
    const blobUrl = url.createObjectURL(blob);
    const trainWorker = new Worker(blobUrl);
    trainWorker.postMessage({trainingDataset: trainingDataset, trainingConfig: trainingConfig});
    trainWorker.onmessage = (message) => {
      const data = message.data;
      const status = data.status;
      switch (status) {
        case "PREPARING":
          infoCallback(data.info);
          break;
        case "TRAINING":
          epochCallback(data.info);
          break;
        case "FINISHED":
          resolve(data.result);
          break;
        default:
          console.error("Undefined Web Worker status");
      }
    }
  });
}

export {getTrainModel, trainModel}