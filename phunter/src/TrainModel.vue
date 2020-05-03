<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <div v-if="status === 'READY'" class="container">
          <div class="alert alert-info" role="alert">
            <h4 class="alert-heading">Model needs training</h4>
            <p>Please configure training parameters and click "Train" button.</p>
            <hr>
            <p class="mb-0">The result will be available at the end of the training.</p>
          </div>
        </div>
        <div v-if="status === 'TRAINING'" class="container">
          <div class="progress mb-3" style="height: 40px;">
            <div class="progress-bar progress-bar-striped" role="progressbar" :style="{ width: epochPercentage + '%' }"
                 :aria-valuenow="currentEpoch" aria-valuemin="0" :aria-valuemax="totalEpochs">
              Training {{currentEpoch}}/{{totalEpochs}} epoch
            </div>
          </div>
          <div class="alert alert-primary" role="alert">Training a new model...</div>
        </div>
        <TrainingResults v-if="status === 'FINISHED'"
                         :results="classResults"
                         :accuracy="totalAccuracy"
                         :loss="totalLoss"
                         :validation-accuracy="validationAccuracy"/>
        <div class="text-center">
          <button v-if="status === 'FINISHED'"
                  type="button" class="btn btn-success btn-lg" @click="saveModel">Save model
          </button>
        </div>
      </div>
      <div class="col-2">
        <TrainingConfig v-on:start-training="startTraining"/>
      </div>
    </div>
  </div>
</template>

<script>

import TrainingResults from "./components/training/TrainingResults";
import TrainingConfig from "./components/training/TrainingConfig";
import {getTrainModel, trainModel} from "./training";
import {metrics} from "@tensorflow/tfjs-vis";

export default {
  name: 'TrainModel',
  components: {TrainingConfig, TrainingResults},
  data () {
    return {
      currentEpoch: 0,
      totalEpochs: 200,
      totalAccuracy: null,
      totalLoss: null,
      validationAccuracy: null,
      classResults: [],
      status: "READY",
      trainedModel: null
    }
  },
  computed: {
    epochPercentage() {
      return this.currentEpoch / this.totalEpochs * 100;
    }
  },
  methods: {
    async startTraining(event) {
      const vueData = this;
      this.status = "TRAINING";
      this.totalEpochs = event.epochs;
      const dataSet = await getTrainModel();
      const epochCallback = () => {
        vueData.currentEpoch++;
      }
      const trainResult =
              await trainModel(dataSet, event.alpha, event.epochs, event.rate, event.batch, event.test, epochCallback);
      await this.calculateClassResults(trainResult.model);
      await this.showMetrics(trainResult.lastEpoch);
      this.status = "FINISHED";
      this.trainedModel = trainResult.model;
    },
    async calculateClassResults(model) {
      const accuracyTensors = await model.calculateAccuracyPerClass();
      this.classResults = await metrics.perClassAccuracy(accuracyTensors.reference, accuracyTensors.predictions);
    },
    showMetrics (lastEpoch) {
      this.totalAccuracy = lastEpoch.acc.toFixed(3);
      this.totalLoss = lastEpoch.loss.toFixed(5);
      this.validationAccuracy = lastEpoch.val_acc.toFixed(3);
    },
    async saveModel() {
      await this.trainedModel.save('http://localhost:3000/saveModel');
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
