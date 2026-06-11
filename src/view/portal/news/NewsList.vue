<template>
  <!-- Header -->
  <!-- <PageHeaderBasic
    title="最新消息"
    description="場館公告、系統更新與活動資訊不漏接。"
    bg-image="/assets/images/bg_admin_login.jpg"
  /> -->

  <header>
    <div class=" container mx-auto px-4 py-4 lg:py-10">
      <h1 class="text-2xl lg:text-8xl text-secondary">NEWS</h1>
      <p class="lg:text-xl ml-1 text-primary">最新消息</p>
    </div>
  </header>
  
  <main class="bg-base-200/60 min-h-screen">
    <div class="container mx-auto px-4 lg:py-10">
      <div class="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">

        <!-- 左側目錄篩選 -->
        <aside class="lg:sticky lg:top-24 lg:self-start">
          <p class="uppercase tracking-[0.24em] text-base-content/40 mb-3 hidden lg:block">分類</p>

          <!-- 手機:下拉選單 -->
          <select v-model="selectedCategory" class="select w-full lg:hidden">
            <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
              {{ cat.label }}（{{ cat.count }}）
            </option>
          </select>

          <!-- 桌機:垂直清單 -->
          <ul class="hidden lg:flex lg:flex-col gap-1">
            <li v-for="cat in categoryOptions" :key="cat.value">
              <button
                type="button"
                class="w-full text-left whitespace-nowrap px-3 py-2 rounded-md text-sm transition-colors"
                :class="selectedCategory === cat.value
                  ? 'bg-primary text-primary-content font-semibold'
                  : 'hover:bg-base-200 text-base-content/70'"
                @click="selectedCategory = cat.value"
              >
                {{ cat.label }}
                <span class="ml-1 text-xs opacity-70">({{ cat.count }})</span>
              </button>
            </li>
          </ul>
        </aside>

        <!-- 右側消息列表:一則一個獨立橫幅 -->
        <section class="space-y-4">
          <router-link
            v-for="item in filteredNews"
            :key="item.id"
            :to="`/news/${item.id}`"
            class="group block bg-base-100 border border-base-200 hover:border-primary hover:shadow-md transition-all"
          >
            <article class="grid gap-4 p-4 md:p-8 lg:grid-cols-[10rem_minmax(0,1fr)_8.5rem] lg:gap-6 lg:items-center">
              <div class="flex flex-row lg:flex-col lg:items-start items-center gap-3 lg:gap-2 min-w-0">
                <div class="flex items-center gap-2 shrink-0">
                  <span v-if="item.pinned" class="badge badge-warning badge-sm">置頂</span>
                  <span class="badge badge-neutral badge-sm">{{ item.category }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-sm text-base-content/60 mt-1">{{ formatDate(item.publishedAt) }}</p>
                </div>
              </div>

              <div class="min-w-0">
                <h3 class="text-lg md:text-xl font-bold leading-snug group-hover:text-primary transition-colors">
                  {{ item.title }}
                </h3>
                <p class="mt-2 text-sm md:text-base text-base-content/60 leading-relaxed line-clamp-2">
                  {{ item.summary }}
                </p>
                <div class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  閱讀全文
                  <span class="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </div>

              <div class="order-first lg:order-none w-full lg:max-w-36 aspect-video lg:aspect-4/3 overflow-hidden rounded-md lg:rounded-none bg-base-200 lg:justify-self-end">
                <img
                  v-if="item.imageUrl"
                  :src="publicImageUrl(item.imageUrl)"
                  :alt="item.title"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <span class="material-symbols-outlined text-4xl text-base-content/20">campaign</span>
                </div>
              </div>
            </article>
          </router-link>

          <div v-if="filteredNews.length === 0" class="bg-base-100 border border-base-200 p-10 text-center">
            <span class="material-symbols-outlined text-5xl text-base-content/25">campaign</span>
            <p class="font-semibold mt-3">此分類目前沒有消息</p>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import mockNews from '../../../mocks/news.json'
import { publicImageUrl } from '@/utils/assets'

const selectedCategory = ref<string>('all')

const sortedNews = computed(() =>
  [...mockNews].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.publishedAt.localeCompare(a.publishedAt)
  })
)

const categoryOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const n of sortedNews.value) {
    counts.set(n.category, (counts.get(n.category) ?? 0) + 1)
  }
  const all = { value: 'all', label: '全部', count: sortedNews.value.length }
  const cats = [...counts.entries()].map(([value, count]) => ({ value, label: value, count }))
  return [all, ...cats]
})

const filteredNews = computed(() => {
  if (selectedCategory.value === 'all') return sortedNews.value
  return sortedNews.value.filter(n => n.category === selectedCategory.value)
})

function formatDate(date: string) {
  return date.replaceAll('-', '/')
}
</script>
