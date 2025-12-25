<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 未登录：输入密钥 -->
    <div v-if="!store.currentJudge" class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
        <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">评分者登录</h1>

        <div class="space-y-4">
          <input
            v-model="secretKey"
            type="text"
            placeholder="请输入您的密钥"
            class="w-full px-4 py-3 border-2 rounded-xl text-center text-lg font-mono uppercase focus:outline-none focus:border-blue-500"
            @keyup.enter="login"
          />

          <p v-if="loginError" class="text-red-500 text-sm text-center">{{ loginError }}</p>

          <button
            @click="login"
            :disabled="!secretKey"
            class="w-full py-3 bg-blue-500 text-white rounded-xl text-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            登录
          </button>

          <div class="relative py-2">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          <router-link
            to="/vote"
            class="block w-full py-3 bg-pink-500 text-white rounded-xl text-lg font-medium text-center hover:bg-pink-600 transition-colors"
          >
            大众点评
          </router-link>
        </div>
      </div>
    </div>

    <!-- 已登录：评分界面 -->
    <template v-else>
      <!-- 头部 -->
      <header class="bg-white shadow sticky top-0 z-10">
        <div class="px-4 py-3 flex items-center justify-between">
          <div>
            <span class="text-gray-500 text-sm">评分者:</span>
            <span class="ml-1 font-medium">{{ store.currentJudge.name }}</span>
          </div>
          <button @click="logout" class="text-red-500 text-sm">退出</button>
        </div>
      </header>

      <!-- 被评分者列表 -->
      <div v-if="!selectedContestant" class="p-4">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">选择被评分者</h2>

        <!-- 赛道筛选 -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            @click="trackFilter = ''"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium',
              trackFilter === '' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'
            ]"
          >
            全部
          </button>
          <button
            v-for="track in store.tracks"
            :key="track.name"
            @click="trackFilter = track.name"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium',
              trackFilter === track.name ? `bg-${track.color}-500 text-white` : 'bg-white text-gray-600'
            ]"
          >
            {{ track.display_name }}
          </button>
        </div>

        <div class="space-y-3">
          <button
            v-for="contestant in filteredContestants"
            :key="contestant.id"
            @click="selectContestant(contestant)"
            class="w-full p-4 bg-white rounded-xl shadow text-left"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    `bg-${getTrackInfo(contestant.track).color}-100 text-${getTrackInfo(contestant.track).color}-600`
                  ]"
                >
                  {{ contestant.track }}
                </span>
                <span class="font-medium text-gray-800">{{ contestant.name }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span
                  v-if="myScoresMap[contestant.id]"
                  class="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full"
                >
                  已评分
                </span>
                <span class="text-gray-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </span>
              </div>
            </div>
            <!-- 显示已评分数 -->
            <div v-if="myScoresMap[contestant.id]" class="mt-2 pt-2 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <div class="flex flex-wrap gap-2 flex-1">
                  <span
                    v-for="score in myScoresMap[contestant.id]"
                    :key="score.dimension_id"
                    class="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded flex items-center"
                  >
                    {{ getDimensionName(score.dimension_id) }}:
                    <span class="ml-1 text-yellow-500">{{ '★'.repeat(score.score) }}</span>
                  </span>
                </div>
                <button
                  @click.stop="deleteMyScore(contestant.id)"
                  class="ml-2 px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  删除
                </button>
              </div>
            </div>
          </button>
        </div>

        <p v-if="filteredContestants.length === 0" class="text-center text-gray-500 mt-8">
          暂无被评分者，请在管理后台添加
        </p>
      </div>

      <!-- 评分表单 -->
      <div v-else class="p-4">
        <button
          @click="selectedContestant = null"
          class="flex items-center text-blue-500 mb-4"
        >
          <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          返回列表
        </button>

        <div class="bg-white rounded-xl shadow p-4 mb-4">
          <div class="flex items-center space-x-3">
            <span
              :class="[
                'px-2 py-1 rounded text-xs font-medium',
                `bg-${getTrackInfo(selectedContestant.track).color}-100 text-${getTrackInfo(selectedContestant.track).color}-600`
              ]"
            >
              {{ getTrackInfo(selectedContestant.track).display_name }}
            </span>
            <h2 class="text-xl font-bold text-gray-800">{{ selectedContestant.name }}</h2>
          </div>
          <p class="text-gray-500 text-sm mt-2">请点击星星为各维度打分</p>
        </div>

        <!-- 各维度评分 -->
        <div class="space-y-4">
          <div
            v-for="dim in currentDimensions"
            :key="dim.id"
            class="bg-white rounded-xl shadow p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="font-medium text-gray-800">{{ dim.name }}</span>
              <span class="text-xl font-bold text-blue-500">{{ scores[dim.id] || 0 }} / {{ store.scoreConfig.default_max_score }}</span>
            </div>

            <!-- 五角星评分 -->
            <div class="flex items-center justify-center space-x-1">
              <button
                v-for="star in store.scoreConfig.default_max_score"
                :key="star"
                @click="scores[dim.id] = star"
                class="text-4xl transition-transform hover:scale-110 focus:outline-none"
              >
                <span v-if="(scores[dim.id] || 0) >= star" class="text-yellow-400">★</span>
                <span v-else class="text-gray-300">☆</span>
              </button>
            </div>

            <div class="text-center mt-2">
              <button
                v-if="scores[dim.id] > 0"
                @click="scores[dim.id] = 0"
                class="text-xs text-gray-400 hover:text-red-500"
              >
                清除
              </button>
            </div>
          </div>
        </div>

        <p v-if="currentDimensions.length === 0" class="text-center text-gray-500 mt-8">
          该赛道暂无评分维度，请在管理后台添加
        </p>

        <!-- 提交按钮 -->
        <button
          v-if="currentDimensions.length > 0"
          @click="submitScores"
          :disabled="submitting"
          class="w-full mt-6 py-4 bg-green-500 text-white rounded-xl text-lg font-medium disabled:bg-gray-300"
        >
          {{ submitting ? '提交中...' : '提交评分' }}
        </button>

        <p v-if="submitSuccess" class="text-green-500 text-center mt-4">评分提交成功！</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useScoreStore } from '../stores/score'
import axios from 'axios'

const store = useScoreStore()

const secretKey = ref('')
const loginError = ref('')
const selectedContestant = ref(null)
const scores = reactive({})
const submitting = ref(false)
const submitSuccess = ref(false)
const trackFilter = ref('')
const allDimensions = ref([])
const myScoresMap = ref({})

const filteredContestants = computed(() => {
  if (!trackFilter.value) return store.contestants
  return store.contestants.filter(c => c.track === trackFilter.value)
})

const currentDimensions = computed(() => {
  if (!selectedContestant.value) return []
  return allDimensions.value.filter(d => d.track === selectedContestant.value.track)
})

function getDimensionName(dimensionId) {
  const dim = allDimensions.value.find(d => d.id === dimensionId)
  return dim ? dim.name : '未知维度'
}

function getTrackInfo(trackName) {
  const track = store.tracks.find(t => t.name === trackName)
  return track || { name: trackName, display_name: trackName + '赛道', color: 'gray' }
}

async function loadAllMyScores() {
  if (!store.currentJudge) return

  const newMap = {}
  for (const contestant of store.contestants) {
    const scores = await store.getMyScores(contestant.id)
    if (scores && scores.length > 0) {
      newMap[contestant.id] = scores
    }
  }
  myScoresMap.value = newMap
}

onMounted(async () => {
  // 尝试恢复登录状态
  await store.restoreLogin()

  // 加载数据
  await Promise.all([
    store.fetchContestants(),
    store.fetchTracks(),
    store.fetchScoreConfig()
  ])

  // 获取所有维度
  const res = await axios.get('/api/dimensions')
  allDimensions.value = res.data

  // 如果已登录，加载评分记录
  if (store.currentJudge) {
    await loadAllMyScores()
  }

  // 初始化 socket
  store.initSocket()
})

async function login() {
  loginError.value = ''
  const success = await store.verifyKey(secretKey.value.toUpperCase())
  if (!success) {
    loginError.value = '密钥无效，请检查后重试'
  } else {
    // 登录成功后加载评分记录
    await loadAllMyScores()
    // 报告评委上线
    store.reportJudgeOnline()
  }
}

function logout() {
  store.logout()
  secretKey.value = ''
}

async function selectContestant(contestant) {
  selectedContestant.value = contestant
  submitSuccess.value = false

  // 清空旧数据
  Object.keys(scores).forEach(key => delete scores[key])

  // 设置默认值（只设置该赛道的维度）
  const trackDimensions = allDimensions.value.filter(d => d.track === contestant.track)
  trackDimensions.forEach(dim => {
    scores[dim.id] = 0
  })

  // 加载已有评分
  const existingScores = await store.getMyScores(contestant.id)
  existingScores.forEach(s => {
    scores[s.dimension_id] = s.score
  })
}

async function submitScores() {
  if (submitting.value) return

  submitting.value = true
  submitSuccess.value = false

  try {
    const scoreList = Object.entries(scores).map(([dimension_id, score]) => ({
      dimension_id: parseInt(dimension_id),
      score
    }))

    await store.submitScore(selectedContestant.value.id, scoreList)
    submitSuccess.value = true

    // 更新已评分记录
    myScoresMap.value[selectedContestant.value.id] = scoreList

    // 1.5秒后返回列表
    setTimeout(() => {
      selectedContestant.value = null
      submitSuccess.value = false
    }, 1500)
  } catch (err) {
    alert('提交失败：' + err.message)
  } finally {
    submitting.value = false
  }
}

async function deleteMyScore(contestantId) {
  if (!confirm('确定要删除对该选手的评分吗？')) return

  try {
    await axios.delete(`/api/scores/judge/${store.currentJudge.id}/contestant/${contestantId}`)
    delete myScoresMap.value[contestantId]
  } catch (err) {
    alert('删除失败：' + err.message)
  }
}
</script>
