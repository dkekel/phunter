<template>
    <div class="container">
        <div class="container">
            <div class="text-center">
                <h2 class="phunter-heading">PHunter</h2>
                <h5 class="codename-heading"><i>(codename: Fibonacci Girls)</i></h5>
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="basic-addon1">API Token</span>
                    </div>
                    <input id="api-token" type="text" class="form-control" placeholder="API Token" aria-label="Username"
                           aria-describedby="basic-addon1" value="f4aecb01-c26a-4db7-a977-4be1d03a64c7">
                    <div class="input-group-append">
                        <button class="btn btn-success" type="button" onclick="init()">Start</button>
                    </div>
                </div>
                <div id="label-container" class="alert alert-info"></div>
                <img id="test-img" class="recognition-image img-thumbnail rounded"/>
            </div>
        </div>
        <div class="container">
            <div id="user-thumbnails" class="text-center">
            </div>
        </div>
        <div id="info-log" class="container logs overflow-auto">
        </div>
    </div>
</template>

<script>
  export default {
    name: "Matcher",
    props: {
      apiToken: String
    }
  }
</script>

<style scoped>
    .recognition-image {
        height: 250px;
    }

    .profile-thumbnail {
        height: 100px;
    }

    .logs {
        height: 150px;
    }

    .phunter-heading {
        font-weight: 300;
    }

    .codename-heading {
        font-weight: 100;
    }
</style>