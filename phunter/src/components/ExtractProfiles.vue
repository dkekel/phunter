<template>
    <div class="container text-center">
        <div class="btn-group" role="group" aria-label="Basic example">
            <button id="pretty" type="button" class="btn btn-success" @click="extractSelected($event)">Extract "Pretty"</button>
            <button id="not-pretty" type="button" class="btn btn-warning" @click="extractSelected($event)">Extract "Not pretty"</button>
        </div>
    </div>
</template>

<script>
  import axios from 'axios';

  export default {
    name: "ExtractProfiles",
    methods: {
      extractSelected(event) {
        const selectedType = event.currentTarget.id;
        axios
          .get(`http://localhost:3000/extractClassified?type=${selectedType}`)
          .then(() => console.info(`Extracted ${selectedType}`));
      }
    }
  }
</script>

<style scoped>

</style>