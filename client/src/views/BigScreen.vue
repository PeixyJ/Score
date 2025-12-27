<template>
  <div class="min-h-screen relative overflow-hidden text-white p-6">
    <!-- 倒计时紧急红光效果 -->
    <Transition name="urgent-glow">
      <div
        v-if="isCountdownUrgent"
        class="absolute inset-0 z-20 pointer-events-none urgent-red-glow"
      ></div>
    </Transition>

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

    <!-- 实时语音识别展示层 -->
    <Transition name="speech-overlay">
      <div
        v-if="isRecording || (speechText && showSpeechOverlay)"
        class="fixed inset-x-0 bottom-0 z-40 flex items-end justify-center pointer-events-none pb-6"
      >
        <!-- 语音识别内容区域 -->
        <div class="relative w-full max-w-5xl mx-8 pointer-events-auto">
          <!-- 顶部状态栏 -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <!-- 录音状态指示器 -->
              <div v-if="isRecording && recognitionStatus === 'connected'" class="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/50">
                <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span class="text-green-400 font-medium">正在识别语音...</span>
              </div>
              <div v-else-if="isRecording && recognitionStatus === 'connecting'" class="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/50">
                <svg class="w-4 h-4 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span class="text-yellow-400 font-medium">连接中...</span>
              </div>
              <div v-else-if="isRecording && recognitionStatus === 'error'" class="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-full border border-red-500/50">
                <span class="w-3 h-3 bg-red-500 rounded-full"></span>
                <span class="text-red-400 font-medium">连接错误，重试中...</span>
              </div>
              <div v-else class="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/50">
                <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                </svg>
                <span class="text-purple-400 font-medium">语音识别完成</span>
              </div>

              <!-- 当前被评分者 -->
              <div v-if="currentContestantName" class="px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/50">
                <span class="text-blue-400">被评分者：</span>
                <span class="text-white font-bold">{{ currentContestantName }}</span>
              </div>
            </div>

            <!-- 关闭按钮（始终显示） -->
            <button
              @click="closeSpeechOverlayAndStop"
              class="p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-full transition-colors pointer-events-auto"
              title="关闭并停止识别"
            >
              <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- 语音识别文字展示区域 -->
          <div class="bg-slate-900/90 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
            <!-- 渐变顶边 -->
            <div class="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>

            <!-- 文字内容 -->
            <div ref="speechTextContainer" class="p-8 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
              <p
                v-if="speechText || interimText"
                class="text-2xl leading-relaxed text-white speech-text-animate"
              >
                <!-- 已确认的文字 -->
                <span>{{ speechText }}</span>
                <!-- 正在识别的临时文字（灰色显示） -->
                <span v-if="interimText" class="text-purple-300/70">{{ interimText }}</span>
                <!-- 闪烁光标 -->
                <span v-if="isRecording" class="inline-block w-0.5 h-7 bg-purple-400 animate-blink ml-1"></span>
              </p>
              <p v-else class="text-2xl text-gray-500 text-center py-8">
                <span v-if="isRecording" class="flex items-center justify-center gap-3">
                  <svg class="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                  等待语音输入...
                </span>
              </p>
            </div>

            <!-- 底部操作栏 -->
            <div class="px-8 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="text-sm text-gray-400">
                  已识别 {{ speechText.length + interimText.length }} 个字符
                  <span v-if="interimText" class="text-purple-400 ml-2">(识别中...)</span>
                </div>
                <button
                  v-if="speechText"
                  @click="clearSpeechText"
                  class="px-3 py-1.5 bg-gray-500/30 hover:bg-gray-500/50 text-gray-300 text-sm rounded-lg transition-colors"
                >
                  清空
                </button>
              </div>
              <div class="flex items-center gap-3">
                <!-- AI 评价按钮 - 主要操作 -->
                <button
                  v-if="speechText && !aiScoring"
                  @click="submitAIScoreFromOverlay"
                  class="px-8 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-purple-500/40 flex items-center gap-2 animate-pulse-subtle"
                >
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                  </svg>
                  AI 评价
                </button>
                <div v-if="aiScoring" class="flex items-center gap-3 px-6 py-3 bg-purple-500/20 rounded-xl border border-purple-500/50">
                  <svg class="w-6 h-6 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-purple-300 font-medium">AI 正在评价中...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 声波动画（录音时显示） -->
          <div v-if="isRecording" class="flex justify-center items-end mt-4 gap-1 h-10">
            <div v-for="i in 12" :key="i" class="sound-wave-bar" :style="{ animationDelay: `${i * 0.1}s` }"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- AI 评分结果弹窗 -->
    <Transition name="ai-result-modal">
      <div
        v-if="showAIResultModal && aiResult"
        class="fixed inset-0 z-50 flex items-center justify-center p-8"
      >
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeAIResultModal"></div>

        <!-- 弹窗内容 -->
        <div class="relative bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 w-full max-w-2xl overflow-hidden ai-result-card">
          <!-- 顶部装饰条 -->
          <div class="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>

          <!-- 头部 -->
          <div class="px-8 py-6 border-b border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-white">AI 评价结果</h2>
                <p class="text-purple-300">{{ aiResult.contestant_name }}</p>
              </div>
            </div>
            <button
              @click="closeAIResultModal"
              class="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- 分数展示 -->
          <div class="px-8 py-8 flex justify-center">
            <div class="relative">
              <!-- 光晕效果 -->
              <div class="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full scale-150"></div>
              <!-- 分数圆环 -->
              <div class="relative w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-4 border-purple-500/50 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 score-number">
                    {{ aiResult.score }}
                  </div>
                  <div class="text-purple-300 text-lg">分</div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI 评价内容 -->
          <div class="px-8 pb-8">
            <div class="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 class="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                AI 评语
              </h3>
              <p class="text-white leading-relaxed text-lg">{{ aiResult.feedback || '暂无评语' }}</p>
            </div>

            <!-- 维度评分（如果有） -->
            <div v-if="aiResult.dimension_scores" class="mt-4 bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 class="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                维度评分
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="(score, name) in (typeof aiResult.dimension_scores === 'string' ? JSON.parse(aiResult.dimension_scores) : aiResult.dimension_scores)"
                  :key="name"
                  class="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <span class="text-gray-300">{{ name }}</span>
                  <span class="text-purple-400 font-bold">{{ score }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="px-8 py-6 border-t border-white/10 flex justify-center">
            <button
              @click="closeAIResultModal"
              class="px-10 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-purple-500/30"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 内容层 -->
    <div class="relative z-10">
    <!-- 标题栏 -->
    <header class="flex items-center justify-between mb-4 px-4">
      <!-- 左侧占位 -->
      <div class="w-72"></div>

      <!-- 中间标题 -->
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-1">实时评分排行榜</h1>
        <p class="text-blue-300">分数实时更新中...</p>
      </div>

      <!-- 右侧倒计时器 -->
      <div class="w-72 flex justify-end">
        <div v-if="store.scoreConfig.countdown_minutes > 0" class="bg-white/10 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-3 border border-white/20">
          <!-- 进度环 -->
          <div class="relative w-14 h-14">
            <svg class="w-14 h-14 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="8"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                :stroke="countdownSeconds <= 60 ? '#ef4444' : countdownSeconds <= 180 ? '#f59e0b' : '#10b981'"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="264"
                :stroke-dashoffset="264 - (264 * (100 - countdownProgress) / 100)"
                class="transition-all duration-1000"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span
                :class="[
                  'text-sm font-mono font-bold',
                  countdownSeconds <= 60 ? 'text-red-400' : countdownSeconds <= 180 ? 'text-yellow-400' : 'text-green-400'
                ]"
              >
                {{ formattedCountdown }}
              </span>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="flex items-center gap-1">
            <button
              v-if="!isCountdownRunning"
              @click="startCountdown"
              :disabled="countdownSeconds <= 0 && !isCountdownPaused"
              class="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              title="开始"
            >
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <button
              v-else
              @click="pauseCountdown"
              class="w-8 h-8 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors"
              title="暂停"
            >
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
            <button
              @click="resetCountdown"
              class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              title="重置"
            >
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 在线状态面板 -->
    <div class="flex justify-center items-center gap-6 mb-4">
      <!-- 评委在线状态 -->
      <div class="bg-white/10 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-3">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-sm text-gray-300">评委在线:</span>
        </div>
        <div class="flex items-center gap-2">
          <template v-if="store.onlineStatus.judges.length > 0">
            <span
              v-for="judge in store.onlineStatus.judges"
              :key="judge.id"
              class="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30"
            >
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {{ judge.name }}
            </span>
          </template>
          <span v-else class="text-gray-500 text-sm">暂无</span>
        </div>
      </div>

      <!-- 大众评委在线数 -->
      <div class="bg-white/10 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-3">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <span class="text-sm text-gray-300">大众评委:</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            :class="[
              'inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full font-bold',
              store.onlineStatus.publicVoterCount > 0
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : 'bg-gray-500/20 text-gray-500'
            ]"
          >
            <span v-if="store.onlineStatus.publicVoterCount > 0" class="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
            {{ store.onlineStatus.publicVoterCount }} 人在线
          </span>
        </div>
      </div>
    </div>

    <!-- 主体内容：左右两列布局 -->
    <div class="max-w-full mx-auto grid grid-cols-12 gap-6" style="height: calc(100vh - 200px);">
      <!-- 左侧：赛道获奖 + 实时投票 -->
      <div class="col-span-3 flex flex-col h-full">
        <!-- 赛道获奖区域 -->
        <div class="bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col" style="height: 340px;">
          <!-- 赛道选择按钮 + 标题 -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              赛道获奖
            </h2>
            <div class="flex items-center gap-1">
              <button
                v-for="(track, index) in allTracks"
                :key="track.name"
                @click="selectTrack(index)"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium transition-all duration-300',
                  currentTrackIndex === index
                    ? `bg-${track.color}-500 text-white`
                    : `bg-white/10 text-gray-400 hover:bg-white/20`
                ]"
              >
                {{ track.display_name }}
              </button>
            </div>
          </div>

          <!-- 轮播容器 -->
          <div class="flex-1 relative overflow-hidden">
            <TransitionGroup name="carousel" tag="div" class="h-full">
              <div
                v-for="(track, index) in allTracks"
                v-show="currentTrackIndex === index"
                :key="track.name"
                :class="[
                  'absolute inset-0 p-4',
                  `bg-gradient-to-br from-${track.color}-500/10 to-transparent`
                ]"
              >
                <div class="space-y-3">
                  <div
                    v-for="(item, idx) in getTopThree(track.name)"
                    :key="item.id"
                    class="flex items-center gap-3 p-3 rounded-xl transition-all duration-500"
                    :class="getTop3BgClass(idx, track.color)"
                  >
                    <!-- 奖项标签 -->
                    <div
                      :class="[
                        'flex-shrink-0 w-16 py-1.5 rounded-lg text-center font-bold shadow-lg text-sm',
                        getAwardClass(idx)
                      ]"
                    >
                      {{ getAwardName(idx) }}
                    </div>
                    <!-- 名称和分数详情 -->
                    <div class="flex-1 min-w-0">
                      <div class="text-lg font-bold truncate">{{ item.name }}</div>
                      <div :class="['text-xs', `text-${track.color}-300`]">
                        专业{{ item.professional_contribution?.toFixed(1) || 0 }} + 大众{{ item.public_contribution?.toFixed(1) || 0 }}
                      </div>
                    </div>
                    <!-- 总分 -->
                    <div class="text-2xl font-bold text-yellow-400">{{ item.total_score.toFixed(2) }}</div>
                  </div>
                  <!-- 空状态 -->
                  <div v-if="getTopThree(track.name).length === 0" :class="['text-center py-8', `text-${track.color}-300/60`]">
                    <p>暂无评分数据</p>
                  </div>
                </div>
              </div>
            </TransitionGroup>

            <!-- 左右切换按钮 -->
            <button
              v-if="allTracks.length > 1"
              @click="prevTrack"
              class="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all z-10"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <button
              v-if="allTracks.length > 1"
              @click="nextTrack"
              class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all z-10"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          <!-- 底部：轮播指示器 + 自动轮播控制 -->
          <div class="flex items-center justify-between px-4 py-2 border-t border-white/10">
            <div class="flex items-center gap-1">
              <button
                v-for="(track, i) in allTracks"
                :key="track.name"
                @click="selectTrack(i)"
                :class="[
                  'w-2 h-2 rounded-full transition-all duration-300',
                  currentTrackIndex === i
                    ? `bg-${allTracks[currentTrackIndex]?.color || 'blue'}-400 w-5`
                    : 'bg-white/30 hover:bg-white/50'
                ]"
              ></button>
            </div>
            <button
              @click="toggleAutoPlay"
              :class="[
                'px-2 py-1 rounded text-xs transition-all flex items-center gap-1',
                autoPlayEnabled
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/10 text-gray-400'
              ]"
            >
              <svg v-if="autoPlayEnabled" class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
              <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              {{ autoPlayEnabled ? '暂停' : '播放' }}
            </button>
          </div>
        </div>

        <!-- 右下角面板：大众投票 / AI 评分 切换 -->
        <div class="flex-1 mt-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <!-- 切换标签 -->
          <div class="flex items-center border-b border-white/10">
            <button
              v-if="store.scoreConfig.show_public_vote_realtime"
              @click="rightPanelMode = 'public'"
              :class="[
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-colors',
                rightPanelMode === 'public' ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:text-white'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span class="text-sm font-medium">大众投票</span>
            </button>
            <button
              v-if="store.scoreConfig.ai_scoring_enabled"
              @click="rightPanelMode = 'ai'"
              :class="[
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-colors',
                rightPanelMode === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
              ]"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-4 9a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2zm-4 4a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              <span class="text-sm font-medium">AI 评分</span>
            </button>
          </div>

          <!-- 大众投票面板 -->
          <div v-if="rightPanelMode === 'public'" class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            <TransitionGroup name="vote-activity" tag="div" class="space-y-2">
              <div
                v-for="activity in store.publicVoteActivities"
                :key="activity.timestamp"
                class="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
              >
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-gray-400 text-xs">{{ activity.voterId }}</span>
                  <span class="text-pink-400">→</span>
                  <span class="text-white font-medium">{{ activity.contestantName }}</span>
                </div>
                <div class="flex items-center text-yellow-400 text-sm">
                  {{ '★'.repeat(activity.rating) }}<span class="text-gray-600">{{ '☆'.repeat(5 - activity.rating) }}</span>
                </div>
              </div>
            </TransitionGroup>
            <div v-if="store.publicVoteActivities.length === 0" class="flex-1 flex items-center justify-center text-gray-500 text-sm py-8">
              等待投票中...
            </div>
          </div>

          <!-- AI 评分面板 -->
          <div v-else-if="rightPanelMode === 'ai'" class="flex-1 flex flex-col overflow-hidden">
            <!-- 语音识别控制 -->
            <div class="p-3 border-b border-white/10">
              <!-- 选择被评分者 -->
              <div class="mb-3">
                <label class="text-xs text-gray-400 mb-1 block">选择被评分者</label>
                <select
                  v-model="aiSelectedContestant"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" disabled>请选择...</option>
                  <option v-for="c in store.contestants" :key="c.id" :value="c.id">
                    {{ c.name }} ({{ c.track }}赛道)
                  </option>
                </select>
              </div>

              <!-- 语音识别状态 -->
              <div class="flex items-center gap-2">
                <button
                  @click="toggleSpeechRecognition"
                  :disabled="!aiSelectedContestant"
                  :class="[
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : aiSelectedContestant
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                  ]"
                >
                  <svg v-if="isRecording" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                  {{ isRecording ? '停止录音' : '开始语音识别' }}
                </button>
                <button
                  v-if="speechText && !isRecording && !aiScoring"
                  @click="submitAIScore"
                  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  AI 评分
                </button>
              </div>

              <!-- 语音识别文本 -->
              <div v-if="speechText || isRecording" class="mt-3 p-3 bg-black/30 rounded-lg max-h-24 overflow-y-auto">
                <p class="text-xs text-gray-400 mb-1">识别文本：</p>
                <p class="text-sm text-white">{{ speechText || '正在识别...' }}</p>
              </div>

              <!-- AI 评分中 -->
              <div v-if="aiScoring" class="mt-3 flex items-center justify-center gap-2 text-purple-400">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-sm">AI 正在评分...</span>
              </div>
            </div>

            <!-- AI 评分记录列表 -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              <TransitionGroup name="vote-activity" tag="div" class="space-y-2">
                <div
                  v-for="score in store.aiScoreActivities"
                  :key="score.id"
                  class="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-white font-medium">{{ score.contestant_name }}</span>
                    <span class="text-xl font-bold text-purple-400">{{ score.score }}分</span>
                  </div>
                  <p class="text-xs text-gray-400 mb-2">{{ score.feedback }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ score.speech_text }}</p>
                </div>
              </TransitionGroup>
              <div v-if="store.aiScoreActivities.length === 0" class="flex-1 flex items-center justify-center text-gray-500 text-sm py-8">
                暂无 AI 评分记录
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：完整排名 -->
      <div class="col-span-9 bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            完整排名
          </h2>
          <!-- 评分者图例 -->
          <div v-if="allJudges.length > 0" class="flex items-center gap-2">
            <span class="text-xs text-gray-400">评分者:</span>
            <div v-for="judge in allJudges" :key="judge.id" class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-gray-500/50"></span>
              <span class="text-xs text-gray-500">{{ judge.name }}</span>
            </div>
            <span class="text-xs text-gray-600">(绿色=已评)</span>
          </div>
        </div>

        <!-- 表头 -->
        <div class="grid grid-cols-12 gap-2 mx-4 my-2 px-4 py-2 bg-white/10 rounded-lg text-sm font-medium text-blue-200">
          <div class="col-span-1 text-center">排名</div>
          <div class="col-span-1 text-center">赛道</div>
          <div class="col-span-2">名称</div>
          <div class="col-span-2 text-center">评分状态</div>
          <div class="col-span-2 text-center">专业分</div>
          <div class="col-span-2 text-center">大众点评</div>
          <div class="col-span-2 text-center">总分</div>
        </div>

        <!-- 排名列表 -->
        <div class="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <TransitionGroup name="ranking" tag="div">
            <div
              v-for="(item, index) in allContestants"
              :key="item.id"
              class="grid grid-cols-12 gap-2 px-4 py-2 border-b border-white/10 items-center transition-all duration-500 relative"
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
                    `bg-${getTrackInfo(item.track).color}-500/30 text-${getTrackInfo(item.track).color}-300`
                  ]"
                >
                  {{ item.track }}
                </span>
              </div>

              <!-- 名称 -->
              <div class="col-span-2 font-semibold truncate" :class="shouldCelebrate(item.id) ? 'celebrate-text' : ''">
                {{ item.name }}
              </div>

              <!-- 评分状态（绿点） -->
              <div class="col-span-2 flex flex-wrap gap-1 justify-center">
                <span
                  v-for="judge in allJudges"
                  :key="judge.id"
                  :class="[
                    'w-2.5 h-2.5 rounded-full transition-colors',
                    hasJudgeScored(item, judge.id) ? 'bg-green-500' : 'bg-gray-500/30'
                  ]"
                  :title="judge.name + (hasJudgeScored(item, judge.id) ? ' (已评分)' : ' (未评分)')"
                ></span>
              </div>

              <!-- 专业分（折算后） -->
              <div class="col-span-2 text-center">
                <div :class="['text-lg font-bold text-blue-400 transition-all', hasScoreChange(item.id) ? 'score-number-change' : '']">
                  {{ item.professional_contribution?.toFixed(2) || '0.00' }}
                </div>
                <div class="text-xs text-gray-500">/ {{ item.config?.professional_weight || 70 }}</div>
              </div>

              <!-- 大众点评（折算后） -->
              <div class="col-span-2 text-center">
                <div :class="['text-lg font-bold text-pink-400 transition-all', hasScoreChange(item.id) ? 'score-number-change' : '']">
                  {{ item.public_contribution?.toFixed(2) || '0.00' }}
                </div>
                <div class="text-xs text-gray-500">{{ item.public_rating_count || 0 }}人 / {{ item.config?.public_weight || 30 }}</div>
              </div>

              <!-- 总分 -->
              <div class="col-span-2 text-center">
                <div :class="['text-xl font-bold text-yellow-400 transition-all', hasScoreChange(item.id) ? 'score-number-change' : '']">
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

// 轮播状态
const currentTrackIndex = ref(0)
const autoPlayEnabled = ref(true)
let autoPlayInterval = null
const AUTO_PLAY_DELAY = 5000 // 5秒自动切换

// 倒计时状态
const countdownSeconds = ref(0)
const isCountdownRunning = ref(false)
const isCountdownPaused = ref(false)
let countdownInterval = null

// 右侧面板模式：'public' | 'ai'
const rightPanelMode = ref('public')

// AI 评分相关状态
const aiSelectedContestant = ref('')
const isRecording = ref(false)
const speechText = ref('')
const interimText = ref('') // 临时识别结果（实时显示）
const aiScoring = ref(false)
const showSpeechOverlay = ref(false)
const recognitionStatus = ref('idle') // idle | connecting | connected | error
const showAIResultModal = ref(false) // AI评分结果弹窗
const aiResult = ref(null) // AI评分结果数据
const speechTextContainer = ref(null) // 语音文本容器引用
let recognition = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
let reconnectTimer = null
let lastActivityTime = 0
let activityCheckTimer = null

// 当前被评分者名称
const currentContestantName = computed(() => {
  if (!aiSelectedContestant.value) return ''
  const contestant = store.contestants.find(c => c.id === aiSelectedContestant.value)
  return contestant?.name || ''
})

// 监听语音文本变化，自动滚动到底部
watch([speechText, interimText], () => {
  nextTick(() => {
    if (speechTextContainer.value) {
      speechTextContainer.value.scrollTo({
        top: speechTextContainer.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
})

// 初始化语音识别
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('浏览器不支持 Web Speech API')
    return null
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const rec = new SpeechRecognition()

  rec.lang = 'zh-CN'
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1

  rec.onstart = () => {
    console.log('语音识别已启动')
    recognitionStatus.value = 'connected'
    reconnectAttempts = 0
    lastActivityTime = Date.now()
  }

  rec.onaudiostart = () => {
    console.log('音频捕获开始')
    lastActivityTime = Date.now()
  }

  rec.onresult = (event) => {
    lastActivityTime = Date.now()
    let finalTranscript = ''
    let currentInterim = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        currentInterim += transcript
      }
    }

    // 实时显示临时结果
    interimText.value = currentInterim

    // 确认的文字追加到正式文本
    if (finalTranscript) {
      speechText.value += finalTranscript
      interimText.value = '' // 清空临时文本
    }
  }

  rec.onerror = (event) => {
    console.error('语音识别错误:', event.error)
    lastActivityTime = Date.now()

    switch (event.error) {
      case 'no-speech':
        // 无语音输入，这是正常的，不需要处理
        console.log('未检测到语音，继续监听...')
        return
      case 'audio-capture':
        recognitionStatus.value = 'error'
        console.error('无法捕获音频，请检查麦克风权限')
        break
      case 'not-allowed':
        recognitionStatus.value = 'error'
        console.error('麦克风权限被拒绝')
        isRecording.value = false
        return
      case 'network':
        recognitionStatus.value = 'error'
        console.log('网络错误，将尝试重连...')
        break
      case 'aborted':
        console.log('识别被中止')
        break
      default:
        recognitionStatus.value = 'error'
        console.log('其他错误:', event.error)
    }
  }

  rec.onend = () => {
    console.log('语音识别结束')

    // 如果还在录音状态，自动重启
    if (isRecording.value) {
      attemptReconnect()
    } else {
      recognitionStatus.value = 'idle'
    }
  }

  return rec
}

// 尝试重新连接
function attemptReconnect() {
  if (!isRecording.value) {
    recognitionStatus.value = 'idle'
    return
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('达到最大重连次数，停止识别')
    recognitionStatus.value = 'error'
    isRecording.value = false
    return
  }

  reconnectAttempts++
  recognitionStatus.value = 'connecting'
  console.log(`尝试重连... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)

  // 清除之前的定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }

  // 延迟重连，避免频繁重启
  const delay = Math.min(500 * reconnectAttempts, 3000)
  reconnectTimer = setTimeout(() => {
    if (!isRecording.value) return

    try {
      if (recognition) {
        recognition.start()
      }
    } catch (e) {
      console.error('重启语音识别失败:', e)
      // 如果启动失败，继续尝试
      attemptReconnect()
    }
  }, delay)
}

// 启动活动检查（防止识别静默停止）
function startActivityCheck() {
  stopActivityCheck()
  lastActivityTime = Date.now()

  activityCheckTimer = setInterval(() => {
    if (!isRecording.value) {
      stopActivityCheck()
      return
    }

    const now = Date.now()
    const inactiveTime = now - lastActivityTime

    // 如果超过 30 秒没有活动，尝试重启
    if (inactiveTime > 30000 && recognitionStatus.value === 'connected') {
      console.log('长时间无活动，尝试重启识别...')
      try {
        recognition?.stop()
      } catch (e) {
        // 忽略错误
      }
    }
  }, 5000)
}

// 停止活动检查
function stopActivityCheck() {
  if (activityCheckTimer) {
    clearInterval(activityCheckTimer)
    activityCheckTimer = null
  }
}

// 切换语音识别
function toggleSpeechRecognition() {
  if (!aiSelectedContestant.value) return

  if (isRecording.value) {
    // 停止录音
    stopActivityCheck()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (recognition) {
      try {
        recognition.stop()
      } catch (e) {
        // 忽略错误
      }
    }
    isRecording.value = false
    recognitionStatus.value = 'idle'
    // 保持展示层显示，等待用户操作
    showSpeechOverlay.value = true
  } else {
    // 开始录音
    speechText.value = ''
    interimText.value = ''
    showSpeechOverlay.value = true
    reconnectAttempts = 0
    recognitionStatus.value = 'connecting'

    if (!recognition) {
      recognition = initSpeechRecognition()
    }
    if (recognition) {
      try {
        recognition.start()
        isRecording.value = true
        startActivityCheck()
      } catch (e) {
        console.error('启动语音识别失败:', e)
        recognitionStatus.value = 'error'
        showSpeechOverlay.value = false
      }
    } else {
      alert('您的浏览器不支持语音识别，请使用 Chrome 浏览器')
      showSpeechOverlay.value = false
    }
  }
}

// 关闭语音识别展示层
function closeSpeechOverlay() {
  showSpeechOverlay.value = false
  speechText.value = ''
  interimText.value = ''
}

// 关闭并停止语音识别
function closeSpeechOverlayAndStop() {
  stopActivityCheck()
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (recognition && isRecording.value) {
    try {
      recognition.stop()
    } catch (e) {
      // 忽略错误
    }
  }
  isRecording.value = false
  recognitionStatus.value = 'idle'
  showSpeechOverlay.value = false
  speechText.value = ''
  interimText.value = ''
  reconnectAttempts = 0
}

// 清空语音文本
function clearSpeechText() {
  speechText.value = ''
  interimText.value = ''
}

// 从展示层提交 AI 评分
async function submitAIScoreFromOverlay() {
  if (!aiSelectedContestant.value || !speechText.value.trim()) return

  // 暂停语音识别
  if (isRecording.value) {
    pauseRecognition()
  }

  aiScoring.value = true

  try {
    const contestant = store.contestants.find(c => c.id === aiSelectedContestant.value)
    const response = await store.submitAIScore(
      aiSelectedContestant.value,
      speechText.value,
      contestant?.track || 'A'
    )

    // API返回 { success: true, data: scoreData }，从 data 中获取结果
    const result = response.data || response

    // 保存结果并显示结果弹窗
    aiResult.value = {
      score: result.score,
      feedback: result.feedback,
      dimension_scores: result.dimension_scores,
      contestant_name: result.contestant_name || contestant?.name || '未知',
      speech_text: speechText.value
    }
    showAIResultModal.value = true

    // 清空语音文本
    speechText.value = ''
    interimText.value = ''
  } catch (err) {
    console.error('AI 评分失败:', err)
    alert('AI 评分失败: ' + (err.response?.data?.error || err.message))
  } finally {
    aiScoring.value = false
  }
}

// 暂停语音识别（不关闭弹窗）
function pauseRecognition() {
  stopActivityCheck()
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (recognition) {
    try {
      recognition.stop()
    } catch (e) {
      // 忽略错误
    }
  }
  isRecording.value = false
  recognitionStatus.value = 'idle'
}

// 关闭AI结果弹窗
function closeAIResultModal() {
  showAIResultModal.value = false
  aiResult.value = null
  // 同时关闭语音识别弹窗
  showSpeechOverlay.value = false
}

// 提交 AI 评分（从右侧面板）
async function submitAIScore() {
  if (!aiSelectedContestant.value || !speechText.value.trim()) return

  aiScoring.value = true

  try {
    const contestant = store.contestants.find(c => c.id === aiSelectedContestant.value)
    const response = await store.submitAIScore(
      aiSelectedContestant.value,
      speechText.value,
      contestant?.track || 'A'
    )

    // API返回 { success: true, data: scoreData }，从 data 中获取结果
    const result = response.data || response

    // 保存结果并显示结果弹窗
    aiResult.value = {
      score: result.score,
      feedback: result.feedback,
      dimension_scores: result.dimension_scores,
      contestant_name: result.contestant_name || contestant?.name || '未知',
      speech_text: speechText.value
    }
    showAIResultModal.value = true

    // 清空语音文本
    speechText.value = ''
  } catch (err) {
    console.error('AI 评分失败:', err)
    alert('AI 评分失败: ' + (err.response?.data?.error || err.message))
  } finally {
    aiScoring.value = false
  }
}

// 轮播控制函数
function selectTrack(index) {
  currentTrackIndex.value = index
  // 手动选择时重置自动播放计时器
  if (autoPlayEnabled.value) {
    resetAutoPlay()
  }
}

function nextTrack() {
  const tracks = store.tracks || []
  if (tracks.length === 0) return
  currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.length
}

function prevTrack() {
  const tracks = store.tracks || []
  if (tracks.length === 0) return
  currentTrackIndex.value = (currentTrackIndex.value - 1 + tracks.length) % tracks.length
}

function toggleAutoPlay() {
  autoPlayEnabled.value = !autoPlayEnabled.value
  if (autoPlayEnabled.value) {
    startAutoPlay()
  } else {
    stopAutoPlay()
  }
}

function startAutoPlay() {
  stopAutoPlay()
  autoPlayInterval = setInterval(() => {
    nextTrack()
  }, AUTO_PLAY_DELAY)
}

function stopAutoPlay() {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
    autoPlayInterval = null
  }
}

function resetAutoPlay() {
  if (autoPlayEnabled.value) {
    stopAutoPlay()
    startAutoPlay()
  }
}

// ========== 倒计时功能 ==========

// 格式化倒计时显示
const formattedCountdown = computed(() => {
  const minutes = Math.floor(countdownSeconds.value / 60)
  const seconds = countdownSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// 倒计时进度百分比
const countdownProgress = computed(() => {
  const totalSeconds = store.scoreConfig.countdown_minutes * 60
  if (totalSeconds === 0) return 0
  return ((totalSeconds - countdownSeconds.value) / totalSeconds) * 100
})

// 是否处于紧急状态（最后10秒）
const isCountdownUrgent = computed(() => {
  return isCountdownRunning.value && countdownSeconds.value > 0 && countdownSeconds.value <= 10
})

// 开始倒计时
function startCountdown() {
  if (countdownSeconds.value <= 0) {
    // 如果已归零，重新初始化
    countdownSeconds.value = store.scoreConfig.countdown_minutes * 60
  }
  if (countdownSeconds.value <= 0) return

  isCountdownRunning.value = true
  isCountdownPaused.value = false

  countdownInterval = setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value--
      // 最后10秒播放警告音
      if (countdownSeconds.value <= 10 && countdownSeconds.value > 0) {
        playCountdownWarningSound()
      }
      // 倒计时结束
      if (countdownSeconds.value === 0) {
        playCountdownEndSound()
        stopCountdown()
      }
    }
  }, 1000)
}

// 暂停倒计时
function pauseCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  isCountdownPaused.value = true
  isCountdownRunning.value = false
}

// 停止倒计时
function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  isCountdownRunning.value = false
  isCountdownPaused.value = false
}

// 重置倒计时
function resetCountdown() {
  stopCountdown()
  countdownSeconds.value = store.scoreConfig.countdown_minutes * 60
}

// 倒计时警告音效
function playCountdownWarningSound() {
  if (!soundEnabled.value) return
  playTone(880, 0.08, 'sine', 0.15)
}

// 倒计时结束音效
function playCountdownEndSound() {
  if (!soundEnabled.value) return
  const melody = [
    { freq: 784, dur: 0.15 },  // G5
    { freq: 784, dur: 0.15 },  // G5
    { freq: 784, dur: 0.15 },  // G5
    { freq: 1047, dur: 0.4 },  // C6
  ]
  let time = 0
  melody.forEach(note => {
    setTimeout(() => playTone(note.freq, note.dur, 'square', 0.25), time)
    time += note.dur * 600
  })
}

// 所有赛道信息
const allTracks = computed(() => {
  return store.tracks || []
})

// 获取某赛道前三名
function getTopThree(trackName) {
  const data = store.rankings[trackName]
  if (!data || !data.contestants) return []
  return data.contestants.slice(0, 3)
}

// 所有选手混合排名（所有赛道按总分排序）
const allContestants = computed(() => {
  const all = []
  for (const trackName in store.rankings) {
    const contestants = store.rankings[trackName]?.contestants || []
    all.push(...contestants)
  }
  // 按总分降序排序
  return all.sort((a, b) => b.total_score - a.total_score)
})

// 所有评分者（从任一赛道获取，因为是相同的）
const allJudges = computed(() => {
  const firstTrack = Object.keys(store.rankings)[0]
  return store.rankings[firstTrack]?.judges || []
})

// 上一次在线评委数量（用于检测变化）
let previousOnlineJudgeCount = 0

// 监听在线状态变化
watch(() => store.onlineStatus, (newStatus, oldStatus) => {
  if (!oldStatus) {
    previousOnlineJudgeCount = newStatus.judges?.length || 0
    return
  }

  const newCount = newStatus.judges?.length || 0
  // 有新评委上线时播放音效
  if (newCount > previousOnlineJudgeCount) {
    playJudgeOnlineSound()
  }
  previousOnlineJudgeCount = newCount
}, { deep: true })

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

// 评委上线音效
function playJudgeOnlineSound() {
  if (!soundEnabled.value) return
  playTone(587, 0.1, 'sine', 0.2)  // D5
  setTimeout(() => playTone(880, 0.15, 'sine', 0.25), 100) // A5
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

// 获取赛道信息
function getTrackInfo(trackName) {
  const track = store.tracks.find(t => t.name === trackName)
  return track || { name: trackName, display_name: trackName, color: 'gray' }
}

let refreshInterval = null

onMounted(async () => {
  // 加载赛道数据、评分配置和选手数据
  await Promise.all([
    store.fetchTracks(),
    store.fetchScoreConfig(),
    store.fetchContestants()
  ])

  // 根据配置设置默认的右侧面板模式
  if (store.scoreConfig.ai_scoring_enabled && !store.scoreConfig.show_public_vote_realtime) {
    rightPanelMode.value = 'ai'
  } else if (store.scoreConfig.show_public_vote_realtime) {
    rightPanelMode.value = 'public'
  } else if (store.scoreConfig.ai_scoring_enabled) {
    rightPanelMode.value = 'ai'
  }

  // 如果开启了 AI 评分，加载 AI 评分记录
  if (store.scoreConfig.ai_scoring_enabled) {
    store.fetchLatestAIScores()
  }

  // 初始化倒计时
  if (store.scoreConfig.countdown_minutes > 0) {
    countdownSeconds.value = store.scoreConfig.countdown_minutes * 60
  }

  // 初始化 Socket 连接
  store.initSocket()

  // 每3秒刷新排名和在线状态
  refreshInterval = setInterval(() => {
    store.requestRankings()
    if (store.socket) {
      store.socket.emit('getOnlineStatus')
    }
  }, 3000)

  // 启动自动轮播
  if (autoPlayEnabled.value) {
    startAutoPlay()
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  // 停止自动轮播
  stopAutoPlay()
  // 停止倒计时
  stopCountdown()
  // 停止活动检查
  stopActivityCheck()
  // 清理重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  // 停止语音识别
  if (recognition) {
    try {
      recognition.stop()
    } catch (e) {
      // 忽略错误
    }
    recognition = null
  }
})

function getTop3BgClass(index, color) {
  const opacities = ['30', '20', '10']
  const opacity = opacities[index] || '10'
  return `bg-${color}-500/${opacity}`
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

/* 轮播动画 */
.carousel-enter-active,
.carousel-leave-active {
  transition: all 0.5s ease;
}

.carousel-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.carousel-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

/* 投票动态动画 */
.vote-activity-enter-active {
  transition: all 0.4s ease-out;
}

.vote-activity-leave-active {
  transition: all 0.3s ease-in;
}

.vote-activity-enter-from {
  opacity: 0;
  transform: translateX(-20px);
  background: rgba(236, 72, 153, 0.3);
}

.vote-activity-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.vote-activity-move {
  transition: transform 0.3s ease;
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

/* ========== 语音识别展示层动效 ========== */

/* 展示层进入/离开动画 */
.speech-overlay-enter-active,
.speech-overlay-leave-active {
  transition: all 0.3s ease;
}

.speech-overlay-enter-from,
.speech-overlay-leave-to {
  opacity: 0;
  transform: translateY(100px);
}

/* 光标闪烁动画 */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.animate-blink {
  animation: blink 1s infinite;
}

/* 语音文字样式 */
.speech-text-animate {
  /* 移除动画，避免抖动 */
}

/* 声波动画条 */
.sound-wave-bar {
  width: 4px;
  height: 8px;
  background: linear-gradient(to top, #a855f7, #ec4899);
  border-radius: 2px;
  animation: soundWave 0.8s ease-in-out infinite;
  transform-origin: bottom;
}

@keyframes soundWave {
  0%, 100% {
    transform: scaleY(1);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(5);
    opacity: 1;
  }
}

/* 不同条的延迟，形成波浪效果 */
.sound-wave-bar:nth-child(1) { animation-delay: 0s; }
.sound-wave-bar:nth-child(2) { animation-delay: 0.1s; }
.sound-wave-bar:nth-child(3) { animation-delay: 0.2s; }
.sound-wave-bar:nth-child(4) { animation-delay: 0.3s; }
.sound-wave-bar:nth-child(5) { animation-delay: 0.4s; }
.sound-wave-bar:nth-child(6) { animation-delay: 0.5s; }
.sound-wave-bar:nth-child(7) { animation-delay: 0.4s; }
.sound-wave-bar:nth-child(8) { animation-delay: 0.3s; }
.sound-wave-bar:nth-child(9) { animation-delay: 0.2s; }
.sound-wave-bar:nth-child(10) { animation-delay: 0.1s; }
.sound-wave-bar:nth-child(11) { animation-delay: 0s; }
.sound-wave-bar:nth-child(12) { animation-delay: 0.1s; }

/* ========== 倒计时紧急红光效果 ========== */

/* 红光遮罩 */
.urgent-red-glow {
  background: radial-gradient(ellipse at center, transparent 30%, rgba(239, 68, 68, 0.15) 70%, rgba(239, 68, 68, 0.25) 100%);
  animation: urgentPulse 1s ease-in-out infinite;
}

@keyframes urgentPulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 红光进入/离开动画 */
.urgent-glow-enter-active {
  transition: opacity 0.3s ease-out;
}

.urgent-glow-leave-active {
  transition: opacity 0.5s ease-in;
}

.urgent-glow-enter-from,
.urgent-glow-leave-to {
  opacity: 0;
}

/* ========== AI 评价按钮微呼吸动画 ========== */
.animate-pulse-subtle {
  animation: pulseSubtle 2s ease-in-out infinite;
}

@keyframes pulseSubtle {
  0%, 100% {
    box-shadow: 0 10px 40px rgba(168, 85, 247, 0.4);
  }
  50% {
    box-shadow: 0 10px 50px rgba(168, 85, 247, 0.6), 0 0 20px rgba(236, 72, 153, 0.3);
  }
}

/* ========== AI 结果弹窗动画 ========== */
.ai-result-modal-enter-active {
  transition: all 0.4s ease-out;
}

.ai-result-modal-leave-active {
  transition: all 0.3s ease-in;
}

.ai-result-modal-enter-from {
  opacity: 0;
}

.ai-result-modal-enter-from .ai-result-card {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

.ai-result-modal-leave-to {
  opacity: 0;
}

.ai-result-modal-leave-to .ai-result-card {
  transform: scale(0.95);
  opacity: 0;
}

.ai-result-card {
  transition: all 0.4s ease-out;
}

/* 分数数字动画 */
.score-number {
  animation: scoreReveal 0.8s ease-out;
}

@keyframes scoreReveal {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
