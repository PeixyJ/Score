<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 登录弹窗 -->
    <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">管理后台登录</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">请输入管理密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            class="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="login"
          />
        </div>
        <p v-if="loginError" class="text-red-500 text-sm mb-4">{{ loginError }}</p>
        <button
          @click="login"
          class="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          登录
        </button>
        <router-link to="/" class="block text-center text-blue-500 hover:text-blue-600 mt-4 text-sm">
          返回首页
        </router-link>
      </div>
    </div>

    <!-- 管理后台内容 -->
    <template v-else>
      <!-- 头部 -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-800">管理后台</h1>
          <div class="flex items-center space-x-4">
            <button
              @click="clearAllScores"
              class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
            >
              清空所有评分
            </button>
            <button @click="logout" class="text-gray-500 hover:text-gray-600 text-sm">退出登录</button>
            <router-link to="/" class="text-blue-500 hover:text-blue-600">返回首页</router-link>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Tab 切换 -->
      <div class="flex space-x-4 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === tab.key
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 评分者管理 -->
      <div v-if="activeTab === 'judges'" class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">评分者列表</h2>
          <div class="flex space-x-2">
            <input
              v-model="newJudgeName"
              type="text"
              placeholder="评分者名称"
              class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="addJudge"
            />
            <button
              @click="addJudge"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              添加
            </button>
            <button
              @click="showJudgeBatchImport = true"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              批量导入
            </button>
          </div>
        </div>

        <!-- 批量导入评分者弹窗 -->
        <div v-if="showJudgeBatchImport" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 class="text-lg font-semibold mb-4">批量导入评分者</h3>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">名单（每行一个名字）</label>
              <textarea
                v-model="judgeBatchImportText"
                rows="10"
                placeholder="张三&#10;李四&#10;王五&#10;..."
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              ></textarea>
            </div>
            <p class="text-sm text-gray-500 mb-4">系统将自动为每个评分者生成唯一密钥</p>
            <div class="flex justify-end space-x-2">
              <button
                @click="showJudgeBatchImport = false; judgeBatchImportText = ''"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
              <button
                @click="batchImportJudges"
                :disabled="!judgeBatchImportText.trim()"
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
              >
                导入
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">名称</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">密钥</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="judge in store.judges" :key="judge.id">
                <td class="px-4 py-3 text-sm text-gray-900">{{ judge.id }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ judge.name }}</td>
                <td class="px-4 py-3">
                  <code class="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{{ judge.secret_key }}</code>
                </td>
                <td class="px-4 py-3">
                  <button
                    @click="deleteJudge(judge.id)"
                    class="text-red-500 hover:text-red-600 text-sm"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 被评分者管理 -->
      <div v-if="activeTab === 'contestants'" class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">被评分者列表</h2>
          <div class="flex space-x-2">
            <input
              v-model="newContestantName"
              type="text"
              placeholder="被评分者名称"
              class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="addContestant"
            />
            <select
              v-model="newContestantTrack"
              class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">A赛道</option>
              <option value="B">B赛道</option>
            </select>
            <button
              @click="addContestant"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              添加
            </button>
            <button
              @click="showBatchImport = true"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              批量导入
            </button>
          </div>
        </div>

        <!-- 批量导入弹窗 -->
        <div v-if="showBatchImport" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 class="text-lg font-semibold mb-4">批量导入被评分者</h3>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">选择赛道</label>
              <select
                v-model="batchImportTrack"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">A赛道</option>
                <option value="B">B赛道</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">名单（每行一个名字）</label>
              <textarea
                v-model="batchImportText"
                rows="10"
                placeholder="顾忠炜&#10;钱玉婷&#10;任正德&#10;..."
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              ></textarea>
            </div>
            <div class="flex justify-end space-x-2">
              <button
                @click="showBatchImport = false; batchImportText = ''"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
              <button
                @click="batchImportContestants"
                :disabled="!batchImportText.trim()"
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
              >
                导入
              </button>
            </div>
          </div>
        </div>

        <!-- 赛道筛选 -->
        <div class="flex space-x-2 mb-4">
          <button
            @click="contestantFilter = ''"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              contestantFilter === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            ]"
          >
            全部
          </button>
          <button
            @click="contestantFilter = 'A'"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              contestantFilter === 'A' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
            ]"
          >
            A赛道
          </button>
          <button
            @click="contestantFilter = 'B'"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              contestantFilter === 'B' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
            ]"
          >
            B赛道
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">名称</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">赛道</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">序号</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="contestant in filteredContestants" :key="contestant.id">
                <td class="px-4 py-3 text-sm text-gray-900">{{ contestant.id }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ contestant.name }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      contestant.track === 'A' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                    ]"
                  >
                    {{ contestant.track }}赛道
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ contestant.order_num }}</td>
                <td class="px-4 py-3">
                  <button
                    @click="deleteContestant(contestant.id)"
                    class="text-red-500 hover:text-red-600 text-sm"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 评分维度管理 -->
      <div v-if="activeTab === 'dimensions'" class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">评分维度列表</h2>
          <div class="flex space-x-2">
            <button
              @click="showDimensionForm = true"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              添加维度
            </button>
            <button
              @click="showDimensionBatchImport = true"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              批量导入
            </button>
          </div>
        </div>

        <!-- 批量导入维度弹窗 -->
        <div v-if="showDimensionBatchImport" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 class="text-lg font-semibold mb-4">批量导入评分维度</h3>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">维度列表（每行一个，空格分隔）</label>
              <textarea
                v-model="dimensionBatchImportText"
                rows="10"
                placeholder="A 软件完成度与质量 5 40&#10;A 创新性 5 30&#10;B 演讲表现 10 50&#10;..."
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              ></textarea>
            </div>
            <p class="text-sm text-gray-500 mb-4">格式：赛道 名称 最高分 权重（空格分隔）</p>
            <div class="flex justify-end space-x-2">
              <button
                @click="showDimensionBatchImport = false; dimensionBatchImportText = ''"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
              <button
                @click="batchImportDimensions"
                :disabled="!dimensionBatchImportText.trim()"
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
              >
                导入
              </button>
            </div>
          </div>
        </div>

        <!-- 添加维度表单 -->
        <div v-if="showDimensionForm" class="mb-6 p-4 bg-gray-50 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">维度名称</label>
              <input
                v-model="newDimension.name"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">所属赛道</label>
              <select
                v-model="newDimension.track"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">A赛道</option>
                <option value="B">B赛道</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">最高分</label>
              <input
                v-model.number="newDimension.max_score"
                type="number"
                min="1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">权重</label>
              <input
                v-model.number="newDimension.weight"
                type="number"
                min="0.1"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div class="flex space-x-2 mt-4">
            <button
              @click="addDimension"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              确认添加
            </button>
            <button
              @click="showDimensionForm = false"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </div>

        <!-- 赛道筛选 -->
        <div class="flex space-x-2 mb-4">
          <button
            @click="dimensionFilter = ''"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              dimensionFilter === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            ]"
          >
            全部
          </button>
          <button
            @click="dimensionFilter = 'A'"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              dimensionFilter === 'A' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
            ]"
          >
            A赛道
          </button>
          <button
            @click="dimensionFilter = 'B'"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              dimensionFilter === 'B' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
            ]"
          >
            B赛道
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">名称</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">赛道</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">最高分</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">权重</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="dim in filteredDimensions" :key="dim.id">
                <td class="px-4 py-3 text-sm text-gray-900">{{ dim.id }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ dim.name }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      dim.track === 'A' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                    ]"
                  >
                    {{ dim.track }}赛道
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ dim.max_score }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ dim.weight }}</td>
                <td class="px-4 py-3">
                  <button
                    @click="deleteDimension(dim.id)"
                    class="text-red-500 hover:text-red-600 text-sm"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useScoreStore } from '../stores/score'
import axios from 'axios'

const store = useScoreStore()

// 管理密码
const ADMIN_PASSWORD = '111111'

// 认证状态
const isAuthenticated = ref(false)
const password = ref('')
const loginError = ref('')

// 检查是否已登录并加载数据
onMounted(async () => {
  const saved = sessionStorage.getItem('admin_auth')
  if (saved === 'true') {
    isAuthenticated.value = true
    await Promise.all([
      store.fetchJudges(),
      store.fetchContestants(),
      store.fetchDimensions()
    ])
  }
})

async function login() {
  if (password.value === ADMIN_PASSWORD) {
    isAuthenticated.value = true
    sessionStorage.setItem('admin_auth', 'true')
    loginError.value = ''
    password.value = ''
    // 登录成功后加载数据
    await Promise.all([
      store.fetchJudges(),
      store.fetchContestants(),
      store.fetchDimensions()
    ])
  } else {
    loginError.value = '密码错误，请重试'
  }
}

function logout() {
  isAuthenticated.value = false
  sessionStorage.removeItem('admin_auth')
}

const tabs = [
  { key: 'judges', label: '评分者管理' },
  { key: 'contestants', label: '被评分者管理' },
  { key: 'dimensions', label: '评分维度' }
]

const activeTab = ref('judges')
const newJudgeName = ref('')
const newContestantName = ref('')
const newContestantTrack = ref('A')
const contestantFilter = ref('')
const dimensionFilter = ref('')
const showDimensionForm = ref(false)
const showBatchImport = ref(false)
const batchImportText = ref('')
const batchImportTrack = ref('A')
const showJudgeBatchImport = ref(false)
const judgeBatchImportText = ref('')
const showDimensionBatchImport = ref(false)
const dimensionBatchImportText = ref('')
const newDimension = ref({
  name: '',
  track: 'A',
  max_score: 10,
  weight: 1.0
})

const filteredContestants = computed(() => {
  if (!contestantFilter.value) return store.contestants
  return store.contestants.filter(c => c.track === contestantFilter.value)
})

const filteredDimensions = computed(() => {
  if (!dimensionFilter.value) return store.dimensions
  return store.dimensions.filter(d => d.track === dimensionFilter.value)
})

// 评分者操作
async function addJudge() {
  if (!newJudgeName.value.trim()) return
  await axios.post('/api/judges', { name: newJudgeName.value })
  newJudgeName.value = ''
  await store.fetchJudges()
}

async function deleteJudge(id) {
  if (!confirm('确定删除该评分者？')) return
  await axios.delete(`/api/judges/${id}`)
  await store.fetchJudges()
}

async function batchImportJudges() {
  const names = judgeBatchImportText.value.split('\n').map(n => n.trim()).filter(n => n)
  if (names.length === 0) return

  try {
    const res = await axios.post('/api/judges/batch', { names })
    alert(`成功导入 ${res.data.count} 名评分者`)
    showJudgeBatchImport.value = false
    judgeBatchImportText.value = ''
    await store.fetchJudges()
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}

// 被评分者操作
async function addContestant() {
  if (!newContestantName.value.trim()) return
  await axios.post('/api/contestants', {
    name: newContestantName.value,
    track: newContestantTrack.value
  })
  newContestantName.value = ''
  await store.fetchContestants()
}

async function deleteContestant(id) {
  if (!confirm('确定删除该被评分者？')) return
  await axios.delete(`/api/contestants/${id}`)
  await store.fetchContestants()
}

async function batchImportContestants() {
  const names = batchImportText.value.split('\n').map(n => n.trim()).filter(n => n)
  if (names.length === 0) return

  try {
    const res = await axios.post('/api/contestants/batch', {
      names,
      track: batchImportTrack.value
    })
    alert(`成功导入 ${res.data.count} 名被评分者`)
    showBatchImport.value = false
    batchImportText.value = ''
    await store.fetchContestants()
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}

// 维度操作
async function addDimension() {
  if (!newDimension.value.name.trim()) return
  await axios.post('/api/dimensions', newDimension.value)
  newDimension.value = { name: '', track: 'A', max_score: 10, weight: 1.0 }
  showDimensionForm.value = false
  await store.fetchDimensions()
}

async function deleteDimension(id) {
  if (!confirm('确定删除该维度？')) return
  await axios.delete(`/api/dimensions/${id}`)
  await store.fetchDimensions()
}

async function batchImportDimensions() {
  const lines = dimensionBatchImportText.value.split('\n').map(l => l.trim()).filter(l => l)
  if (lines.length === 0) return

  const items = []
  for (const line of lines) {
    const parts = line.split(/\s+/)
    if (parts.length >= 2) {
      const track = parts[0].toUpperCase()
      const name = parts[1]
      const max_score = parts[2] ? parseFloat(parts[2]) : 10
      const weight = parts[3] ? parseFloat(parts[3]) : 1.0
      if (['A', 'B'].includes(track) && name) {
        items.push({ track, name, max_score, weight })
      }
    }
  }

  if (items.length === 0) {
    alert('没有有效的维度数据')
    return
  }

  try {
    const res = await axios.post('/api/dimensions/batch', { items })
    alert(`成功导入 ${res.data.count} 个评分维度`)
    showDimensionBatchImport.value = false
    dimensionBatchImportText.value = ''
    await store.fetchDimensions()
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}

// 清空所有评分
async function clearAllScores() {
  if (!confirm('确定要清空所有评分吗？此操作不可恢复！\n\n包括：\n- 所有专业评分\n- 所有大众点评')) return

  try {
    await axios.delete('/api/scores/clear-all')
    alert('已清空所有评分')
  } catch (err) {
    alert('清空失败：' + err.message)
  }
}
</script>
