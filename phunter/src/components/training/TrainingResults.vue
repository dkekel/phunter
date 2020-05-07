<template>
    <div class="container">
        <div class="alert alert-success" role="alert">
            <h4 class="alert-heading">Training complete!</h4>
            <p>Please find per-class accuracy in the table below.</p>
            <hr>
            <p class="mb-0">
                Total accuracy: {{accuracy}}. Total loss: {{loss}}. Validation accuracy: {{validationAccuracy}}
            </p>
        </div>
        <table class="table">
            <thead class="thead-dark">
            <tr>
                <th scope="col">Class</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Samples</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(result, index) in results" :key="index">
                <th scope="row">Class {{index + 1}}</th>
                <td>{{result.accuracy.toFixed(2)}}</td>
                <td>{{result.count}}</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
  export default {
    name: "TrainingResults",
    props: {
      results: Array,
      accuracy: String,
      loss: String,
      validationAccuracy: String
    }
  }
</script>

<style scoped>

</style>