<template>
    <div class="container">
        <div class="alert alert-primary" role="alert">
            Available data sets:
            <div class="btn-group" role="group" aria-label="Model data">
              <span class="btn btn-sm btn-info disabled">
                Pretty <span class="badge badge-light">{{prettyDataSize}}</span>
              </span>
                <span class="btn btn-sm btn-warning disabled">
                Not pretty <span class="badge badge-light">{{notPrettyDataSize}}</span>
              </span>
            </div>
        </div>
    </div>
</template>

<script>
  import axios from 'axios';

  export default {
    name: "TrainingModelInfo",
    data() {
      return {
        trainingModels: []
      }
    },
    computed: {
      prettyDataSize() {
        return this.getClassData(true);
      },
      notPrettyDataSize() {
        return this.getClassData(false);
      }
    },
    mounted() {
      axios
        .get('http://localhost:3000/trainModelSize')
        .then(response => this.trainingModels = response.data);
    },
    methods: {
      getClassData(classType) {
        const classData = this.trainingModels.find(data => data.pretty === classType)
        return !!classData ? classData.dataSize : "n/a";
      }
    }
  }
</script>

<style scoped>

</style>