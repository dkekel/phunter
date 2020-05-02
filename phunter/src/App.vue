<template>
  <div id="app" class="container">
    <div class="input-group mb-3">
      <div class="input-group-prepend">
        <span class="input-group-text" id="basic-addon1">API Token</span>
      </div>
      <input id="api-token" type="text" class="form-control" placeholder="API Token" aria-label="Username"
             size="36" aria-describedby="basic-addon1" v-model="apiToken" value="f4aecb01-c26a-4db7-a977-4be1d03a64c7">
      <select v-model="classType" @change="fetchResults(true)">
        <option label="Pretty" :value="'pretty'">Pretty</option>
        <option label="Not Pretty" selected :value="'not-pretty'">Not Pretty</option>
      </select>
      <div class="input-group-append">
        <div class="btn btn-primary">
          Profiles left <span class="badge badge-light">{{totalCount}}</span>
        </div>
      </div>
    </div>
    <ExtractProfiles/>
    <div class="row row-cols-1 row-cols-md-5">
      <ResultCard v-for="(result, index) in results"
                  :key="result.user"
                  :user-id="result.user"
                  :image-src="result.img"
                  :score="result.score"
                  :api-token="apiToken"
                  v-on:remove-card="removeCard(index)"
      >
      </ResultCard>
    </div>
    <div class="text-center">
      <button class="btn btn-info" @click="fetchResults">Show more...</button>
    </div>
  </div>
</template>

<script>
import ResultCard from "./components/ResultCard";
import axios from "axios";
import ExtractProfiles from "./components/ExtractProfiles";

export default {
  name: 'App',
  data () {
    return {
      apiToken: "f4aecb01-c26a-4db7-a977-4be1d03a64c7",
      classType: 'not-pretty',
      results: [],
      totalCount: Number
    }
  },
  mounted () {
    this.fetchResults();
  },
  methods: {
    removeCard(index) {
      this.results.splice(index, 1);
      this.totalCount--;
      if (this.results.length < 5) {
        this.fetchResults();
      }
    },
    fetchResults(fullReload = false) {
      const offset = fullReload ? 0 : this.results.length;
      axios
              .get(`http://localhost:3000/results?classType=${this.classType}&offset=${offset}`)
              .then(response => {
                const result = response.data;
                this.totalCount = result.count;
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
