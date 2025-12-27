import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

export const useScoreStore = defineStore('score', () => {
  const socket = ref(null)
  const rankings = ref({ A: { contestants: [], dimensions: [] }, B: { contestants: [], dimensions: [] } })
  const contestants = ref([])
  const dimensions = ref([])
  const judges = ref([])
  const tracks = ref([])
  const scoreConfig = ref({
    professional_weight: 70,
    public_weight: 30,
    default_max_score: 5,
    show_public_vote_realtime: 1,
    ai_scoring_enabled: 0,
    ai_role_prompt: '',
    deepseek_api_key: '',
    countdown_minutes: 0
  })
  const publicVoteActivities = ref([]) // 实时大众投票记录
  const MAX_VOTE_ACTIVITIES = 10 // 最多保留10条记录
  const currentJudge = ref(null)
  const onlineStatus = ref({ judges: [], publicVoterCount: 0 })
  const aiScoreActivities = ref([]) // AI 评分记录
  const MAX_AI_SCORE_ACTIVITIES = 10 // 最多保留10条 AI 评分记录

  // 初始化 Socket 连接
  function initSocket() {
    if (socket.value) return

    const socketUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : `http://${window.location.hostname}:3000`

    socket.value = io(socketUrl)

    socket.value.on('connect', () => {
      console.log('Socket connected')
      socket.value.emit('getRankings')
      socket.value.emit('getOnlineStatus')

      // 如果已登录，报告评委上线
      if (currentJudge.value) {
        socket.value.emit('judgeOnline', {
          id: currentJudge.value.id,
          name: currentJudge.value.name
        })
      }
    })

    socket.value.on('rankings', (data) => {
      rankings.value = data
    })

    socket.value.on('onlineStatus', (data) => {
      onlineStatus.value = data
    })

    // 监听实时大众投票
    socket.value.on('publicVoteActivity', (data) => {
      publicVoteActivities.value.unshift(data)
      // 只保留最新的N条
      if (publicVoteActivities.value.length > MAX_VOTE_ACTIVITIES) {
        publicVoteActivities.value.pop()
      }
    })

    // 监听 AI 评分更新
    socket.value.on('aiScoreUpdate', (data) => {
      aiScoreActivities.value.unshift(data)
      // 只保留最新的N条
      if (aiScoreActivities.value.length > MAX_AI_SCORE_ACTIVITIES) {
        aiScoreActivities.value.pop()
      }
    })
  }

  // 报告评委上线
  function reportJudgeOnline() {
    if (socket.value && currentJudge.value) {
      socket.value.emit('judgeOnline', {
        id: currentJudge.value.id,
        name: currentJudge.value.name
      })
    }
  }

  // 报告评委下线
  function reportJudgeOffline() {
    if (socket.value) {
      socket.value.emit('judgeOffline')
    }
  }

  // 获取排名数据
  function requestRankings() {
    if (socket.value) {
      socket.value.emit('getRankings')
    }
  }

  // 通知评分更新
  function notifyScoreUpdate() {
    if (socket.value) {
      socket.value.emit('scoreUpdated')
    }
  }

  // 获取所有被评分者
  async function fetchContestants() {
    const res = await axios.get('/api/contestants')
    contestants.value = res.data
  }

  // 获取所有评分维度
  async function fetchDimensions() {
    const res = await axios.get('/api/dimensions')
    dimensions.value = res.data
  }

  // 获取所有评分者
  async function fetchJudges() {
    const res = await axios.get('/api/judges')
    judges.value = res.data
  }

  // 获取所有赛道
  async function fetchTracks() {
    const res = await axios.get('/api/tracks')
    tracks.value = res.data
  }

  // 获取评分配置
  async function fetchScoreConfig() {
    const res = await axios.get('/api/config')
    scoreConfig.value = res.data
  }

  // 更新评分配置
  async function updateScoreConfig(config) {
    await axios.put('/api/config', config)
    scoreConfig.value = config
  }

  // 验证密钥
  async function verifyKey(secretKey) {
    const res = await axios.post('/api/judges/verify', { secretKey })
    if (res.data.valid) {
      currentJudge.value = res.data.judge
      localStorage.setItem('judgeKey', secretKey)
      return true
    }
    return false
  }

  // 从 localStorage 恢复登录状态
  async function restoreLogin() {
    const savedKey = localStorage.getItem('judgeKey')
    if (savedKey) {
      return await verifyKey(savedKey)
    }
    return false
  }

  // 退出登录
  function logout() {
    reportJudgeOffline()
    currentJudge.value = null
    localStorage.removeItem('judgeKey')
  }

  // 提交评分
  async function submitScore(contestantId, scores) {
    await axios.post('/api/scores', {
      judge_id: currentJudge.value.id,
      contestant_id: contestantId,
      scores
    })
    notifyScoreUpdate()
  }

  // 获取我对某个被评分者的评分
  async function getMyScores(contestantId) {
    if (!currentJudge.value) return []
    const res = await axios.get(`/api/scores/judge/${currentJudge.value.id}/contestant/${contestantId}`)
    return res.data
  }

  // 提交 AI 评分
  async function submitAIScore(contestantId, speechText, track) {
    const res = await axios.post('/api/ai-scores/evaluate', {
      contestant_id: contestantId,
      speech_text: speechText,
      track
    })
    return res.data
  }

  // 获取最新的 AI 评分记录
  async function fetchLatestAIScores(limit = 10) {
    const res = await axios.get(`/api/ai-scores/latest?limit=${limit}`)
    aiScoreActivities.value = res.data
    return res.data
  }

  return {
    socket,
    rankings,
    contestants,
    dimensions,
    judges,
    tracks,
    scoreConfig,
    publicVoteActivities,
    currentJudge,
    onlineStatus,
    aiScoreActivities,
    initSocket,
    requestRankings,
    notifyScoreUpdate,
    fetchContestants,
    fetchDimensions,
    fetchJudges,
    fetchTracks,
    fetchScoreConfig,
    updateScoreConfig,
    verifyKey,
    restoreLogin,
    logout,
    submitScore,
    getMyScores,
    reportJudgeOnline,
    reportJudgeOffline,
    submitAIScore,
    fetchLatestAIScores
  }
})
