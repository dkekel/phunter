<template>
    <div id="app" class="container">
        <nav class="navbar navbar-expand-lg navbar-light bg-light mb-3">
            <span class="navbar-brand">PHunter</span>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item">
                        <router-link class="nav-link" :to="{name: 'matcher', params: {apiToken: apiToken}}">Matcher
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" :to="{name: 'results', params: {apiToken: apiToken}}">Results
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/train">Train</router-link>
                    </li>
                </ul>
                <form class="form-inline my-2 my-lg-0">
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text" id="basic-addon1">API Token:</span>
                        </div>
                        <input type="text" class="form-control" placeholder="Tinder token" aria-label="api-token"
                               aria-describedby="tinder-api-token" v-model="apiToken">
                    </div>
                </form>
            </div>
        </nav>
        <router-view></router-view>
    </div>
</template>

<script>
  export default {
    name: "App",
    data() {
      return {
        apiToken: ""
      }
    },
    mounted() {
      if (!!localStorage.apiToken) {
        this.apiToken = localStorage.apiToken;
      }
    },
    watch: {
      apiToken(newApiToken) {
        localStorage.apiToken = newApiToken;
      }
    }
  }
</script>

<style scoped>

</style>