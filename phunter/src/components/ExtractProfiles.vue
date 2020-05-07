<template>
    <div class="container">
        <div class="card" style="width: 18rem;">
            <div class="card-body">
                <h5 class="card-title">Pending results</h5>
            </div>
            <form>
                <div class="form-group col-md-12">
                    <div class="input-group mb-3">
                        <select class="custom-select" id="resultType" v-model="classType" @change="switchResultType">
                            <option>Result type...</option>
                            <option label="Pretty" :value="'pretty'">Pretty</option>
                            <option label="Not Pretty" selected :value="'not-pretty'">Not Pretty</option>
                        </select>
                        <div class="input-group-append">
                            <label class="input-group-text" for="resultType">
                                Profiles <span class="badge badge-light">{{totalCount}}</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group col-md-12">
                    <label for="resultSize">Results per page</label>
                    <input type="number" class="form-control" id="resultSize" v-model="paginationSize"
                           @change="pageSizeChanged">
                </div>
            </form>
            <div class="card-body">
                <p>Mark all processed:</p>
                <div class="btn-group" role="group" aria-label="Basic example">
                    <button type="button" class="btn btn-info" @click="markAllProcessed(true)">
                        Pretty <span class="badge badge-light">{{pendingPrettyCount}}</span>
                    </button>
                    <button type="button" class="btn btn-warning" @click="markAllProcessed(false)">
                        Not pretty <span class="badge badge-light">{{pendingNotPrettyCount}}</span>
                    </button>
                </div>

            </div>
        </div>
    </div>
</template>

<script>
  export default {
    name: "ExtractProfiles",
    props: {
      pageSize: Number,
      totalCount: Number,
      pendingPrettyCount: Number,
      pendingNotPrettyCount: Number
    },
    data() {
      return {
        classType: 'not-pretty',
        paginationSize: this.pageSize
      }
    },
    methods: {
      pageSizeChanged() {
        this.$emit('page-size-change', {pageSize: this.paginationSize});
      },
      switchResultType() {
        this.$emit('switch-result-type', {classType: this.classType});
      },
      markAllProcessed(prettyFlag) {
        this.$emit('mark-all-processed', {pretty: prettyFlag});
      }
    }
  }
</script>

<style scoped>

</style>