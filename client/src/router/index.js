import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/mobile',
      name: 'mobile',
      component: () => import('../views/MobileScore.vue')
    },
    {
      path: '/screen',
      name: 'screen',
      component: () => import('../views/BigScreen.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/Admin.vue')
    },
    {
      path: '/vote',
      name: 'vote',
      component: () => import('../views/PublicVote.vue')
    }
  ]
})

export default router
