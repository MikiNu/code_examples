import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import 'vue-awesome/icons'
import Icon from 'vue-awesome/components/Icon.vue'
import AppOrders from './app-orders'
import router from './router/router-orders'
import store from './store/orders/orders-store'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import applyDataFilter from './filters/applyData'
import interceptors from './interceptors-service-consultant'
import api from './components/api'
Vue.use(BootstrapVue)
Vue.filter('applyData', applyDataFilter)
Vue.component('v-select', vSelect)
Vue.component('v-icon', Icon)

Vue.config.productionTip = false

api.axios.interceptors.request.use((request) => interceptors.setAuthInterceptor(store, api, request))
api.axios.interceptors.response.use(
  (response) => interceptors.responseFullfilledInterceptor(response),
  (error) => interceptors.responseErrorInterceptor(store, router, error)
)

/* eslint-disable no-new */
new Vue({
  el: '#orders-app',
  router,
  store,
  components: { AppOrders },
  template: '<AppOrders/>'
})
