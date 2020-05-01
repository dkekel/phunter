<template>
  <div id="app" class="container">
    <input id="api-token" type="text" class="form-control" placeholder="API Token" aria-label="Username"
           size="36" aria-describedby="basic-addon1" v-model="apiToken" value="f4aecb01-c26a-4db7-a977-4be1d03a64c7">
    <ExtractProfiles/>
    <div class="row row-cols-1 row-cols-md-3">
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
      results: []
    }
  },
  mounted () {
    this.fetchResults();
  },
  methods: {
    removeCard(index) {
      this.results.splice(index, 1);
    },
    fetchResults() {
      axios
              .get(`http://localhost:3000/results?offset=${this.results.length}`)
              .then(response => this.results = this.results.concat(response.data));
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
