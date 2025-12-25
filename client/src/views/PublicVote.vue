<template>
  <div class="min-h-screen bg-gradient-to-br from-pink-500 to-orange-400 p-4">
    <div class="max-w-md mx-auto">
      <!-- 标题 -->
      <header class="text-center mb-6 pt-4">
        <h1 class="text-3xl font-bold text-white mb-2">大众点评</h1>
        <p class="text-white/80">为您喜欢的选手投票 (0-5分)</p>
      </header>

      <!-- 赛道筛选 -->
      <div class="flex flex-wrap justify-center gap-3 mb-6">
        <button
          @click="trackFilter = ''"
          :class="[
            'px-5 py-2 rounded-full font-medium transition-all',
            trackFilter === '' ? 'bg-white text-pink-600' : 'bg-white/20 text-white'
          ]"
        >
          全部
        </button>
        <button
          v-for="track in tracks"
          :key="track.name"
          @click="trackFilter = track.name"
          :class="[
            'px-5 py-2 rounded-full font-medium transition-all',
            trackFilter === track.name ? `bg-${track.color}-500 text-white` : 'bg-white/20 text-white'
          ]"
        >
          {{ track.display_name }}
        </button>
      </div>

      <!-- 选手列表 -->
      <div class="space-y-4">
        <div
          v-for="contestant in filteredContestants"
          :key="contestant.id"
          class="bg-white rounded-2xl shadow-lg p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-bold',
                  `bg-${getTrackInfo(contestant.track).color}-100 text-${getTrackInfo(contestant.track).color}-600`
                ]"
              >
                {{ contestant.track }}
              </span>
              <span class="font-bold text-gray-800">{{ contestant.name }}</span>
            </div>
            <div v-if="myRatings[contestant.id] !== undefined" class="text-green-500 text-sm">
              已投票
            </div>
          </div>

          <!-- 星级评分 -->
          <div class="flex items-center justify-center space-x-2">
            <button
              v-for="star in 5"
              :key="star"
              @click="rate(contestant.id, star)"
              class="text-3xl transition-transform hover:scale-110 focus:outline-none"
            >
              <span v-if="(myRatings[contestant.id] || 0) >= star" class="text-yellow-400">★</span>
              <span v-else class="text-gray-300">☆</span>
            </button>
            <button
              v-if="myRatings[contestant.id] !== undefined"
              @click="deleteRating(contestant.id)"
              class="ml-2 text-xs text-red-400 hover:text-red-600"
              title="删除我的评分"
            >
              删除
            </button>
          </div>

          <div class="flex justify-between items-center mt-3 text-sm text-gray-500 border-t pt-2">
            <div>
              我的评分: <span class="font-medium text-pink-600">{{ myRatings[contestant.id] ?? '-' }}</span> 分
            </div>
            <div class="text-right">
              <span class="text-pink-500 font-medium">{{ getPublicRating(contestant.id).avg_rating.toFixed(1) }}</span> 分
              <span class="text-gray-400 text-xs">({{ getPublicRating(contestant.id).count }}人)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredContestants.length === 0" class="text-center py-12 text-white/80">
        <p>暂无选手</p>
      </div>

      <!-- 返回首页 -->
      <div class="text-center mt-8 pb-8">
        <router-link to="/" class="text-white/80 hover:text-white text-sm">
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import axios from 'axios'

const contestants = ref([])
const tracks = ref([])
const trackFilter = ref('')
const myRatings = reactive({})
const voterId = ref('')
const publicRatings = reactive({}) // 存储每个选手的大众评分统计
let socket = null

function getTrackInfo(trackName) {
  const track = tracks.value.find(t => t.name === trackName)
  return track || { name: trackName, display_name: trackName + '赛道', color: 'gray' }
}

const filteredContestants = computed(() => {
  if (!trackFilter.value) return contestants.value
  return contestants.value.filter(c => c.track === trackFilter.value)
})

onMounted(async () => {
  // 获取或生成投票者ID
  let id = localStorage.getItem('publicVoterId')
  if (!id) {
    id = 'voter_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
    localStorage.setItem('publicVoterId', id)
  }
  voterId.value = id

  // 加载选手列表和赛道
  const [contestantsRes, tracksRes] = await Promise.all([
    axios.get('/api/contestants'),
    axios.get('/api/tracks')
  ])
  contestants.value = contestantsRes.data
  tracks.value = tracksRes.data

  // 加载我的评分和大众评分统计
  for (const contestant of contestants.value) {
    try {
      const ratingRes = await axios.get(`/api/public-ratings/voter/${voterId.value}/contestant/${contestant.id}`)
      if (ratingRes.data.rating !== null) {
        myRatings[contestant.id] = ratingRes.data.rating
      }
      // 加载大众评分统计
      const statsRes = await axios.get(`/api/public-ratings/contestant/${contestant.id}`)
      publicRatings[contestant.id] = statsRes.data
    } catch (e) {
      // 忽略错误
    }
  }

  // 初始化 Socket 连接
  const socketUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : `http://${window.location.hostname}:3000`

  socket = io(socketUrl)

  socket.on('connect', () => {
    console.log('Public vote socket connected')
    // 报告大众评委上线
    socket.emit('publicVoterOnline')
  })

  // 监听排名更新，从中提取大众评分数据
  socket.on('rankings', (data) => {
    // 更新大众评分统计
    const allContestants = [...(data.A?.contestants || []), ...(data.B?.contestants || [])]
    for (const c of allContestants) {
      publicRatings[c.id] = {
        avg_rating: c.public_rating_avg || 0,
        count: c.public_rating_count || 0
      }
    }
  })
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})

async function rate(contestantId, rating) {
  try {
    await axios.post('/api/public-ratings', {
      contestant_id: contestantId,
      voter_id: voterId.value,
      rating
    })
    myRatings[contestantId] = rating
  } catch (err) {
    alert('投票失败：' + err.message)
  }
}

async function deleteRating(contestantId) {
  if (!confirm('确定要删除对该选手的评分吗？')) return

  try {
    await axios.delete(`/api/public-ratings/voter/${voterId.value}/contestant/${contestantId}`)
    delete myRatings[contestantId]
  } catch (err) {
    alert('删除失败：' + err.message)
  }
}

function getPublicRating(contestantId) {
  return publicRatings[contestantId] || { avg_rating: 0, count: 0 }
}
</script>
