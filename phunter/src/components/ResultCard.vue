<template>
    <div class="col mb-4">
        <div class="card text-center h-100">
        <img :src="'data:image/jpeg;base64,'+ imageSrc" class="card-img-top" alt="Profile Preview">
        <div class="card-body">
            <div class="alert alert-info">
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-success" role="progressbar" :style="{ width: pretty + '%' }"
                         :aria-valuenow="pretty" aria-valuemin="0" aria-valuemax="100">
                        Pretty: {{pretty}}%
                    </div>
                </div>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-warning" role="progressbar" :style="{ width: notPretty + '%' }"
                         :aria-valuenow="notPretty" aria-valuemin="0" aria-valuemax="100">
                        Not pretty: {{notPretty}}%
                    </div>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <div class="btn-group w-100" role="group" aria-label="User Input">
                <button type="button" class="btn btn-success" @click="markPretty">Pretty</button>
                <button type="button" class="btn btn-danger" @click="markNotPretty">Not Pretty</button>
            </div>
        </div>
    </div>
    </div>
</template>

<script>
  import axios from 'axios';

  export default {
    name: "ResultCard",
    props: {
      userId: String,
      imageSrc: String,
      score: Number,
      apiToken: String
    },
    computed: {
      pretty() {
        return this.score * 100;
      },
      notPretty() {
        return (1 - this.score) * 100;
      }
    },
    methods: {
      markPretty() {
        axios.post('http://localhost:3000/markPretty', {
          userId: this.userId,
          pretty: true
        }, {headers: {"Api-Token": this.apiToken}});
        this.removeCard();
      },
      markNotPretty() {
        axios.post('http://localhost:3000/markPretty', {
          userId: this.userId,
          pretty: false
        }, {headers: {"Api-Token": this.apiToken}});
        this.removeCard();
      },
      removeCard() {
        this.$emit("remove-card");
      }
    }
  }
</script>

<style scoped>
</style>