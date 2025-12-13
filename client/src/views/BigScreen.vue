<template>
  <div class="min-h-screen relative overflow-hidden text-white p-6">
    <!-- 流动背景 -->
    <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <!-- 流动光效 -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
        <div class="blob blob-4"></div>
      </div>
      <!-- 网格叠加 -->
      <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
    </div>

    <!-- 粒子容器 -->
    <div class="particles-container absolute inset-0 pointer-events-none z-30 overflow-hidden"></div>

    <!-- 内容层 -->
    <div class="relative z-10">
    <!-- 标题 -->
    <header class="text-center mb-6">
      <h1 class="text-4xl font-bold mb-1">实时评分排行榜</h1>
      <p class="text-blue-300">分数实时更新中...</p>
    </header>

    <!-- 主体内容：左右两列布局 -->
    <div class="max-w-full mx-auto grid grid-cols-12 gap-6" style="height: calc(100vh - 140px);">
      <!-- 左侧：TOP 3 展示 -->
      <div class="col-span-4 flex flex-col gap-4 overflow-hidden">
        <!-- A赛道获奖 -->
        <div class="flex-1 bg-gradient-to-br from-orange-500/20 to-orange-900/10 rounded-2xl p-4 border border-orange-500/30 overflow-hidden">
          <h2 class="text-2xl font-bold text-center text-orange-400 mb-4 flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            A 赛道获奖
          </h2>
          <div class="space-y-3">
            <div
              v-for="(item, index) in topThreeA"
              :key="item.id"
              class="flex items-center gap-3 p-3 rounded-xl transition-all duration-500"
              :class="getTop3BgClass(index, 'A')"
            >
              <!-- 奖项标签 -->
              <div
                :class="[
                  'flex-shrink-0 px-3 py-2 rounded-lg flex items-center justify-center font-bold shadow-lg',
                  getAwardClass(index)
                ]"
              >
                {{ getAwardName(index) }}
              </div>
              <!-- 名称和分数详情 -->
              <div class="flex-1 min-w-0">
                <div class="text-xl font-bold truncate">{{ item.name }}</div>
                <div class="text-xs text-orange-300">
                  专业{{ item.professional_score?.toFixed(1) || 0 }} + 大众{{ item.public_rating_avg?.toFixed(1) || 0 }}
                </div>
              </div>
              <!-- 总分 -->
              <div class="text-right">
                <div class="text-3xl font-bold text-yellow-400">{{ item.total_score.toFixed(2) }}</div>
              </div>
            </div>
            <!-- 空状态 -->
            <div v-if="topThreeA.length === 0" class="text-center py-6 text-orange-300/60">
              <p>暂无评分数据</p>
            </div>
          </div>
        </div>

        <!-- B赛道获奖 -->
        <div class="flex-1 bg-gradient-to-br from-purple-500/20 to-purple-900/10 rounded-2xl p-4 border border-purple-500/30 overflow-hidden">
          <h2 class="text-2xl font-bold text-center text-purple-400 mb-4 flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            B 赛道获奖
          </h2>
          <div class="space-y-3">
            <div
              v-for="(item, index) in topThreeB"
              :key="item.id"
              class="flex items-center gap-3 p-3 rounded-xl transition-all duration-500"
              :class="getTop3BgClass(index, 'B')"
            >
              <!-- 奖项标签 -->
              <div
                :class="[
                  'flex-shrink-0 px-3 py-2 rounded-lg flex items-center justify-center font-bold shadow-lg',
                  getAwardClass(index)
                ]"
              >
                {{ getAwardName(index) }}
              </div>
              <!-- 名称和分数详情 -->
              <div class="flex-1 min-w-0">
                <div class="text-xl font-bold truncate">{{ item.name }}</div>
                <div class="text-xs text-purple-300">
                  专业{{ item.professional_score?.toFixed(1) || 0 }} + 大众{{ item.public_rating_avg?.toFixed(1) || 0 }}
                </div>
              </div>
              <!-- 总分 -->
              <div class="text-right">
                <div class="text-3xl font-bold text-yellow-400">{{ item.total_score.toFixed(2) }}</div>
              </div>
            </div>
            <!-- 空状态 -->
            <div v-if="topThreeB.length === 0" class="text-center py-6 text-purple-300/60">
              <p>暂无评分数据</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：完整排名（A+B赛道混合） -->
      <div class="col-span-8 bg-white/5 rounded-2xl p-5 border border-white/10 overflow-hidden flex flex-col">
        <h2 class="text-2xl font-bold mb-4 text-center">完整排名</h2>

        <!-- 评分者图例 -->
        <div v-if="allJudges.length > 0" class="flex flex-wrap items-center gap-3 mb-3 px-2">
          <span class="text-sm text-blue-300">评分者:</span>
          <div v-for="judge in allJudges" :key="judge.id" class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-gray-500/50"></span>
            <span class="text-xs text-gray-400">{{ judge.name }}</span>
          </div>
          <span class="text-xs text-gray-500 ml-2">(绿色表示已评分)</span>
        </div>

        <!-- 表头 -->
        <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm font-medium text-blue-200 mb-2">
          <div class="col-span-1 text-center">排名</div>
          <div class="col-span-1 text-center">赛道</div>
          <div class="col-span-2">名称</div>
          <div class="col-span-2 text-center">评分状态</div>
          <div class="col-span-2 text-center">专业分</div>
          <div class="col-span-2 text-center">大众点评</div>
          <div class="col-span-2 text-center">总分</div>
        </div>

        <!-- 排名列表 -->
        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <TransitionGroup name="ranking" tag="div">
            <div
              v-for="(item, index) in allContestants"
              :key="item.id"
              class="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/10 items-center transition-all duration-500 relative"
              :class="[
                getRankingClass(index),
                hasScoreChange(item.id) ? 'score-flash' : '',
                getRankChange(item.id) > 0 ? 'rank-up' : '',
                getRankChange(item.id) < 0 ? 'rank-down' : ''
              ]"
            >
              <!-- 排名变化指示器 -->
              <div v-if="getRankChange(item.id) !== 0" class="absolute -left-1 top-1/2 -translate-y-1/2">
                <div v-if="getRankChange(item.id) > 0" class="rank-change-indicator up">
                  <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-xs text-green-400 font-bold">+{{ getRankChange(item.id) }}</span>
                </div>
                <div v-else class="rank-change-indicator down">
                  <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-xs text-red-400 font-bold">{{ getRankChange(item.id) }}</span>
                </div>
              </div>

              <!-- 排名 -->
              <div class="col-span-1 text-center">
                <div
                  :class="[
                    'inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all duration-300',
                    getRankBadgeClass(index),
                    shouldCelebrate(item.id) ? 'celebrate-badge' : ''
                  ]"
                >
                  {{ index + 1 }}
                </div>
              </div>

              <!-- 赛道 -->
              <div class="col-span-1 text-center">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-bold',
                    item.track === 'A' ? 'bg-orange-500/30 text-orange-300' : 'bg-purple-500/30 text-purple-300'
                  ]"
                >
                  {{ item.track }}
                </span>
              </div>

              <!-- 名称 -->
              <div class="col-span-2 font-semibold text-lg truncate" :class="shouldCelebrate(item.id) ? 'celebrate-text' : ''">
                {{ item.name }}
              </div>

              <!-- 评分状态（绿点） -->
              <div class="col-span-2 flex flex-wrap gap-1 justify-center">
                <span
                  v-for="judge in allJudges"
                  :key="judge.id"
                  :class="[
                    'w-3 h-3 rounded-full transition-colors',
                    hasJudgeScored(item, judge.id) ? 'bg-green-500' : 'bg-gray-500/30'
                  ]"
                  :title="judge.name + (hasJudgeScored(item, judge.id) ? ' (已评分)' : ' (未评分)')"
                ></span>
              </div>

              <!-- 专业分 -->
              <div class="col-span-2 text-center">
                <div :class="['text-xl font-bold text-blue-400 transition-all', hasScoreChange(item.id) ? 'score-number-change' : '']">
                  {{ item.professional_score?.toFixed(2) || '0.00' }}
                </div>
              </div>

              <!-- 大众点评 -->
              <div class="col-span-2 text-center">
                <div :class="['text-xl font-bold text-pink-400 transition-all', hasScoreChange(item.id) ? 'score-number-change' : '']">
                  {{ item.public_rating_avg?.toFixed(2) || '0.00' }}
                </div>
                <div class="text-xs text-gray-400">{{ item.public_rating_count || 0 }}人</div>
              </div>

              <!-- 总分 -->
              <div class="col-span-2 text-center">
                <div :class="['text-2xl font-bold text-yellow-400 transition-all', hasScoreChange(item.id) ? 'score-number-change' : '']">
                  {{ item.total_score.toFixed(2) }}
                </div>
              </div>
            </div>
          </TransitionGroup>

          <!-- 空状态 -->
          <div v-if="allContestants.length === 0" class="text-center py-16 text-blue-300">
            <p class="text-lg">暂无评分数据</p>
            <p class="mt-2 text-sm">等待评分者提交评分...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="fixed bottom-4 right-4 z-20 flex items-center gap-3">
      <!-- 音效开关 -->
      <button
        @click="toggleSound"
        class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center gap-2"
        :title="soundEnabled ? '关闭音效' : '开启音效'"
      >
        <svg v-if="soundEnabled" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
        </svg>
      </button>
      <!-- 返回首页 -->
      <router-link
        to="/"
        class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
      >
        返回首页
      </router-link>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import { useScoreStore } from '../stores/score'

const store = useScoreStore()

// 存储上一次的排名和分数，用于检测变化
const previousRankings = reactive({})
const previousScores = reactive({})
const rankChanges = reactive({})      // 排名变化: { id: delta }  正数=上升，负数=下降
const scoreChanges = reactive({})     // 分数变化的选手ID集合
const celebrateIds = reactive(new Set()) // 需要庆祝动画的选手ID

// A赛道前三名
const topThreeA = computed(() => {
  const data = store.rankings['A']
  if (!data || !data.contestants) return []
  return data.contestants.slice(0, 3)
})

// B赛道前三名
const topThreeB = computed(() => {
  const data = store.rankings['B']
  if (!data || !data.contestants) return []
  return data.contestants.slice(0, 3)
})

// 所有选手混合排名（A+B赛道按总分排序）
const allContestants = computed(() => {
  const trackA = store.rankings['A']?.contestants || []
  const trackB = store.rankings['B']?.contestants || []
  const all = [...trackA, ...trackB]
  // 按总分降序排序
  return all.sort((a, b) => b.total_score - a.total_score)
})

// 所有评分者（从任一赛道获取，因为是相同的）
const allJudges = computed(() => {
  return store.rankings['A']?.judges || store.rankings['B']?.judges || []
})

// 监听排名变化
watch(allContestants, (newList, oldList) => {
  if (!oldList || oldList.length === 0) {
    // 初始化
    newList.forEach((item, index) => {
      previousRankings[item.id] = index + 1
      previousScores[item.id] = item.total_score
    })
    return
  }

  // 检测排名和分数变化
  newList.forEach((item, newIndex) => {
    const newRank = newIndex + 1
    const oldRank = previousRankings[item.id]
    const oldScore = previousScores[item.id]

    // 检测排名变化
    if (oldRank !== undefined && oldRank !== newRank) {
      const delta = oldRank - newRank // 正数=上升，负数=下降
      rankChanges[item.id] = delta

      // 如果进入前3，触发庆祝
      if (newRank <= 3 && oldRank > 3) {
        celebrateIds.add(item.id)
        triggerCelebration(item.id)
      } else if (delta > 0) {
        // 排名上升音效
        playRankUpSound()
      } else if (delta < 0) {
        // 排名下降音效
        playRankDownSound()
      }

      // 3秒后清除变化标记
      setTimeout(() => {
        delete rankChanges[item.id]
      }, 3000)
    }

    // 检测分数变化
    if (oldScore !== undefined && oldScore !== item.total_score) {
      scoreChanges[item.id] = true
      // 播放分数更新音效
      playScoreUpdateSound()
      setTimeout(() => {
        delete scoreChanges[item.id]
      }, 2000)
    }

    // 更新记录
    previousRankings[item.id] = newRank
    previousScores[item.id] = item.total_score
  })
}, { deep: true })

// ========== 音效系统 ==========
let audioContext = null
const soundEnabled = ref(true)
let lastSoundTime = { rankUp: 0, rankDown: 0, score: 0 }
const SOUND_DEBOUNCE = 300 // 防抖间隔(ms)

// 初始化音频上下文
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

// 播放音调
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  if (!soundEnabled.value) return

  try {
    const ctx = initAudio()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (e) {
    console.log('Audio not supported')
  }
}

// 排名上升音效 - 上升音阶
function playRankUpSound() {
  if (!soundEnabled.value) return
  const now = Date.now()
  if (now - lastSoundTime.rankUp < SOUND_DEBOUNCE) return
  lastSoundTime.rankUp = now

  const notes = [523, 659, 784] // C5, E5, G5
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.25), i * 100)
  })
}

// 排名下降音效 - 下降音调
function playRankDownSound() {
  if (!soundEnabled.value) return
  const now = Date.now()
  if (now - lastSoundTime.rankDown < SOUND_DEBOUNCE) return
  lastSoundTime.rankDown = now

  const notes = [392, 330, 262] // G4, E4, C4
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, 'triangle', 0.2), i * 80)
  })
}

// 分数更新音效 - 清脆提示音
function playScoreUpdateSound() {
  if (!soundEnabled.value) return
  const now = Date.now()
  if (now - lastSoundTime.score < SOUND_DEBOUNCE) return
  lastSoundTime.score = now

  playTone(880, 0.1, 'sine', 0.15) // A5
  setTimeout(() => playTone(1108, 0.15, 'sine', 0.2), 50) // C#6
}

// 庆祝音效 - 胜利号角
function playCelebrationSound() {
  if (!soundEnabled.value) return
  const melody = [
    { freq: 523, dur: 0.1 },  // C5
    { freq: 659, dur: 0.1 },  // E5
    { freq: 784, dur: 0.1 },  // G5
    { freq: 1047, dur: 0.3 }, // C6
    { freq: 784, dur: 0.1 },  // G5
    { freq: 1047, dur: 0.4 }, // C6
  ]
  let time = 0
  melody.forEach(note => {
    setTimeout(() => playTone(note.freq, note.dur, 'square', 0.2), time)
    time += note.dur * 800
  })
}

// 切换音效开关
function toggleSound() {
  soundEnabled.value = !soundEnabled.value
}

// 触发庆祝动画（粒子效果）
function triggerCelebration(id) {
  // 播放庆祝音效
  playCelebrationSound()

  // 创建粒子
  nextTick(() => {
    createParticles()
  })
  // 3秒后移除庆祝状态
  setTimeout(() => {
    celebrateIds.delete(id)
  }, 3000)
}

// 创建粒子效果
function createParticles() {
  const container = document.querySelector('.particles-container')
  if (!container) return

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    particle.style.left = Math.random() * 100 + '%'
    particle.style.animationDelay = Math.random() * 0.5 + 's'
    particle.style.backgroundColor = ['#fbbf24', '#f97316', '#ec4899', '#8b5cf6', '#3b82f6'][Math.floor(Math.random() * 5)]
    container.appendChild(particle)

    setTimeout(() => {
      particle.remove()
    }, 3000)
  }
}

// 获取排名变化标识
function getRankChange(id) {
  return rankChanges[id] || 0
}

// 检查是否有分数变化
function hasScoreChange(id) {
  return !!scoreChanges[id]
}

// 检查是否需要庆祝
function shouldCelebrate(id) {
  return celebrateIds.has(id)
}

// 检查某个评分者是否已对某个选手评分
function hasJudgeScored(contestant, judgeId) {
  return contestant.scored_judge_ids?.includes(judgeId) || contestant.scored_judge_ids?.includes(String(judgeId))
}

let refreshInterval = null

onMounted(() => {
  // 初始化 Socket 连接
  store.initSocket()

  // 每3秒刷新排名
  refreshInterval = setInterval(() => {
    store.requestRankings()
  }, 3000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

function getTop3BgClass(index, track) {
  const colors = {
    A: ['bg-orange-500/30', 'bg-orange-500/20', 'bg-orange-500/10'],
    B: ['bg-purple-500/30', 'bg-purple-500/20', 'bg-purple-500/10']
  }
  return colors[track][index] || ''
}

function getMedalClass(index) {
  if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900'
  if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800'
  if (index === 2) return 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100'
  return 'bg-white/20 text-white'
}

function getAwardName(index) {
  const awards = ['一等奖', '二等奖', '三等奖']
  return awards[index] || ''
}

function getAwardClass(index) {
  if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
  if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
  if (index === 2) return 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-100'
  return 'bg-white/20 text-white'
}

function getRankingClass(index) {
  if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-transparent'
  if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-transparent'
  if (index === 2) return 'bg-gradient-to-r from-amber-600/20 to-transparent'
  return ''
}

function getRankBadgeClass(index) {
  if (index === 0) return 'bg-yellow-500 text-yellow-900'
  if (index === 1) return 'bg-gray-300 text-gray-700'
  if (index === 2) return 'bg-amber-600 text-amber-100'
  return 'bg-white/20 text-white'
}
</script>

<style scoped>
/* 流动光效球 */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s infinite ease-in-out;
}

.blob-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -200px;
  left: -100px;
  animation-delay: 0s;
}

.blob-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  top: 50%;
  right: -150px;
  animation-delay: -5s;
  animation-duration: 25s;
}

.blob-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  bottom: -100px;
  left: 30%;
  animation-delay: -10s;
  animation-duration: 22s;
}

.blob-4 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  top: 40%;
  left: 10%;
  animation-delay: -15s;
  animation-duration: 28s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  25% {
    transform: translate(50px, -50px) rotate(90deg) scale(1.1);
  }
  50% {
    transform: translate(-30px, 80px) rotate(180deg) scale(0.95);
  }
  75% {
    transform: translate(-60px, -40px) rotate(270deg) scale(1.05);
  }
}

/* 网格背景 */
.bg-grid-pattern {
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* 排名动画 */
.ranking-move {
  transition: transform 0.8s ease;
}

.ranking-enter-active,
.ranking-leave-active {
  transition: all 0.5s ease;
}

.ranking-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.ranking-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* ========== 排名变化动效 ========== */

/* 排名上升效果 */
.rank-up {
  animation: rankUpGlow 2s ease-out;
}

@keyframes rankUpGlow {
  0% {
    background: linear-gradient(90deg, rgba(34, 197, 94, 0.4) 0%, transparent 100%);
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
  }
  100% {
    background: transparent;
    box-shadow: none;
  }
}

/* 排名下降效果 */
.rank-down {
  animation: rankDownGlow 2s ease-out;
}

@keyframes rankDownGlow {
  0% {
    background: linear-gradient(90deg, rgba(239, 68, 68, 0.3) 0%, transparent 100%);
  }
  100% {
    background: transparent;
  }
}

/* 排名变化指示器 */
.rank-change-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: bounceIn 0.5s ease-out;
}

.rank-change-indicator.up {
  animation: floatUp 1s ease-in-out infinite;
}

.rank-change-indicator.down {
  animation: floatDown 1s ease-in-out infinite;
}

@keyframes floatUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes floatDown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* 分数变化闪光效果 */
.score-flash {
  animation: scoreFlash 2s ease-out;
}

@keyframes scoreFlash {
  0% {
    box-shadow: inset 0 0 30px rgba(251, 191, 36, 0.5), 0 0 20px rgba(251, 191, 36, 0.3);
  }
  50% {
    box-shadow: inset 0 0 15px rgba(251, 191, 36, 0.3), 0 0 10px rgba(251, 191, 36, 0.2);
  }
  100% {
    box-shadow: none;
  }
}

/* 分数数字变化动画 */
.score-number-change {
  animation: numberPulse 1s ease-out;
}

@keyframes numberPulse {
  0% {
    transform: scale(1);
    text-shadow: 0 0 10px currentColor;
  }
  25% {
    transform: scale(1.2);
    text-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
  }
  50% {
    transform: scale(1.1);
    text-shadow: 0 0 15px currentColor;
  }
  100% {
    transform: scale(1);
    text-shadow: none;
  }
}

/* 庆祝徽章动画 */
.celebrate-badge {
  animation: celebrateBadge 1s ease-in-out infinite;
}

@keyframes celebrateBadge {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
  }
  25% {
    transform: scale(1.2) rotate(-10deg);
    box-shadow: 0 0 30px rgba(251, 191, 36, 1);
  }
  50% {
    transform: scale(1.1) rotate(10deg);
    box-shadow: 0 0 25px rgba(251, 191, 36, 0.9);
  }
  75% {
    transform: scale(1.15) rotate(-5deg);
    box-shadow: 0 0 28px rgba(251, 191, 36, 0.95);
  }
}

/* 庆祝文字动画 */
.celebrate-text {
  animation: celebrateText 0.5s ease-in-out infinite alternate;
  background: linear-gradient(90deg, #fbbf24, #f97316, #ec4899, #8b5cf6, #3b82f6);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbowText 2s linear infinite, celebrateText 0.3s ease-in-out infinite alternate;
}

@keyframes celebrateText {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

@keyframes rainbowText {
  to { background-position: 200% center; }
}

/* 粒子效果 */
.particle {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: particleFall 2.5s ease-out forwards;
  pointer-events: none;
}

@keyframes particleFall {
  0% {
    top: -10px;
    opacity: 1;
    transform: translateX(0) rotate(0deg);
  }
  100% {
    top: 100%;
    opacity: 0;
    transform: translateX(calc(-50px + 100px * var(--random, 0.5))) rotate(720deg);
  }
}

/* 为每个粒子添加随机性 */
.particle:nth-child(odd) {
  animation-duration: 2s;
}

.particle:nth-child(3n) {
  width: 8px;
  height: 8px;
  animation-duration: 2.8s;
}

.particle:nth-child(5n) {
  width: 12px;
  height: 12px;
  animation-duration: 3s;
}

/* 闪烁星星效果 */
.particle::after {
  content: '✦';
  position: absolute;
  font-size: 14px;
  color: inherit;
  animation: twinkle 0.5s ease-in-out infinite alternate;
}

@keyframes twinkle {
  from { opacity: 0.5; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.2); }
}
</style>
