import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import Matcher from "./Matcher";
import ProcessedProfiles from "./ProcessedProfiles";
import TrainModel from "./TrainModel";

import './registerServiceWorker'

Vue.config.productionTip = false

const routes = [
  {path: '/matcher', name: "matcher", props: true, component: Matcher},
  {path: '/results', name: "results", props: true, component: ProcessedProfiles},
  {path: '/train', component: TrainModel}
]

const router = new VueRouter({
  mode: 'history',
  routes
})

Vue.use(VueRouter);

new Vue({
  render: function (h) { return h(App) },
  router
}).$mount('#app')
