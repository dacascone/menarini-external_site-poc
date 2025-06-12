/* eslint-disable no-console */
import { route } from 'quasar/wrappers'
import {
  createRouter, createMemoryHistory, createWebHistory, createWebHashHistory
} from 'vue-router'
import routes from './routes'

export default route((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach((to, from, next) => {
    const accessToken = localStorage.getItem('access_token')

    if (to.meta.requiresAuth && !accessToken) {
      console.log('Utente non autenticato. Reindirizzo al login.')
      next('/login')
    } else {
      next()
    }
  })

  return Router
})
