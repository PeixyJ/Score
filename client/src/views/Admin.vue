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

      <!-- 评分配置 -->
      <div v-if="activeTab === 'config'" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-6">评分配置</h2>

        <div class="max-w-xl space-y-6">
          <!-- 权重配置（即最高分） -->
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="text-sm font-medium text-gray-700 mb-4">分数权重配置</h3>
            <div class="grid grid-cols-2 gap-6">
              <div>
                <label class="block text-sm text-gray-600 mb-2">专业评分最高分</label>
                <div class="flex items-center">
                  <input
                    v-model.number="editingConfig.professional_weight"
                    type="number"
                    min="0"
                    max="100"
                    class="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold text-blue-600"
                  />
                  <span class="ml-2 text-gray-500">分</span>
                </div>
                <p class="mt-1 text-xs text-gray-500">评委打满分时折算的分数</p>
              </div>
              <div>
                <label class="block text-sm text-gray-600 mb-2">大众评分最高分</label>
                <div class="flex items-center">
                  <input
                    v-model.number="editingConfig.public_weight"
                    type="number"
                    min="0"
                    max="100"
                    class="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold text-green-600"
                  />
                  <span class="ml-2 text-gray-500">分</span>
                </div>
                <p class="mt-1 text-xs text-gray-500">大众打满分时折算的分数</p>
              </div>
            </div>
          </div>

          <!-- 评委打分满分设置 -->
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="text-sm font-medium text-gray-700 mb-4">评委打分设置</h3>
            <div class="flex items-center">
              <label class="text-sm text-gray-600 mr-3">每项打分满分</label>
              <input
                v-model.number="editingConfig.default_max_score"
                type="number"
                min="1"
                max="100"
                class="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span class="ml-2 text-gray-500">分</span>
            </div>
            <p class="mt-2 text-xs text-gray-500">
              评委和大众投票时，每项打分的满分值
            </p>
          </div>

          <!-- 计算结果预览 -->
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 class="text-sm font-medium text-blue-800 mb-3">计算规则预览</h3>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between p-2 bg-white rounded">
                <span class="text-gray-600">总分最高分：</span>
                <span class="font-bold text-purple-600 text-xl">
                  {{ editingConfig.professional_weight + editingConfig.public_weight }} 分
                </span>
              </div>
              <div class="text-gray-600">
                <p class="mb-2">计算公式：</p>
                <div class="p-3 bg-white rounded font-mono text-xs">
                  <p>专业得分 = (评委平均分 / {{ editingConfig.default_max_score }}) × <span class="text-blue-600 font-bold">{{ editingConfig.professional_weight }}</span></p>
                  <p class="mt-1">大众得分 = (大众平均分 / {{ editingConfig.default_max_score }}) × <span class="text-green-600 font-bold">{{ editingConfig.public_weight }}</span></p>
                  <p class="mt-1 pt-1 border-t">总分 = 专业得分 + 大众得分</p>
                </div>
              </div>
              <div class="text-gray-500 text-xs">
                <p>示例：评委打 {{ editingConfig.default_max_score }} 分（满分），大众打 {{ editingConfig.default_max_score }} 分（满分）</p>
                <p>→ 专业得分 = {{ editingConfig.professional_weight }} 分，大众得分 = {{ editingConfig.public_weight }} 分，总分 = {{ editingConfig.professional_weight + editingConfig.public_weight }} 分</p>
              </div>
            </div>
          </div>

          <!-- 大屏显示设置 -->
          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="text-sm font-medium text-gray-700 mb-4">大屏显示设置</h3>
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm text-gray-600">显示实时大众投票动态</label>
                <p class="text-xs text-gray-500 mt-1">在大屏左侧显示实时的大众评委投票记录</p>
              </div>
              <button
                @click="editingConfig.show_public_vote_realtime = editingConfig.show_public_vote_realtime ? 0 : 1"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  editingConfig.show_public_vote_realtime ? 'bg-blue-500' : 'bg-gray-300'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    editingConfig.show_public_vote_realtime ? 'translate-x-6' : 'translate-x-1'
                  ]"
                ></span>
              </button>
            </div>
          </div>

          <!-- 保存按钮 -->
          <div class="flex space-x-2">
            <button
              @click="saveConfig"
              class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              保存配置
            </button>
            <button
              @click="initConfigDefaults"
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 赛道管理 -->
      <div v-if="activeTab === 'tracks'" class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">赛道列表</h2>
          <div class="flex space-x-2">
            <input
              v-model="newTrackName"
              type="text"
              placeholder="赛道标识 (如: C)"
              class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
            />
            <input
              v-model="newTrackDisplayName"
              type="text"
              placeholder="显示名称 (如: C赛道)"
              class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              v-model="newTrackColor"
              class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="color in trackColors" :key="color" :value="color">{{ color }}</option>
            </select>
            <button
              @click="addTrack"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              添加
            </button>
          </div>
        </div>

        <!-- 编辑赛道弹窗 -->
        <div v-if="editingTrack" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold mb-4">编辑赛道</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">赛道标识</label>
                <input v-model="editingTrack.name" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">显示名称</label>
                <input v-model="editingTrack.display_name" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                <select v-model="editingTrack.color" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option v-for="color in trackColors" :key="color" :value="color">{{ color }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">序号</label>
                <input v-model.number="editingTrack.order_num" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div class="flex justify-end space-x-2 mt-6">
              <button @click="cancelEditTrack" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">取消</button>
              <button @click="saveEditTrack" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">标识</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">显示名称</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">颜色</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">序号</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="track in store.tracks" :key="track.id">
                <td class="px-4 py-3 text-sm text-gray-900">{{ track.id }}</td>
                <td class="px-4 py-3 text-sm text-gray-900 font-mono font-bold">{{ track.name }}</td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ track.display_name }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      `bg-${track.color}-100 text-${track.color}-600`
                    ]"
                  >
                    {{ track.color }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ track.order_num }}</td>
                <td class="px-4 py-3 space-x-2">
                  <button @click="startEditTrack(track)" class="text-blue-500 hover:text-blue-600 text-sm">编辑</button>
                  <button @click="deleteTrack(track.id)" class="text-red-500 hover:text-red-600 text-sm">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-4 text-sm text-gray-500">
          提示：删除赛道前需要先删除该赛道下的所有选手和评分维度
        </p>
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

        <!-- 编辑评分者弹窗 -->
        <div v-if="editingJudge" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold mb-4">编辑评分者</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input v-model="editingJudge.name" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">密钥（不可修改）</label>
                <code class="block px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono">{{ editingJudge.secret_key }}</code>
              </div>
            </div>
            <div class="flex justify-end space-x-2 mt-6">
              <button @click="cancelEditJudge" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">取消</button>
              <button @click="saveEditJudge" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
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
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">专属登录链接</th>
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
                  <div class="flex items-center space-x-2">
                    <code class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono truncate max-w-xs">{{ getJudgeLoginUrl(judge.secret_key) }}</code>
                    <button
                      @click="copyJudgeUrl(judge.id, judge.secret_key)"
                      :class="[
                        'px-2 py-1 text-white text-xs rounded transition-colors',
                        copiedJudgeId === judge.id ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                      ]"
                    >
                      {{ copiedJudgeId === judge.id ? '已复制' : '复制' }}
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3 space-x-2">
                  <button @click="startEditJudge(judge)" class="text-blue-500 hover:text-blue-600 text-sm">编辑</button>
                  <button @click="deleteJudge(judge.id)" class="text-red-500 hover:text-red-600 text-sm">删除</button>
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
              <option v-for="track in store.tracks" :key="track.name" :value="track.name">{{ track.display_name }}</option>
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
                <option v-for="track in store.tracks" :key="track.name" :value="track.name">{{ track.display_name }}</option>
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

        <!-- 编辑被评分者弹窗 -->
        <div v-if="editingContestant" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold mb-4">编辑被评分者</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input v-model="editingContestant.name" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">赛道</label>
                <select v-model="editingContestant.track" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option v-for="track in store.tracks" :key="track.name" :value="track.name">{{ track.display_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">序号</label>
                <input v-model.number="editingContestant.order_num" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div class="flex justify-end space-x-2 mt-6">
              <button @click="cancelEditContestant" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">取消</button>
              <button @click="saveEditContestant" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
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
            v-for="track in store.tracks"
            :key="track.name"
            @click="contestantFilter = track.name"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              contestantFilter === track.name ? `bg-${track.color}-500 text-white` : 'bg-gray-200 text-gray-600'
            ]"
          >
            {{ track.display_name }}
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
                      `bg-${getTrackInfo(contestant.track).color}-100 text-${getTrackInfo(contestant.track).color}-600`
                    ]"
                  >
                    {{ getTrackInfo(contestant.track).display_name }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ contestant.order_num }}</td>
                <td class="px-4 py-3 space-x-2">
                  <button @click="startEditContestant(contestant)" class="text-blue-500 hover:text-blue-600 text-sm">编辑</button>
                  <button @click="deleteContestant(contestant.id)" class="text-red-500 hover:text-red-600 text-sm">删除</button>
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
                placeholder="A 软件完成度与质量 40&#10;A 创新性 30&#10;B 演讲表现 50&#10;..."
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              ></textarea>
            </div>
            <p class="text-sm text-gray-500 mb-4">格式：赛道 名称 权重（空格分隔）</p>
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
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option v-for="track in store.tracks" :key="track.name" :value="track.name">{{ track.display_name }}</option>
              </select>
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

        <!-- 编辑维度弹窗 -->
        <div v-if="editingDimension" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold mb-4">编辑评分维度</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">维度名称</label>
                <input v-model="editingDimension.name" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">所属赛道</label>
                <select v-model="editingDimension.track" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option v-for="track in store.tracks" :key="track.name" :value="track.name">{{ track.display_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">权重</label>
                <input v-model.number="editingDimension.weight" type="number" min="0.1" step="0.1" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">序号</label>
                <input v-model.number="editingDimension.order_num" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div class="flex justify-end space-x-2 mt-6">
              <button @click="cancelEditDimension" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">取消</button>
              <button @click="saveEditDimension" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
            </div>
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
            v-for="track in store.tracks"
            :key="track.name"
            @click="dimensionFilter = track.name"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              dimensionFilter === track.name ? `bg-${track.color}-500 text-white` : 'bg-gray-200 text-gray-600'
            ]"
          >
            {{ track.display_name }}
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">名称</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">赛道</th>
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
                      `bg-${getTrackInfo(dim.track).color}-100 text-${getTrackInfo(dim.track).color}-600`
                    ]"
                  >
                    {{ getTrackInfo(dim.track).display_name }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ dim.weight }}</td>
                <td class="px-4 py-3 space-x-2">
                  <button @click="startEditDimension(dim)" class="text-blue-500 hover:text-blue-600 text-sm">编辑</button>
                  <button @click="deleteDimension(dim.id)" class="text-red-500 hover:text-red-600 text-sm">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 评分详情 -->
      <div v-if="activeTab === 'scoreDetails'" class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">评分详情</h2>
          <button
            @click="fetchScoreDetails"
            :disabled="loadingScoreDetails"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
          >
            {{ loadingScoreDetails ? '加载中...' : '刷新数据' }}
          </button>
        </div>

        <!-- 赛道筛选 -->
        <div class="flex space-x-2 mb-4">
          <button
            @click="scoreDetailsTrackFilter = ''"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              scoreDetailsTrackFilter === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            ]"
          >
            全部
          </button>
          <button
            v-for="track in store.tracks"
            :key="track.name"
            @click="scoreDetailsTrackFilter = track.name"
            :class="[
              'px-3 py-1 rounded-full text-sm',
              scoreDetailsTrackFilter === track.name ? `bg-${track.color}-500 text-white` : 'bg-gray-200 text-gray-600'
            ]"
          >
            {{ track.display_name }}
          </button>
        </div>

        <!-- 评分者图例 -->
        <div v-if="scoreDetails.judges.length > 0" class="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <span class="text-sm font-medium text-gray-700">评委列表:</span>
          <span
            v-for="judge in scoreDetails.judges"
            :key="judge.id"
            class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
          >
            {{ judge.name }}
          </span>
        </div>

        <!-- 加载中 -->
        <div v-if="loadingScoreDetails" class="text-center py-8 text-gray-500">
          加载中...
        </div>

        <!-- 空数据 -->
        <div v-else-if="filteredScoreDetails.length === 0" class="text-center py-8 text-gray-500">
          暂无评分数据
        </div>

        <!-- 评分表格 -->
        <div v-else class="space-y-6">
          <div
            v-for="contestant in filteredScoreDetails"
            :key="contestant.id"
            class="border rounded-lg overflow-hidden"
          >
            <!-- 选手标题 -->
            <div
              :class="[
                'px-4 py-3 flex items-center justify-between',
                `bg-${getTrackInfo(contestant.track).color}-50`
              ]"
            >
              <div class="flex items-center gap-3">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-bold',
                    `bg-${getTrackInfo(contestant.track).color}-500 text-white`
                  ]"
                >
                  {{ contestant.track }}
                </span>
                <span class="font-semibold text-gray-800">{{ contestant.name }}</span>
              </div>
              <div class="text-sm text-gray-500">
                {{ contestant.judges.filter(j => j.hasScored).length }} / {{ contestant.judges.length }} 位评委已评分
              </div>
            </div>

            <!-- 评分详情表格 -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-4 py-2 text-left font-medium text-gray-600 w-32">评委</th>
                    <th class="px-4 py-2 text-left font-medium text-gray-600">各维度评分</th>
                    <th class="px-4 py-2 text-center font-medium text-gray-600 w-24">总分</th>
                    <th class="px-4 py-2 text-center font-medium text-gray-600 w-20">状态</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="judge in contestant.judges"
                    :key="judge.judge_id"
                    :class="judge.hasScored ? '' : 'bg-gray-50'"
                  >
                    <td class="px-4 py-3 font-medium text-gray-800">{{ judge.judge_name }}</td>
                    <td class="px-4 py-3">
                      <div v-if="judge.hasScored" class="flex flex-wrap gap-2">
                        <span
                          v-for="score in judge.scores"
                          :key="score.dimension_id"
                          class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          <span class="text-gray-500">{{ score.dimension_name }}:</span>
                          <span class="font-semibold">{{ score.score }}</span>
                          <span class="text-gray-400">/{{ score.max_score }}</span>
                        </span>
                      </div>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        v-if="judge.hasScored"
                        class="font-bold text-blue-600"
                      >
                        {{ judge.total.toFixed(1) }}
                      </span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        v-if="judge.hasScored"
                        class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                      >
                        已评分
                      </span>
                      <span
                        v-else
                        class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full"
                      >
                        未评分
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useScoreStore } from '../stores/score'
import axios from 'axios'

const store = useScoreStore()

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
      store.fetchTracks(),
      store.fetchJudges(),
      store.fetchContestants(),
      store.fetchDimensions(),
      store.fetchScoreConfig()
    ])
    initTrackDefaults()
    initConfigDefaults()
  }
})

// 初始化配置默认值
function initConfigDefaults() {
  editingConfig.value = { ...store.scoreConfig }
}

// 保存评分配置
async function saveConfig() {
  try {
    await store.updateScoreConfig(editingConfig.value)
    alert('配置保存成功')
  } catch (err) {
    alert('保存失败：' + (err.response?.data?.error || err.message))
  }
}

// 初始化赛道默认值
function initTrackDefaults() {
  if (store.tracks.length > 0) {
    const firstTrack = store.tracks[0].name
    newContestantTrack.value = firstTrack
    batchImportTrack.value = firstTrack
    newDimension.value.track = firstTrack
  }
}

async function login() {
  try {
    const res = await axios.post('/api/admin/verify', { password: password.value })
    if (res.data.success) {
      isAuthenticated.value = true
      sessionStorage.setItem('admin_auth', 'true')
      loginError.value = ''
      password.value = ''
      // 登录成功后加载数据
      await Promise.all([
        store.fetchTracks(),
        store.fetchJudges(),
        store.fetchContestants(),
        store.fetchDimensions(),
        store.fetchScoreConfig()
      ])
      initTrackDefaults()
      initConfigDefaults()
    }
  } catch (err) {
    loginError.value = err.response?.data?.error || '密码错误，请重试'
  }
}

function logout() {
  isAuthenticated.value = false
  sessionStorage.removeItem('admin_auth')
}

const tabs = [
  { key: 'config', label: '评分配置' },
  { key: 'tracks', label: '赛道管理' },
  { key: 'judges', label: '评分者管理' },
  { key: 'contestants', label: '被评分者管理' },
  { key: 'dimensions', label: '评分维度' },
  { key: 'scoreDetails', label: '评分详情' }
]

const activeTab = ref('config')
const newJudgeName = ref('')
const newContestantName = ref('')
const newContestantTrack = ref('')
const contestantFilter = ref('')
const dimensionFilter = ref('')
const showDimensionForm = ref(false)
const showBatchImport = ref(false)
const batchImportText = ref('')
const batchImportTrack = ref('')
const showJudgeBatchImport = ref(false)
const judgeBatchImportText = ref('')
const showDimensionBatchImport = ref(false)
const dimensionBatchImportText = ref('')
const newDimension = ref({
  name: '',
  track: '',
  weight: 1.0
})

// 赛道管理相关
const newTrackName = ref('')
const newTrackDisplayName = ref('')
const newTrackColor = ref('blue')
const trackColors = ['orange', 'purple', 'blue', 'green', 'red', 'pink', 'yellow', 'indigo']

// 编辑状态
const editingTrack = ref(null)
const editingJudge = ref(null)
const editingContestant = ref(null)
const editingDimension = ref(null)
const copiedJudgeId = ref(null)

// 评分配置
const editingConfig = ref({
  professional_weight: 70,
  public_weight: 30,
  default_max_score: 5,
  show_public_vote_realtime: 1
})

// 评分详情相关
const scoreDetails = ref({ judges: [], dimensions: [], contestants: [] })
const scoreDetailsTrackFilter = ref('')
const loadingScoreDetails = ref(false)

const filteredContestants = computed(() => {
  if (!contestantFilter.value) return store.contestants
  return store.contestants.filter(c => c.track === contestantFilter.value)
})

const filteredDimensions = computed(() => {
  if (!dimensionFilter.value) return store.dimensions
  return store.dimensions.filter(d => d.track === dimensionFilter.value)
})

const filteredScoreDetails = computed(() => {
  if (!scoreDetailsTrackFilter.value) return scoreDetails.value.contestants
  return scoreDetails.value.contestants.filter(c => c.track === scoreDetailsTrackFilter.value)
})

// 获取赛道信息
function getTrackInfo(trackName) {
  const track = store.tracks.find(t => t.name === trackName)
  return track || { name: trackName, display_name: trackName + '赛道', color: 'gray' }
}

// 赛道操作
async function addTrack() {
  if (!newTrackName.value.trim() || !newTrackDisplayName.value.trim()) return
  try {
    await axios.post('/api/tracks', {
      name: newTrackName.value.trim().toUpperCase(),
      display_name: newTrackDisplayName.value.trim(),
      color: newTrackColor.value
    })
    newTrackName.value = ''
    newTrackDisplayName.value = ''
    newTrackColor.value = 'blue'
    await store.fetchTracks()
    initTrackDefaults()
  } catch (err) {
    alert('添加失败：' + (err.response?.data?.error || err.message))
  }
}

async function deleteTrack(id) {
  if (!confirm('确定删除该赛道？')) return
  try {
    await axios.delete(`/api/tracks/${id}`)
    await store.fetchTracks()
    initTrackDefaults()
  } catch (err) {
    alert('删除失败：' + (err.response?.data?.error || err.message))
  }
}

function startEditTrack(track) {
  editingTrack.value = { ...track }
}

async function saveEditTrack() {
  if (!editingTrack.value) return
  try {
    await axios.put(`/api/tracks/${editingTrack.value.id}`, editingTrack.value)
    editingTrack.value = null
    await store.fetchTracks()
  } catch (err) {
    alert('保存失败：' + (err.response?.data?.error || err.message))
  }
}

function cancelEditTrack() {
  editingTrack.value = null
}

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

function startEditJudge(judge) {
  editingJudge.value = { ...judge }
}

async function saveEditJudge() {
  if (!editingJudge.value) return
  try {
    await axios.put(`/api/judges/${editingJudge.value.id}`, { name: editingJudge.value.name })
    editingJudge.value = null
    await store.fetchJudges()
  } catch (err) {
    alert('保存失败：' + (err.response?.data?.error || err.message))
  }
}

function cancelEditJudge() {
  editingJudge.value = null
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

// 获取评委专属登录链接
function getJudgeLoginUrl(secretKey) {
  const host = window.location.hostname
  const port = window.location.port ? `:${window.location.port}` : ''
  return `http://${host}${port}/mobile?pwd=${secretKey}`
}

// 复制评委登录链接
async function copyJudgeUrl(judgeId, secretKey) {
  const url = getJudgeLoginUrl(secretKey)
  try {
    await navigator.clipboard.writeText(url)
  } catch (err) {
    // 降级方案
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
  copiedJudgeId.value = judgeId
  setTimeout(() => {
    copiedJudgeId.value = null
  }, 2000)
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

function startEditContestant(contestant) {
  editingContestant.value = { ...contestant }
}

async function saveEditContestant() {
  if (!editingContestant.value) return
  try {
    await axios.put(`/api/contestants/${editingContestant.value.id}`, editingContestant.value)
    editingContestant.value = null
    await store.fetchContestants()
  } catch (err) {
    alert('保存失败：' + (err.response?.data?.error || err.message))
  }
}

function cancelEditContestant() {
  editingContestant.value = null
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
  newDimension.value = { name: '', track: store.tracks[0]?.name || 'A', weight: 1.0 }
  showDimensionForm.value = false
  await store.fetchDimensions()
}

async function deleteDimension(id) {
  if (!confirm('确定删除该维度？')) return
  await axios.delete(`/api/dimensions/${id}`)
  await store.fetchDimensions()
}

function startEditDimension(dim) {
  editingDimension.value = { ...dim }
}

async function saveEditDimension() {
  if (!editingDimension.value) return
  try {
    await axios.put(`/api/dimensions/${editingDimension.value.id}`, editingDimension.value)
    editingDimension.value = null
    await store.fetchDimensions()
  } catch (err) {
    alert('保存失败：' + (err.response?.data?.error || err.message))
  }
}

function cancelEditDimension() {
  editingDimension.value = null
}

async function batchImportDimensions() {
  const lines = dimensionBatchImportText.value.split('\n').map(l => l.trim()).filter(l => l)
  if (lines.length === 0) return

  const validTracks = store.tracks.map(t => t.name)
  const items = []
  for (const line of lines) {
    const parts = line.split(/\s+/)
    if (parts.length >= 2) {
      const track = parts[0].toUpperCase()
      const name = parts[1]
      const weight = parts[2] ? parseFloat(parts[2]) : 1.0
      if (validTracks.includes(track) && name) {
        items.push({ track, name, weight })
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
    // 刷新评分详情
    if (activeTab.value === 'scoreDetails') {
      await fetchScoreDetails()
    }
  } catch (err) {
    alert('清空失败：' + err.message)
  }
}

// 获取评分详情
async function fetchScoreDetails() {
  loadingScoreDetails.value = true
  try {
    const res = await axios.get('/api/scores/details')
    scoreDetails.value = res.data
  } catch (err) {
    console.error('获取评分详情失败:', err)
  } finally {
    loadingScoreDetails.value = false
  }
}

// 监听Tab切换，自动加载评分详情
watch(activeTab, async (newTab) => {
  if (newTab === 'scoreDetails' && scoreDetails.value.contestants.length === 0) {
    await fetchScoreDetails()
  }
})
</script>
