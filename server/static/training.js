const SEED_WORD = "fobonaccigirls";
const seed = new Math.seedrandom(SEED_WORD);

const MOBILENET_VERSION = 2;
const MAX_IMAGES = 200;
const TEST_IMAGES_SIZE = 0;

const IMAGE_SIZE = 224;

const init = async () => {
  const model = await getTrainModel();
  await trainModel(model);
}

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

const trainModel = async (trainData) => {
  // 1. Setup dataset parameters
  const classLabels = ['pretty', 'notPretty'];

  let NUM_IMAGE_PER_CLASS = Math.ceil(MAX_IMAGES / classLabels.length);

  const minTrainData = Math.min(trainData.pretty.length, trainData.notPretty.length);
  if (NUM_IMAGE_PER_CLASS > minTrainData) {
    NUM_IMAGE_PER_CLASS = minTrainData;
  }
  const TRAIN_VALIDATION_SIZE_PER_CLASS = NUM_IMAGE_PER_CLASS

  console.info(`train/validation size: ${TRAIN_VALIDATION_SIZE_PER_CLASS * classLabels.length}`);

  // 2. Create our datasets once
  const datasets = await createDatasets(
    trainData,
    classLabels,
    TRAIN_VALIDATION_SIZE_PER_CLASS,
    TEST_IMAGES_SIZE
  );
  const trainAndValidationImages = datasets.trainAndValidationImages;
  const testImages = datasets.testImages;

  // NOTE: If testing time, test first model twice because it takes longer
  // to train the very first time tf.js is training

  const VALID_ALPHA = 0.35;
  const EPOCHS = 200;
  const LEARNING_RATE = 0.00053;

  const lineStart = "\n//====================================";
  const lineEnd = "====================================//\n\n";
  console.log(lineStart);
  // 3. Test data on the model
  const teachableMobileNetV2 = await tmImage.createTeachable(
    {tfjsVersion: tmImage.version.tfjs},
    {version: MOBILENET_VERSION, alpha: VALID_ALPHA}
  );


  const lastEpoch = await testModel(
    teachableMobileNetV2,
    VALID_ALPHA,
    classLabels,
    trainAndValidationImages,
    testImages,
    TEST_IMAGES_SIZE,
    EPOCHS,
    LEARNING_RATE
  );

  // assert.isTrue(accuracyV2 > 0.7);
  console.log(lineEnd);

  // const testResults = await teachableMobileNetV2.calculateAccuracyPerClass();
  // console.info(testResults.reference.accuracy);
  await teachableMobileNetV2.save('http://localhost:3000/saveModel');
  return {model: teachableMobileNetV2, lastEpoch};
}

const createDatasets = async (
  trainData,
  classes,
  trainSize,
  testSize
) => {
  // fill in an array with unique numbers
  let listNumbers = [];
  for (let i = 0; i < trainSize + testSize; ++i) listNumbers[i] = i;
  listNumbers = fisherYates(listNumbers, seed); // shuffle

  const trainAndValidationIndices = listNumbers.slice(0, trainSize);
  const testIndices = listNumbers.slice(trainSize, trainSize + testSize);

  const trainAndValidationImages = [];
  const testImages = [];

  console.info("Loading train images...");
  for (const trainClass of classes) {
    let load = [];
    const classFaces = trainData[trainClass];
    for (const i of trainAndValidationIndices) {
      const base64Face = classFaces[i];
      load.push(loadBase64Image(base64Face));
    }
    trainAndValidationImages.push(await Promise.all(load));

    load = [];
    for (const i of testIndices) {
      const base64Face = classFaces[i];
      load.push(loadBase64Image(base64Face));
    }
    testImages.push(await Promise.all(load));
  }

  return {
    trainAndValidationImages,
    testImages
  };
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
                         testImages,
                         testSizePerClass,
                         epochs,
                         learningRate) => {
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
        batchSize: 128
      },
      {
        onEpochBegin: async (epoch, logs) => {
        },
        onEpochEnd: async (epoch, log) => {
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