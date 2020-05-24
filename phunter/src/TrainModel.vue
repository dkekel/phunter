<template>
  <div class="container">
    <div class="row">
      <div class="col-8">
        <TrainingModelInfo/>
        <div v-if="status === 'READY'" class="container">
          <div class="alert alert-secondary" role="alert">
            <h4 class="alert-heading">Train a new model</h4>
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
          <div class="alert alert-primary" role="alert">{{progressInfo}}</div>
        </div>
        <TrainingResults v-if="status === 'FINISHED'"
                         :results="classResults"
                         :accuracy="totalAccuracy"
                         :loss="totalLoss"
                         :validation-accuracy="validationAccuracy"/>
        <div v-if="status === 'FINISHED'" class="text-center mb-3">
          <button type="button" class="btn btn-success btn-lg" @click="saveModel">Save model</button>
        </div>
        <TrainedModels :key="savedModelsVer"/>
      </div>
      <div class="col">
        <TrainingConfig v-on:start-training="startTraining"/>
      </div>
    </div>
  </div>
</template>

<script>

import TrainingResults from "./components/training/TrainingResults";
import TrainingConfig from "./components/training/TrainingConfig";
import {getTrainModel, trainModel} from "./training";
import axios from 'axios';
import TrainedModels from "./components/training/TrainedModels";
import TrainingModelInfo from "./components/training/TrainingModelInfo";

export default {
  name: 'TrainModel',
  components: {TrainingModelInfo, TrainedModels, TrainingConfig, TrainingResults},
  data () {
    return {
      savedModelsVer: 1,
      currentEpoch: 0,
      totalEpochs: 200,
      totalAccuracy: null,
      totalLoss: null,
      validationAccuracy: null,
      classResults: [],
      status: "READY",
      modelName: null,
      progressInfo: "Preparing to train a new model..."
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
      this.currentEpoch = 0;
      const epochCallback = () => {
        vueData.currentEpoch++;
      }
      const infoCallback = (logInfo) => {
        vueData.progressInfo = logInfo;
      }
      const dataSet = await getTrainModel(infoCallback);
      trainModel(dataSet, event, infoCallback, epochCallback).then(trainResult => {
        this.showMetrics(trainResult.lastEpoch);
        this.classResults = trainResult.classResults;
        this.modelName = trainResult.modelName;
        this.status = "FINISHED";
      });
    },
    showMetrics (lastEpoch) {
      this.totalAccuracy = lastEpoch.acc.toFixed(3);
      this.totalLoss = lastEpoch.loss.toFixed(5);
      this.validationAccuracy = lastEpoch.val_acc.toFixed(3);
    },
    async saveModel() {
      const storedModelName = this.modelName;
      await axios
              .post('http://localhost:3000/saveModelMetadata', {
                name: storedModelName,
                totalAccuracy: this.totalAccuracy,
                validationAccuracy: this.validationAccuracy,
                classResults: this.classResults
              })
              .then(() => this.savedModelsVer++);
    }
  }
}
</script>

<style>

</style>
