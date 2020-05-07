<template>
    <div>
        <div v-for="(classInfo, index) in classes" class="progress" style="height: 20px;">
            <div :class="['progress-bar', (index === 0 ? 'bg-success' : 'bg-warning')]"
                 role="progressbar"
                 :style="{ width: classInfo.accuracy * 100 + '%' }"
                 :aria-valuenow="classInfo.accuracy" aria-valuemin="0" aria-valuemax="1">
                Class {{index}}: {{classAccuracy[index].toFixed(2)}}%
            </div>
        </div>
    </div>
</template>

<script>
  export default {
    name: "PerClassResult",
    props: {
      classes: Array
    },
    computed: {
      classAccuracy() {
        return this.classes.map(value => value.accuracy * 100);
      }
    }
  }
</script>

<style scoped>

</style>