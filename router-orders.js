import Vue from 'vue'
import Router from 'vue-router'
import store from '../store/orders/orders-store'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

const Auth = () => import('@/components/request/auth')
const Home = () => import('@/components/orders/home')
const View = () => import('@/components/orders/order')
const NotFound = () => import('@/components/common/not-found')

Vue.use(Router)

// проверка НЕ авторизирован ли пользователь
const ifNotAuthenticated = (to, from, next) => {
  if (!store.getters.isAuthenticated) {
    if (!store.getters.authStatus || store.getters.authStatus === 'error') {
      if (to.params.bitrixToken) {
        store.dispatch('AUTH_INIT', to.params.bitrixToken).then(() => {
          next('/')
        }, () => {
          next()
        })
      } else {
        next()
      }
    } else {
      next()
    }
  } else {
    next('/')
  }
}

// проверка авторизирован ли пользователь
const ifAuthenticated = (to, from, next) => {
  if (store.getters.isAuthenticated) {
    // переход к следующему хуку в цепочке
    next()
    return
  }
  if (store.getters.userToken) {
    next('/set-auth/' + store.getters.userToken)
  } else {
    next('/set-auth/')
  }
}

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      props: true,
      component: Home,
      beforeEnter: ifAuthenticated
    },
    {
      path: '/view/:orderId',
      name: 'View',
      props: true,
      component: View,
      beforeEnter: ifAuthenticated
    },
    {
      path: '/set-auth/:bitrixToken',
      name: 'Auth',
      props: true,
      component: Auth,
      beforeEnter: ifNotAuthenticated
    },
    {
      path: '/set-auth/',
      name: 'AuthNoToken',
      component: Auth,
      beforeEnter: ifNotAuthenticated
    },
    {
      path: '*',
      name: 'NotFound',
      component: NotFound
    }
  ],
  beforeResolve (to, from, next) {
    if (to.name) {
      NProgress.start()
    }
    next()
  },
  afterEach () {
    NProgress.done()
  }
})
