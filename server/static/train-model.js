self.importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js",
  "https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.4/dist/teachablemachine-image.min.js")

const SEED_WORD = "fobonaccigirls";

const MOBILENET_VERSION = 2;

onmessage = async (message) => {
  const data = message.data;
  const classLabels = data.trainingConfig.classLabels;
  const trainingDataset = data.trainingDataset;
  const alpha = data.trainingConfig.alpha;
  const epochs = data.trainingConfig.epochs;
  const learningRate = data.trainingConfig.rate;
  const batchSize = data.trainingConfig.batch;

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
    trainingDataset,
    epochs,
    learningRate,
    batchSize
  );

  console.log(lineEnd);

  const classResults = await calculateClassResults(teachableMobileNetV2);
  const modelName = await storeTrainedModel(teachableMobileNetV2);
  postMessage({result: {classResults: classResults, modelName, lastEpoch}, status: "FINISHED"});
}

const calculateClassResults = async (model) => {
  const accuracyTensors = await model.calculateAccuracyPerClass();
  return perClassAccuracy(accuracyTensors.reference, accuracyTensors.predictions);
}

const perClassAccuracy = async (labels, predictions) => {
  const numClasses = tf.tidy(() => {
    return tf.maximum(labels.max(), predictions.max()).dataSync()[0] + 1;
  });

  return Promise.all([labels.data(), predictions.data()])
    .then(([labelsArray, predsArray]) => {
      // Per class total counts
      const counts = Array(numClasses).fill(0);
      // Per class accuracy
      const accuracy = Array(numClasses).fill(0);

      for (let i = 0; i < labelsArray.length; i++) {
        const label = labelsArray[i];
        const pred = predsArray[i];

        counts[label] += 1;
        if (label === pred) {
          accuracy[label] += 1;
        }
      }

      const results = [];
      for (let i = 0; i < counts.length; i++) {
        results.push({
          count: counts[i],
          accuracy: counts[i] === 0 ? 0 : accuracy[i] / counts[i],
        });
      }

      return results;
    });
}

const storeTrainedModel = async (model) => {
  let modelName;
  const saveResult = await model.save('http://localhost:3000/saveModel');
  const response = saveResult.responses[0];
  if (response.status === 200) {
    const result = await response.json();
    modelName = result.modelName;
  } else {
    console.error("Failed to save model!");
  }
  return modelName;
}

const testModel = async (model,
                         alpha,
                         classes,
                         trainAndValidationImages,
                         epochs,
                         learningRate,
                         batchSize) => {
  model.setLabels(classes);
  model.setSeed(SEED_WORD); // set a seed to shuffle predictably

  const logs = [];
  await tf.nextFrame().then(async () => {
    let index = 0;
    let count = 0;
    for (const imgSet of trainAndValidationImages) {
      for (const img of imgSet) {
        await model.addExample(index, img);
        count++;
        postMessage(
          {info: `Adding examples to the training model ${count}/${trainAndValidationImages.length * imgSet.length}...`,
            status: "PREPARING"});
      }
      index++;
    }
    postMessage({info: "Training a new model...", status: "PREPARING"});
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
          postMessage({info: log, status: "TRAINING"});
          logs.push(log);
        }
      }
    );
  });

  printMetrics(alpha, logs);
  return logs[logs.length - 1];
}

const printMetrics = (alpha, logs) => {
  const lastEpoch = logs[logs.length - 1];
  const header = "α=" + alpha;
  console.info(`Result: ${header}`);
  console.info(`Train: accuracy ${lastEpoch.acc.toFixed(3)}, loss ${lastEpoch.loss.toFixed(5)}`);
  console.info(`Validation: accuracy ${lastEpoch.val_acc.toFixed(3)}, loss ${lastEpoch.val_loss.toFixed(5)}`);
}