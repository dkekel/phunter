<template>
    <div class="col mb-4">
        <div class="card text-center h-100">
        <img :src="'data:image/jpeg;base64,'+ imageSrc" class="card-img-top" alt="Profile Preview">
        <div class="card-body">
            <div class="alert alert-info">
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-success" role="progressbar" :style="{ width: pretty + '%' }"
                         :aria-valuenow="pretty" aria-valuemin="0" aria-valuemax="100">{{pretty}}%
                    </div>
                </div>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-warning" role="progressbar" :style="{ width: notPretty + '%' }"
                         :aria-valuenow="notPretty" aria-valuemin="0" aria-valuemax="100">{{notPretty}}%
                    </div>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <div class="btn-group w-100" role="group" aria-label="User Input">
                <button type="button" class="btn btn-sm btn-success" @click="markPretty">Pretty</button>
                <button type="button" class="btn btn-sm btn-danger" @click="markNotPretty">Not Pretty</button>
            </div>
        </div>
    </div>
    </div>
</template>

<script>
  export default {
    name: "ResultCard",
    props: {
      userId: String,
      imageSrc: String,
      score: Number
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
        this.$emit('mark-pretty', {userId: this.userId});
      },
      markNotPretty() {
        this.$emit('mark-not-pretty', {userId: this.userId});
      }
    }
  }
</script>

<style scoped>
</style>