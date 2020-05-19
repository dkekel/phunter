import * as seedrandom from 'seedrandom';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';

const SEED_WORD = "fobonaccigirls";
const seed = seedrandom(SEED_WORD);

const MOBILENET_VERSION = 2;
const IMAGE_SIZE = 224;

const getTrainModel = async () => {
  return new Promise(resolve => {
    const request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:3000/trainModel', true);
    request.onload = async () => {
      const model = JSON.parse(request.response);
      resolve(model);
    };

    // Send request
    console.info("Loading train model...");
    request.send();
  });
};

const trainModel = async (trainData, trainingConfig, epochCallback) => {
  const dataSetSize = trainingConfig.dataSetSize;
  const alpha = trainingConfig.alpha;
  const epochs = trainingConfig.epochs;
  const learningRate = trainingConfig.rate;
  const batchSize = trainingConfig.batch;

  // 1. Setup dataset parameters
  const classLabels = ['pretty', 'notPretty'];

  const maxTrainData = Math.max(trainData[classLabels[0]].length, trainData[classLabels[1]].length);
  const minTrainData = Math.min(trainData[classLabels[0]].length, trainData[classLabels[1]].length);

  let NUM_IMAGE_PER_CLASS = Math.ceil(maxTrainData / classLabels.length);
  if (!!dataSetSize && maxTrainData > dataSetSize) {
    NUM_IMAGE_PER_CLASS = dataSetSize;
  }

  if (NUM_IMAGE_PER_CLASS > minTrainData) {
    NUM_IMAGE_PER_CLASS = minTrainData;
  }

  console.info(`train/validation size: ${NUM_IMAGE_PER_CLASS * classLabels.length}`);

  // 2. Create our datasets once
  const datasets = await createDatasets(
    trainData,
    classLabels,
    NUM_IMAGE_PER_CLASS
  );
  const trainAndValidationImages = datasets.trainAndValidationImages;

  // NOTE: If testing time, test first model twice because it takes longer
  // to train the very first time tf.js is training

  const lineStart = "\n//====================================";
  const lineEnd = "====================================//\n\n";
  console.log(lineStart);
  // 3. Test data on the model
  const teachableMobileNetV2 = await tmImage.createTeachable(
    {tfjsVersion: tmImage.version.tfjs},
    {version: MOBILENET_VERSION, alpha: alpha}
  );


  const lastEpoch = await testModel(
    teachableMobileNetV2,
    alpha,
    classLabels,
    trainAndValidationImages,
    epochs,
    learningRate,
    batchSize,
    epochCallback
  );

  console.log(lineEnd);

  return {model: teachableMobileNetV2, lastEpoch};
}

const createDatasets = async (
  trainData,
  classes,
  trainSize
) => {
  // fill in an array with unique numbers
  let trainAndValidationIndices = [];
  for (let i = 0; i < trainSize; ++i) {
    trainAndValidationIndices[i] = i;
  }
  trainAndValidationIndices = fisherYates(trainAndValidationIndices, seed); // shuffle

  const trainAndValidationImages = [];

  console.info("Loading train images...");
  for (const trainClass of classes) {
    let load = [];
    const classFaces = trainData[trainClass];
    for (const i of trainAndValidationIndices) {
      const base64Face = classFaces[i];
      load.push(loadBase64Image(base64Face));
    }
    trainAndValidationImages.push(await Promise.all(load));
  }

  return {trainAndValidationImages};
}

const loadBase64Image = (bas64Image) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `data:image/png;base64,${bas64Image}`;
    resolve(img);
  });
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

const testModel = async (model,
                         alpha,
                         classes,
                         trainAndValidationImages,
                         epochs,
                         learningRate,
                         batchSize,
                         epochCallback) => {
  model.setLabels(classes);
  model.setSeed(SEED_WORD); // set a seed to shuffle predictably

  const logs = [];
  let time = 0;

  await tf.nextFrame().then(async () => {
    let index = 0;
    console.info("Adding examples to the training model...");
    for (const imgSet of trainAndValidationImages) {
      for (const img of imgSet) {
        const croppedImage = cropTo(img, IMAGE_SIZE);
        await model.addExample(index, croppedImage);
      }
      index++;
    }
    console.info("Examples added");
    const start = window.performance.now();
    await model.train(
      {
        denseUnits: 100,
        epochs,
        learningRate,
        batchSize
      },
      {
        onEpochBegin: async (epoch, logs) => {
        },
        onEpochEnd: async (epoch, log) => {
          epochCallback(log);
          logs.push(log);
        }
      }
    );
    const end = window.performance.now();
    time = end - start;
  });

  showMetrics(alpha, time, logs);
  return logs[logs.length - 1];
}

const cropTo = (image, size, canvas = newCanvas()) => {

  // image image, bitmap, or canvas
  let width = image.width;
  let height = image.height;

  const min = Math.min(width, height);
  const scale = size / min;
  const scaledW = Math.ceil(width * scale);
  const scaledH = Math.ceil(height * scale);
  const dx = scaledW - size;
  const dy = scaledH - size;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, ~~(dx / 2) * -1, ~~(dy / 2) * -1, scaledW, scaledH);

  return canvas;
}

const newCanvas = () => document.createElement('canvas');

const showMetrics = (alpha, time, logs) => {
  const lastEpoch = logs[logs.length - 1];
  const header = "α=" + alpha + ", t=" + (time / 1000).toFixed(1) + "s";
  console.info(`Result: ${header}`);
  console.info(`Train: accuracy ${lastEpoch.acc.toFixed(3)}, loss ${lastEpoch.loss.toFixed(5)}`);
  console.info(`Validation: accuracy ${lastEpoch.val_acc.toFixed(3)}, loss ${lastEpoch.val_loss.toFixed(5)}`);
}

export {getTrainModel, trainModel}