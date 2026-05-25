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
      <PageHeaderBasic
        :title="item.title"
        :description="item.summary"
        :bg-image="headerBgImage"
      >
        <div class="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span v-if="item.pinned" class="badge badge-warning gap-1">
            <span class="material-symbols-outlined text-sm">push_pin</span>
            置頂公告
          </span>
          <span class="badge badge-neutral">{{ item.category }}</span>
          <span class="inline-flex items-center gap-1 text-white/80">
            <span class="material-symbols-outlined text-base">calendar_today</span>
            {{ formatDate(item.publishedAt) }}
          </span>
        </div>
      </PageHeaderBasic>

      <div class="container mx-auto px-4 py-10">
        <article class="max-w-4xl mx-auto bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <figure v-if="item.imageUrl" class="aspect-video bg-base-300">
            <img :src="publicImageUrl(item.imageUrl)" :alt="item.title" class="w-full h-full object-cover" />
          </figure>

          <div class="p-6 md:p-10">
            <div class="prose max-w-none prose-base-content">
              <p class="whitespace-pre-line leading-loose text-base md:text-lg">{{ item.content }}</p>
            </div>

            <div class="mt-10 pt-6 border-t border-base-200 flex items-center justify-between gap-3">
              <router-link to="/news" class="btn btn-outline">
                <span class="material-symbols-outlined text-base">list</span>
                回消息列表
              </router-link>
            </div>
          </div>
        </article>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeaderBasic from '@/components/PageHeaderBasic.vue'
import mockNews from '../../../mocks/news.json'
import { publicImageUrl } from '@/utils/assets'

const route = useRoute()
const id = computed(() => Number(route.params.id))

const item = computed(() => mockNews.find(news => news.id === id.value) ?? null)

const headerBgImage = computed(() => item.value?.imageUrl ?? '/assets/images/bg_admin_login.jpg')

function formatDate(date: string) {
  return date.replaceAll('-', '/')
}
</script>
