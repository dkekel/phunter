<template>
    <div class="container">
        <div class="row">
            <div class="col-8">
                <div class="container">
                    <div class="text-center">
                        <div id="label-container" class="alert alert-info">
                            <div v-for="(prediction, idx) in predictionResults" role="progressbar"
                                 class="progress-bar" :class="idx === 0 ? 'bg-success' : 'bg-warning'"
                                 :aria-valuenow="prediction.classResult" aria-valuemin="0" aria-valuemax="100"
                                 style="height: 20px" :style="{width: prediction.classResult + '%'}">
                                {{prediction.className}}: {{prediction.classResult.toFixed(2)}}%
                            </div>
                        </div>
                        <img class="img-thumbnail rounded"
                             src=""
                             ref="profileImg"
                             width="224"
                             height="224"
                             alt="Image for prediction"/>
                    </div>
                </div>
                <div class="container">
                    <div id="user-thumbnails" class="text-center">
                        <div v-for="thumbnail in thumbnails" class="d-inline p-2">
                            <img class="profile-thumbnail img-thumbnail rounded"
                                 :src="thumbnail.src"
                                 :title="'Pretty' + thumbnail.probability"
                                 alt="Predicted image thumbnail"/>
                        </div>
                    </div>
                </div>
                <div ref="infoLog" class="container logs overflow-auto">
                    <samp v-for="log in logs" class="d-block" v-html="log"></samp>
                </div>
            </div>
            <div class="col">
                <MatcherConfig
                        v-on:update-config="updateConfig"
                        v-on:start-hunt="hunt"
                        v-on:stop-hunt="stopHunt"/>
            </div>
        </div>
    </div>
</template>

<script>
  import axios from "axios";
  import * as tf from "@tensorflow/tfjs";
  import * as tmImage from "@teachablemachine/image";
  import MatcherConfig from "./components/MatcherConfig";

  const URL = "https://teachablemachine.withgoogle.com/models/8mc6xcvVm/";
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  const fibonacciMapping = {"0": 0, "1": 0.1, "2": 0.2, "3": 0.3, "5": 0.6, "8": 0.8, "PARFAIT": 1};

  export default {
    name: "Matcher",
    components: {MatcherConfig},
    props: {
      apiToken: String
    },
    data() {
      return {
        model: null,
        maxPredictions: 0,
        config: null,
        profiles: [],
        thumbnails: [],
        result: [],
        totalScore: [],
        logs: [],
        started: false,
        feedProcessed: false
      }
    },
    mounted() {
      this.loadModel();
    },
    updated() {
        const logEl = this.$refs.infoLog;
        logEl.scrollTop = logEl.scrollHeight;
    },
    watch: {
      feedProcessed: function (val, oldVal) {
        if (!oldVal && val && this.started) {
          this.hunt();
        }
      }
    },
    computed: {
      predictionResults: function () {
        let totalCount = 0;
        const perClassTotal = new Array(this.maxPredictions).fill(0);
        const results = {}
        for (let faceResult of this.result) {
          totalCount++;
          const imageResult = faceResult.prediction;
          for (let i = 0; i < this.maxPredictions; i++) {
            let classTotal = perClassTotal[i];
            classTotal += imageResult[i].probability;
            perClassTotal[i] = classTotal;
            const classNormalized = (classTotal / totalCount) * 100;
            const className = imageResult[i].className;
            results[className] = classNormalized;
          }
        }
        return Object.keys(results).map(key => {return {className: key, classResult: results[key]}});
      }
    },
    methods: {
      async loadModel() {
        this.model = await tmImage.load(modelURL, metadataURL);
        this.maxPredictions = this.model.getTotalClasses();
      },
      getTimestamp() {
        return new Date().toLocaleString();
      },
      updateConfig(config) {
        this.config = config;
      },
      async hunt() {
        this.result = [];
        this.thumbnails = [];
        this.started = true;
        this.feedProcessed = false;
        this.appendFeedLoadingLog();
        await this.loadProfiles();
        while (this.started && this.profiles.length > 0) {
          const profile = this.profiles.pop();
          await this.analyzeProfile(profile);
          this.thumbnails = [];
          this.result = [];
        }
        this.feedProcessed = true;
      },
      async loadProfiles() {
        const response = await axios.post("http://localhost:3000/feed", this.config,
          {headers: {"Api-Token": this.apiToken}});
        this.profiles = response.data.users;
        this.appendFeedSizeLog(this.profiles.length);
      },
      async analyzeProfile(profile) {
        const userId = profile.userId;
        const userName = profile.userName;
        const images = profile.faces;
        for (let image of images) {
          await this.setImageForRecognition(userId, image.face);
          await tf.nextFrame().then(async () => {
            const imageResult = await this.model.predict(this.$refs.profileImg);
            this.result.push({face: image.face, file: image.file, prediction: imageResult});
            this.thumbnails.push(
              {
                src: `data:image/png;base64,${image.face}`,
                probability: imageResult[0].probability
              }
            );
          });
        }
        await this.categorizeResult({user: userId, result: this.result, config: this.config}, userName);
      },
      setImageForRecognition(userId, image) {
        return new Promise(resolve => {
          const profileImg = this.$refs.profileImg;
          profileImg.onload = () => {
            resolve();
          }
          profileImg.src = `data:image/png;base64,${image}`;
        });
      },
      async categorizeResult(result, userName) {
        const response = await axios.post('http://localhost:3000/categorize', result,
          {headers: {"Api-Token": this.apiToken}});
        const userScore = response.data.userScore;
        this.appendUserTotalLog(userScore, userName);
      },
      appendFeedLoadingLog() {
        const logLine = this.appendLogTimestamp('Loading next candidates... Espera por favor!');
        this.logs.push(logLine);
      },
      appendFeedSizeLog(candidatesCount) {
        const logLine =
          this.appendLogTimestamp(`Successfully loaded <b>${candidatesCount}</b> candidates with faces!`);
        this.logs.push(logLine);
      },
      appendUserTotalLog(prettyScore, userName) {
        const roundedScore = parseFloat(prettyScore.toFixed(1));
        let fibonacciScore;
        for (let key in fibonacciMapping) {
          if (roundedScore <= fibonacciMapping[key]) {
            fibonacciScore = key;
            break;
          }
        }
        const logLine = this.appendLogTimestamp(`<b>${userName}</b> score: ${fibonacciScore}`);
        this.logs.push(logLine);
      },
      appendLogTimestamp(logMessage) {
        return `${this.getTimestamp()} ${logMessage}`;
      },
      stopHunt() {
        this.started = false;
        this.appendStopLog();
      },
      appendStopLog() {
        const logLine = this.appendLogTimestamp('Stopping matching process...');
        this.logs.push(logLine);
      }
    }
  }
</script>

<style scoped>
    .profile-thumbnail {
        height: 100px;
    }

    .logs {
        height: 150px;
    }
</style>