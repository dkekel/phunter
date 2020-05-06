<template>
  <div class="container">
    <div class="row">
      <div class="col-8">
        <div class="row row-cols-1 row-cols-md-4">
          <ResultCard v-for="(result, index) in results"
                      :key="result.user"
                      :user-id="result.user"
                      :image-src="result.photo"
                      :score="result.score"
                      :api-token="apiToken"
                      v-on:mark-pretty="markPretty($event, index)"
                      v-on:mark-not-pretty="markNotPretty($event, index)"
          >
          </ResultCard>
        </div>
          <nav aria-label="Result navigation">
              <ul class="pagination justify-content-center">
                  <li class="page-item">
                      <a class="page-link" href="#" tabindex="-1" @click="showMore">
                          < Previous
                      </a>
                  </li>
                  <li class="page-item disabled"><a class="page-link" href="#">{{page}}/{{totalPages}}</a></li>
                  <li class="page-item">
                      <a class="page-link" href="#" @click="showMore">Next ></a>
                  </li>
              </ul>
          </nav>
      </div>
      <div class="col">
        <ExtractProfiles v-on:switch-result-type="switchResults"
                         v-on:page-size-change="changePageSize"
                         v-on:mark-all-processed="markAllProcessed"
                         :page-size="pageSize"
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
      page: 0,
      pageSize: 10,
      totalCount: 0,
      pendingPrettyCount: 0,
      pendingNotPrettyCount: 0
    }
  },
  mounted () {
    this.fetchResults(true);
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalCount / this.pageSize);
    }
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
    },
    showMore() {
      this.fetchResults();
    },
    changePageSize(event) {
      this.pageSize = Number(event.pageSize);
      this.fetchResults()
    },
    switchResults(event) {
      this.classType = event.classType;
      this.fetchResults(true);
    },
    fetchResults(fullReload = false) {
      //Subtract the difference between page size and current results to reflect removed cards number
      const offset = fullReload ? 0 : this.page * this.pageSize - (this.pageSize - this.results.length);
      axios
        .get(`http://localhost:3000/results?classType=${this.classType}&size=${this.pageSize}&offset=${offset}`)
        .then(response => {
          const result = response.data;
          this.totalCount = result.count;
          this.pendingPrettyCount = result.pendingPretty;
          this.pendingNotPrettyCount = result.pendingNotPretty;
          this.page = fullReload ? 1 : this.page + 1;
          this.results = result.list;
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
