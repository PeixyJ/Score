<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">评分系统</h1>

      <!-- 二维码区域 -->
      <div class="mb-6 p-4 bg-gray-50 rounded-xl">
        <p class="text-center text-sm text-gray-500 mb-3">手机扫码访问评分页面</p>
        <div class="flex justify-center">
          <canvas ref="qrcodeCanvas" class="rounded-lg"></canvas>
        </div>
        <p class="text-center text-xs text-gray-400 mt-2 font-mono">{{ mobileUrl }}</p>
      </div>

      <div class="space-y-4">
        <router-link
          to="/mobile"
          class="block w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white text-center text-lg font-medium rounded-xl transition-colors"
        >
          评分者入口
        </router-link>

        <router-link
          to="/vote"
          class="block w-full py-4 px-6 bg-pink-500 hover:bg-pink-600 text-white text-center text-lg font-medium rounded-xl transition-colors"
        >
          大众点评
        </router-link>

        <router-link
          to="/screen"
          class="block w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white text-center text-lg font-medium rounded-xl transition-colors"
        >
          大屏展示
        </router-link>

        <router-link
          to="/admin"
          class="block w-full py-4 px-6 bg-gray-500 hover:bg-gray-600 text-white text-center text-lg font-medium rounded-xl transition-colors"
        >
          管理后台
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import QRCode from 'qrcode'

const qrcodeCanvas = ref(null)

const mobileUrl = computed(() => {
  const host = window.location.hostname
  const port = window.location.port || '5173'
  return `http://${host}:${port}/mobile`
})

onMounted(() => {
  if (qrcodeCanvas.value) {
    QRCode.toCanvas(qrcodeCanvas.value, mobileUrl.value, {
      width: 180,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#f9fafb'
      }
    })
  }
})
</script>
