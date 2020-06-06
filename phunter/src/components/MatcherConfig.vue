<template>
    <div class="container">
        <div class="card" style="width: 18rem;">
            <div class="card-body">
                <h5 class="card-title">Matcher Config</h5>
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
    methods: {
      hunt() {
        this.$emit('start-hunt');
      },
      stop() {
        this.$emit('stop-hunt');
      }
    }
  }
</script>