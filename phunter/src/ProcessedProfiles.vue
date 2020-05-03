<template>
  <div class="container">
    <div class="row">
      <div class="col-8">
        <div class="row row-cols-1 row-cols-md-4">
          <ResultCard v-for="(result, index) in results"
                      :key="result.user"
                      :user-id="result.user"
                      :image-src="result.img"
                      :score="result.score"
                      :api-token="apiToken"
                      v-on:mark-pretty="markPretty($event, index)"
                      v-on:mark-not-pretty="markNotPretty($event, index)"
          >
          </ResultCard>
        </div>
        <div class="text-center">
          <button class="btn btn-info" @click="showMore">Show more...</button>
        </div>
      </div>
      <div class="col">
        <ExtractProfiles v-on:switch-result-type="switchResults"
                         v-on:mark-all-processed="markAllProcessed"
                         :totalCount="totalCount"
                         :pending-pretty-count="pendingPrettyCount"
                         :pending-not-pretty-count="pendingNotPrettyCount"/>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import ResultCard from "./components/ResultCard";
import ExtractProfiles from "./components/ExtractProfiles";

export default {
  name: 'ProcessedProfiles',
  props: {
    apiToken: String
  },
  data () {
    return {
      results: [],
      classType: "not-pretty",
      totalCount: 0,
      pendingPrettyCount: 0,
      pendingNotPrettyCount: 0
    }
  },
  mounted () {
    this.fetchResults();
  },
  methods: {
    markPretty(event, index) {
      const userId = event.userId;
      this.markProfile(userId, true);
      this.removeCard(index);
    },
    markNotPretty(event, index) {
      const userId = event.userId;
      this.markProfile(userId, false);
      this.removeCard(index);
    },
    markProfile(userId, prettyFlag) {
      axios
              .post('http://localhost:3000/markPretty', {
                userId: userId,
                pretty: prettyFlag
              }, {headers: {"Api-Token": this.apiToken}})
              .then(response => {
                const result = response.data;
                this.pendingPrettyCount = result.pendingPretty;
                this.pendingNotPrettyCount = result.pendingNotPretty;
              });
    },
    markAllProcessed(event) {
      const prettyFlag = event.pretty;
      axios
              .post('http://localhost:3000/markAllProcessed', {pretty: prettyFlag})
              .then(response => {
                const result = response.data;
                this.pendingPrettyCount = result.pendingPretty;
                this.pendingNotPrettyCount = result.pendingNotPretty;
              });
    },
    removeCard(index) {
      this.results.splice(index, 1);
      this.totalCount--;
      if (this.results.length < 5) {
        this.fetchResults();
      }
    },
    showMore() {
      this.fetchResults();
    },
    switchResults(event) {
      this.classType = event.classType;
      this.fetchResults(true);
    },
    fetchResults(fullReload = false) {
      const offset = fullReload ? 0 : this.results.length;
      axios
              .get(`http://localhost:3000/results?classType=${this.classType}&offset=${offset}`)
              .then(response => {
                const result = response.data;
                this.totalCount = result.count;
                this.pendingPrettyCount = result.pendingPretty;
                this.pendingNotPrettyCount = result.pendingNotPretty;
                this.results = fullReload ? result.list : this.results.concat(result.list);
              });
    }
  },
  components: {
    ExtractProfiles,
    ResultCard
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
