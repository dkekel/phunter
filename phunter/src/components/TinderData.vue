<template>
    <div class="container">
        <div class="alert alert-primary" role="alert">
            <div class="btn-group" role="group" aria-label="Likes count">
              <span class="btn btn-sm btn-info disabled">
                Likes left: <span class="badge badge-light">{{likesInfo.likes}}</span>
              </span>
            </div>
            <span v-if="likesInfo.limit" class="btn btn-sm btn-warning disabled">
                Reset on: <span class="badge badge-light">{{resetDate}}</span>
            </span>
        </div>
    </div>
</template>

<script>
  const dateStringOptions = {year: 'numeric', month: 'long', day: 'numeric'};

  export default {
    name: "TinderData",
    props: {
      likesInfo: Object
    },
    computed: {
      resetDate: function () {
        const date = new Date(this.likesInfo.limit);
        const day = date.toLocaleDateString("fr-CH", dateStringOptions);
        const time = date.toLocaleTimeString();
        return `${day} ${time}`;
      }
    }
  }
</script>