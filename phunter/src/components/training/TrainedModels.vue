<template>
    <div class="container">
        <div v-if="results.length === 0">
            <div class="alert alert-warning" role="alert">
                <h4 class="alert-heading">No trained models</h4>
                <p>Please train at least one model first.</p>
            </div>
        </div>
        <table v-if="results.length > 0" class="table">
            <thead class="thead-dark">
            <tr>
                <th scope="col">Creation Date</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Validation</th>
                <th scope="col">Class Results</th>
                <th scope="col">Default</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="result in results" :key="result.name">
                <th scope="row">{{modelCreationDate(result.name)}}</th>
                <td>{{result.totalAccuracy}}</td>
                <td>{{result.validationAccuracy}}</td>
                <td>
                    <PerClassResult :classes="result.classResults"/>
                </td>
                <td>{{result.default}}</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
  import axios from 'axios';
  import PerClassResult from "./PerClassResult";
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  export default {
    name: "TrainedModels",
    components: {PerClassResult},
    data() {
      return {
        results: []
      }
    },
    mounted() {
      this.getStoredModels();
    },
    methods: {
      getStoredModels() {
        axios
          .get('http://localhost:3000/storedModels')
          .then(response => this.results = response.data);
      },
      modelCreationDate(timestamp) {
        const modelDate = new Date(timestamp);
        const year = modelDate.getFullYear();
        const month = months[modelDate.getMonth()];
        const day = modelDate.getDate();
        const hour = modelDate.getHours();
        const min = modelDate.getMinutes();
        const sec = modelDate.getSeconds();
        return day + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec;
        return '';
      }
    }
  }
</script>

<style scoped>

</style>