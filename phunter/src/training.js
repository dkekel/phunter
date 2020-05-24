const IMAGE_SIZE = 224;

const getTrainModel = async (dataSetSize, infoCallback) => {
  return new Promise(resolve => {
    const request = new XMLHttpRequest();
    const query = `?dataSetSize=${!!dataSetSize ? dataSetSize : Number.MAX_SAFE_INTEGER}`;
    request.open('GET', `http://localhost:3000/trainModel${query}`, true);
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
  // Create our datasets once
  const datasets = await createDatasets(trainData);
  return startBackgroundTraining(datasets, trainingConfig, infoCallback, epochCallback);
}

const createDatasets = async (trainData) => {
  const trainAndValidationImages = [];
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  for (const trainSamples of trainData) {
    const load = [];
    for (const imageBase64 of trainSamples) {
      load.push(createImageData(imageBase64, context));
    }
    trainAndValidationImages.push(await Promise.all(load));
  }

  return trainAndValidationImages;
}

const createImageData = (imageBase64, canvasContext) => {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      canvasContext.drawImage(image, 0, 0);
      const imageData = canvasContext.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
      resolve(imageData);
    }
    image.src = `data:image/png;base64,${imageBase64}`;
  });
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