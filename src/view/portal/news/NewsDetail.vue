<template>
  <main class="bg-base-200/60 min-h-screen">
    <div v-if="!item" class="min-h-[70vh] flex items-center justify-center px-4 pt-24">
      <div class="bg-base-100 border border-base-200 rounded-box shadow-sm p-8 max-w-md w-full text-center">
        <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-5">
          <span class="material-symbols-outlined text-3xl text-base-content/40">find_in_page</span>
        </div>
        <h1 class="text-2xl font-bold">找不到此消息</h1>
        <p class="text-base-content/60 mt-2">消息可能已下架，或連結內容不存在。</p>
        <router-link to="/news" class="btn btn-primary mt-6">返回最新消息</router-link>
      </div>
    </div>

    <template v-else>
      <section class="relative bg-neutral pt-28 pb-16 overflow-hidden">
        <img
          v-if="item.imageUrl"
          :src="publicImageUrl(item.imageUrl)"
          :alt="item.title"
          class="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35"></div>

        <div class="container mx-auto px-4 relative z-10">
          <router-link to="/news" class="btn btn-ghost btn-sm text-white/90 mb-8">
            <span class="material-symbols-outlined text-base">arrow_back</span>
            返回最新消息
          </router-link>

          <div class="max-w-4xl text-white">
            <div class="flex items-center gap-2 flex-wrap mb-4">
              <span v-if="item.pinned" class="badge badge-warning gap-1">
                <span class="material-symbols-outlined text-sm">push_pin</span>
                置頂
              </span>
              <span class="badge badge-primary">{{ item.category }}</span>
              <span class="text-sm text-white/70 flex items-center gap-1">
                <span class="material-symbols-outlined text-base">calendar_today</span>
                {{ formatDate(item.publishedAt) }}
              </span>
            </div>

            <h1 class="text-4xl md:text-6xl font-bold leading-tight">{{ item.title }}</h1>
            <p class="mt-5 text-lg md:text-xl leading-relaxed text-white/80 max-w-3xl">{{ item.summary }}</p>
          </div>
        </div>
      </section>

      <div class="container mx-auto px-4 py-10">
        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-8 items-start">
          <article class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
            <figure v-if="item.imageUrl" class="aspect-video bg-base-300">
              <img :src="publicImageUrl(item.imageUrl)" :alt="item.title" class="w-full h-full object-cover" />
            </figure>

            <div class="p-6 md:p-10">
              <div class="prose max-w-none">
                <p class="text-xl leading-relaxed text-base-content/70 font-medium">{{ item.summary }}</p>
                <div class="divider"></div>
                <p class="whitespace-pre-line leading-loose text-lg">{{ item.content }}</p>
              </div>

              <div class="mt-10 pt-6 border-t border-base-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <router-link to="/news" class="btn btn-outline">
                  <span class="material-symbols-outlined text-base">list</span>
                  回消息列表
                </router-link>
                <router-link v-if="nextItem" :to="`/news/${nextItem.id}`" class="btn btn-primary">
                  下一則
                  <span class="material-symbols-outlined text-base">arrow_forward</span>
                </router-link>
              </div>
            </div>
          </article>

          <aside class="space-y-5 lg:sticky lg:top-28">
            <section class="bg-base-100 border border-base-200 rounded-box shadow-sm p-5">
              <h2 class="font-bold mb-4">文章資訊</h2>
              <dl class="space-y-3 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-base-content/50">分類</dt>
                  <dd class="font-semibold">{{ item.category }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-base-content/50">發布日期</dt>
                  <dd class="font-semibold">{{ formatDate(item.publishedAt) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-base-content/50">狀態</dt>
                  <dd class="font-semibold">{{ item.pinned ? '置頂公告' : '一般消息' }}</dd>
                </div>
              </dl>
            </section>

            <section v-if="sameCategoryNews.length" class="bg-base-100 border border-base-200 rounded-box shadow-sm p-5">
              <h2 class="font-bold mb-4">同分類消息</h2>
              <div class="space-y-3">
                <router-link
                  v-for="news in sameCategoryNews"
                  :key="news.id"
                  :to="`/news/${news.id}`"
                  class="block rounded-box border border-base-200 p-3 hover:border-primary hover:bg-base-200/40 transition-colors"
                >
                  <p class="font-semibold leading-snug line-clamp-2">{{ news.title }}</p>
                  <p class="text-xs text-base-content/50 mt-2">{{ formatDate(news.publishedAt) }}</p>
                </router-link>
              </div>
            </section>
          </aside>
        </div>

        <section v-if="others.length" class="mt-10">
          <div class="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 class="text-2xl font-bold">近期其他消息</h2>
              <p class="text-sm text-base-content/50 mt-1">繼續瀏覽更多場館公告與活動資訊</p>
            </div>
            <router-link to="/news" class="btn btn-ghost btn-sm">查看全部</router-link>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <router-link
              v-for="news in others"
              :key="news.id"
              :to="`/news/${news.id}`"
              class="group bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden hover:border-primary hover:shadow-md transition-all"
            >
              <figure class="aspect-video bg-base-300 relative overflow-hidden">
                <img
                  v-if="news.imageUrl"
                  :src="publicImageUrl(news.imageUrl)"
                  :alt="news.title"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div v-else class="absolute inset-0 flex items-center justify-center">
                  <span class="material-symbols-outlined text-5xl text-base-content/20">campaign</span>
                </div>
              </figure>
              <div class="p-5">
                <div class="flex items-center gap-2 text-xs text-base-content/50">
                  <span class="badge badge-outline badge-sm">{{ news.category }}</span>
                  <span>{{ formatDate(news.publishedAt) }}</span>
                </div>
                <h3 class="mt-3 font-bold leading-snug group-hover:text-primary transition-colors">{{ news.title }}</h3>
              </div>
            </router-link>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import mockNews from '../../../mocks/news.json'
import { publicImageUrl } from '@/utils/assets'

const route = useRoute()
const id = computed(() => Number(route.params.id))

const sortedNews = computed(() =>
  [...mockNews].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.publishedAt.localeCompare(a.publishedAt)
  })
)

const item = computed(() => mockNews.find(news => news.id === id.value) ?? null)

const sameCategoryNews = computed(() => {
  if (!item.value) return []
  return sortedNews.value
    .filter(news => news.id !== item.value!.id && news.category === item.value!.category)
    .slice(0, 3)
})

const others = computed(() =>
  sortedNews.value.filter(news => news.id !== id.value).slice(0, 3)
)

const nextItem = computed(() => {
  const index = sortedNews.value.findIndex(news => news.id === id.value)
  if (index < 0) return null
  return sortedNews.value[index + 1] ?? sortedNews.value[0] ?? null
})

function formatDate(date: string) {
  return date.replaceAll('-', '/')
}
</script>
