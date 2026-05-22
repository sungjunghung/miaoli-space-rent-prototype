<template>
  <section class="space-y-4">

    <!-- Toolbar -->
    <header class="flex items-center justify-between">
      <div class="flex-1 flex gap-2 flex-wrap">
        <input v-model="search" type="search" class="input w-64" placeholder="搜尋場館名稱或地址" aria-label="搜尋場館" />
        <select v-model="filterStatus" class="select" aria-label="篩選狀態">
          <option value="">全部狀態</option>
          <option value="available">開放中</option>
          <option value="maintenance">維護中</option>
          <option value="closed">已關閉</option>
        </select>
      </div>
      <button type="button" class="btn btn-primary">
        <span class="material-symbols-outlined">add</span>
        新增場館
      </button>
    </header>

    <!-- Table -->
    <div class="card bg-base-100 border border-base-200 shadow-sm overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">場館</th>
            <th scope="col">類別</th>
            <th scope="col">容納人數</th>
            <th scope="col">狀態</th>
            <th scope="col">租借方式</th>
            <th scope="col" class="w-px"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="venue in topLevel" :key="venue.id">
            <!-- 上層場館 -->
            <tr class="hover">
              <td>
                <div class="flex items-center gap-3">
                  <button v-if="childrenOf(venue.id).length" type="button" class="btn btn-ghost btn-square"
                    :aria-label="expanded.has(venue.id) ? '收合子場地' : '展開子場地'"
                    :aria-expanded="expanded.has(venue.id)"
                    @click="toggleExpand(venue.id)">
                    <span class="material-symbols-outlined transition-transform"
                      :class="expanded.has(venue.id) ? 'rotate-90' : ''">chevron_right</span>
                  </button>
                  <div v-else class="w-7 shrink-0"></div>
                  <div class="avatar">
                    <div class="w-10 h-10 rounded-lg">
                      <img :src="publicImageUrl(venue.mainImageUrl)" :alt="venue.name" class="object-cover" />
                    </div>
                  </div>
                  <div>
                    <p class="font-semibold">{{ venue.name }}</p>
                    <p class="text-base-content/50">{{ venue.location }}</p>
                    <span v-if="childrenOf(venue.id).length" class="text-base-content/40">
                      {{ childrenOf(venue.id).length }} 個子場地
                    </span>
                  </div>
                </div>
              </td>
              <td><span class="badge badge-outline">{{ venue.type }}</span></td>
              <td>{{ venue.capacity.toLocaleString() }} 人</td>
              <td><span :class="['badge ', statusClass(venue.status)]">{{ statusLabel(venue.status) }}</span></td>
              <td>
                <div class="flex gap-1 flex-wrap">
                  <span v-if="venue.rentalModes.daily?.enabled" class="badge badge-ghost">全日</span>
                  <span v-if="venue.rentalModes.session?.enabled" class="badge badge-ghost">場次</span>
                  <span v-if="venue.rentalModes.hourly?.enabled" class="badge badge-ghost">計時</span>
                </div>
              </td>
              <td>
                <div class="flex gap-1">
                  <router-link :to="{ name: 'admin-venues-calendar', query: { id: venue.id } }" class="btn btn-ghost btn-square tooltip" title="行事曆" data-tip="行事曆">
                    <span class="material-symbols-outlined">calendar_month</span>
                  </router-link>
                  <router-link :to="{ name: 'admin-venue-edit', params: { id: venue.id } }" class="btn btn-ghost btn-square tooltip" title="編輯" data-tip="編輯">
                    <span class="material-symbols-outlined">edit</span>
                  </router-link>
                  <button type="button" class="btn btn-error btn-ghost btn-square tooltip" title="刪除" data-tip="刪除">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>

            <!-- 子場地（展開時顯示） -->
            <template v-if="expanded.has(venue.id)">
              <tr v-for="child in childrenOf(venue.id)" :key="child.id" class="hover bg-base-200/40">
                <td>
                  <div class="flex items-center gap-3 pl-10">
                    <div class="avatar">
                      <div class="w-8 h-8 rounded-lg">
                        <img :src="publicImageUrl(child.mainImageUrl)" :alt="child.name" class="object-cover" />
                      </div>
                    </div>
                    <div>
                      <p class="font-medium">{{ child.name }}</p>
                      <p class="text-base-content/40">子場地</p>
                    </div>
                  </div>
                </td>
                <td><span class="badge badge-outline">{{ child.type }}</span></td>
                <td>{{ child.capacity.toLocaleString() }} 人</td>
                <td><span :class="['badge ', statusClass(child.status)]">{{ statusLabel(child.status) }}</span></td>
                <td>
                  <div class="flex gap-1 flex-wrap">
                    <span v-if="child.rentalModes.daily?.enabled" class="badge badge-ghost">全日</span>
                    <span v-if="child.rentalModes.session?.enabled" class="badge badge-ghost">場次</span>
                    <span v-if="child.rentalModes.hourly?.enabled" class="badge badge-ghost">計時</span>
                  </div>
                </td>
                <td>
                  <div class="flex gap-1">
                    <router-link :to="{ name: 'admin-venues-calendar', query: { id: child.id } }" class="btn btn-ghost btn-square tooltip" title="行事曆" data-tip="行事曆">
                      <span class="material-symbols-outlined">calendar_month</span>
                    </router-link>
                    <router-link :to="{ name: 'admin-venue-edit', params: { id: child.id } }" class="btn btn-ghost btn-square tooltip" title="編輯" data-tip="編輯">
                      <span class="material-symbols-outlined">edit</span>
                    </router-link>
                    <button type="button" class="btn btn-error btn-ghost btn-square tooltip" title="刪除" data-tip="刪除">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </template>

          <tr v-if="topLevel.length === 0">
            <td colspan="6" class="text-center text-base-content/40 py-10">找不到符合的場館</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-base-content/40">共 {{ topLevel.length }} 個場館</p>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import mockVenues from '../../../mocks/venues.json'
import { publicImageUrl } from '@/utils/assets'

const search = ref('')
const filterType = ref('')
const filterStatus = ref('')

const parentIds = mockVenues
  .filter(v => v.parentId !== null)
  .map(v => v.parentId as number)
const expanded = ref<Set<number>>(new Set(parentIds))

function toggleExpand(id: number) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

function childrenOf(parentId: number) {
  return mockVenues.filter(v => v.parentId === parentId)
}

const topLevel = computed(() =>
  mockVenues.filter(v => {
    if (v.parentId !== null) return false
    const matchSearch = !search.value || v.name.includes(search.value) || v.location.includes(search.value)
    const matchType = !filterType.value || v.type === filterType.value
    const matchStatus = !filterStatus.value || v.status === filterStatus.value
    return matchSearch && matchType && matchStatus
  })
)

function statusLabel(status: string) {
  return { available: '開放中', maintenance: '維護中', closed: '已關閉' }[status] ?? status
}

function statusClass(status: string) {
  return { available: 'badge-success', maintenance: 'badge-warning', closed: 'badge-error' }[status] ?? ''
}
</script>
