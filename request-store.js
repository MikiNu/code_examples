import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth'
import regions from './modules/regions'
import request from './modules/request'
import subdivision from '../common/modules/subdivision'

Vue.use(Vuex)

export default new Vuex.Store({
  // используемые модули
  modules: {
    auth,
    subdivision,
    regions,
    request
  }
})
