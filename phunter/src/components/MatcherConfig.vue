<template>
    <div class="container">
        <div class="card" style="width: 18rem;">
            <div class="card-body">
                <h5 class="card-title">Matcher Config</h5>
                <div class="form-group col-md-12">
                    <label for="distance">Max Distance</label>
                    <input type="number" class="form-control" id="distance" v-model.number="config.maxDistance">
                </div>
                <div class="form-group col-md-12">
                    <label for="results">Results size</label>
                    <input id="results" type="number" class="form-control" v-model.number="config.maxResults">
                </div>
                <div class="form-group col-md-12">
                    <label for="pretty">Pretty threshold</label>
                    <input type="number" step="0.1" min="0" max="1" class="form-control" id="pretty"
                           v-model.number="config.minPretty">
                </div>
                <div class="form-group col-md-12">
                    <label for="super-pretty">Super pretty</label>
                    <input id="super-pretty" type="number" class="form-control"
                           min="0" max="1" step="0.1"
                           v-model.number="config.superPretty">
                </div>
            </div>
            <div class="card-body">
                <div class="form-group row">
                    <div class="col-sm-6">
                        <button class="btn btn-success" @click="hunt">Hunt</button>
                    </div>
                    <div class="col-sm-6">
                        <button class="btn btn-warning" @click="stop">Stop</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  export default {
    name: "MatcherConfig",
    data() {
        return {
          config: {
            maxDistance: 300,
            maxResults: 10,
            minPretty: 0.4,
            superPretty: 0.8
          }
        }
    },
    methods: {
      hunt() {
        this.$emit('update-config', this.config);
        this.$emit('start-hunt');
      },
      stop() {
        this.$emit('stop-hunt');
      }
    }
  }
</script>