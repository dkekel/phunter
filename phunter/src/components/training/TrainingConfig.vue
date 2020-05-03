<template>
    <div class="container">
        <div class="card" style="width: 18rem;">
            <div class="card-body">
                <h5 class="card-title">Training Config</h5>
                <p class="card-text">Parameters to be used for TensorFlow JS training.</p>
            </div>
            <form>
                <div class="form-group col-md-12">
                    <label for="epochs">Epochs</label>
                    <input type="number" class="form-control" id="epochs" v-model.number="epochs">
                </div>
                <div class="form-group col-md-12">
                    <label for="batchSize">Batches</label>
                    <select id="batchSize" class="custom-select my-1 mr-sm-2" v-model.number="batchSize">
                        <option>Choose...</option>
                        <option :value="16">16</option>
                        <option :value="32">32</option>
                        <option :value="64">64</option>
                        <option :value="128" selected>128</option>
                        <option :value="256">256</option>
                        <option :value="512">512</option>
                    </select>
                </div>
                <div class="form-group col-md-12">
                    <label for="learningRate">Epochs</label>
                    <input type="number" step="0.00001" class="form-control" id="learningRate"
                           v-model.number="learningRate">
                </div>
                <div class="form-group col-md-12">
                    <label for="testPercent">Test image percent</label>
                    <input type="number" step="0.05" class="form-control" id="testPercent" v-model.number="testPercent">
                </div>
                <div class="form-group col-md-12">
                    <label for="alpha">Alpha</label>
                    <select id="alpha" class="custom-select my-1 mr-sm-2" v-model.number="alpha">
                        <option>Choose...</option>
                        <option :value="0.25">0.25</option>
                        <option :value="0.35" selected>0.35</option>
                        <option :value="0.5">0.5</option>
                        <option :value="0.75">0.75</option>
                        <option :value="1">1</option>
                    </select>
                </div>
            </form>
            <div class="card-body">
                <div class="form-group row">
                    <div class="col-sm-12">
                        <button class="btn btn-primary" @click="trainModel">Train</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  export default {
    name: "TrainingConfig",
    data() {
      return {
        epochs: 200,
        batchSize: 128,
        learningRate: 0.00052,
        testPercent: 0.1,
        alpha: 0.35
      }
    },
    methods: {
      trainModel() {
        this.$emit('start-training',
          {epochs: this.epochs,
            batch: this.batchSize,
            rate: this.learningRate,
            test: this.testPercent,
            alpha: this.alpha});
      }
    }
  }
</script>

<style scoped>

</style>