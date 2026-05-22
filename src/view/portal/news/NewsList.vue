<template>
  <!-- Header -->
  <PageHeaderBasic
    title="最新消息"
    description="場館公告、系統更新與活動資訊不漏接。"
    bg-image="/assets/images/bg_admin_login.jpg"
  />

  <main class="bg-base-200/60 min-h-screen">
    <div class="container mx-auto px-4 py-10 space-y-8">
      <section class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold">消息列表</h2>
            <p class="text-sm text-base-content/50 mt-1">共 {{ newsList.length }} 筆消息</p>
          </div>
        </div>

        <div v-if="newsList.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <router-link
            v-for="item in newsList"
            :key="item.id"
            :to="`/news/${item.id}`"
            class="group bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden hover:border-primary hover:shadow-md transition-all"
          >
            <figure class="relative aspect-video bg-base-300 overflow-hidden">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.title"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div v-else class="absolute inset-0 flex items-center justify-center bg-base-200">
                <span class="material-symbols-outlined text-5xl text-base-content/20">campaign</span>
              </div>
              <div class="absolute left-3 top-3 flex gap-2">
                <span v-if="item.pinned" class="badge badge-warning badge-sm">置頂</span>
                <span class="badge badge-neutral badge-sm">{{ item.category }}</span>
              </div>
            </figure>

            <div class="p-5">
              <p class="text-sm text-base-content/50 flex items-center gap-1">
                <span class="material-symbols-outlined text-base">calendar_today</span>
                {{ formatDate(item.publishedAt) }}
              </p>
              <h3 class="mt-3 text-lg font-bold leading-snug group-hover:text-primary transition-colors">
                {{ item.title }}
              </h3>
              <p class="mt-3 text-sm text-base-content/60 leading-relaxed line-clamp-3">{{ item.summary }}</p>
              <div class="mt-5 flex items-center text-sm font-semibold text-primary">
                閱讀全文
                <span class="material-symbols-outlined text-base ml-1 transition-transform group-hover:translate-x-1">arrow_forward</span>
              </div>
            </div>
          </router-link>
        </div>

        <div v-else class="bg-base-100 border border-base-200 rounded-box p-10 text-center">
          <span class="material-symbols-outlined text-5xl text-base-content/25">campaign</span>
          <p class="font-semibold mt-3">目前沒有消息</p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageHeaderBasic from '@/components/PageHeaderBasic.vue'
import mockNews from '../../../mocks/news.json'

const newsList = computed(() =>
  [...mockNews].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.publishedAt.localeCompare(a.publishedAt)
  })
)

function formatDate(date: string) {
  return date.replaceAll('-', '/')
}
</script>
