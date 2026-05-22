<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeaderBasic from '@/components/PageHeaderBasic.vue'
import faqData from '../../../mocks/faq.json'

interface FaqItem {
  question: string
  answer: string
}

interface FaqSection {
  title: string
  items: FaqItem[]
}

interface DisplayFaqItem extends FaqItem {
  index: number
}

interface DisplayFaqSection {
  title: string
  index: number
  items: DisplayFaqItem[]
}

const sections = faqData as FaqSection[]
const search = ref('')
const activeSection = ref(0)
const openIndex = ref<string | null>('0-0')

const totalQuestions = computed(() =>
  sections.reduce((total, section) => total + section.items.length, 0)
)

const filteredSections = computed<DisplayFaqSection[]>(() => {
  const keyword = search.value.trim().toLowerCase()

  return sections
    .map((section, sectionIndex) => {
      const sectionMatched = section.title.toLowerCase().includes(keyword)
      const items = section.items
        .map((item, itemIndex) => ({ ...item, index: itemIndex }))
        .filter(item => {
          if (!keyword || sectionMatched) return true
          return [item.question, item.answer].some(value => value.toLowerCase().includes(keyword))
        })

      return {
        title: section.title,
        index: sectionIndex,
        items,
      }
    })
    .filter(section => section.items.length > 0)
})

const popularQuestions = computed(() =>
  sections.flatMap((section, sectionIndex) =>
    section.items.slice(0, 1).map((item, itemIndex) => ({
      ...item,
      key: `${sectionIndex}-${itemIndex}`,
      sectionTitle: section.title,
    }))
  )
)

function toggleItem(sectionIndex: number, itemIndex: number) {
  const key = `${sectionIndex}-${itemIndex}`
  openIndex.value = openIndex.value === key ? null : key
}

function selectSection(index: number) {
  activeSection.value = index
  openIndex.value = `${index}-0`
  document.getElementById(`faq-section-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function clearSearch() {
  search.value = ''
}

function iconForSection(title: string) {
  if (title.includes('租借')) return 'event_available'
  if (title.includes('費用')) return 'payments'
  if (title.includes('場地')) return 'stadium'
  if (title.includes('帳號') || title.includes('會員')) return 'account_circle'
  return 'help'
}
</script>

<template>
  <PageHeaderBasic
    title="常見問題與注意事項"
    description="整理租借流程、費用付款、場地使用與會員帳號常見疑問。"
    bg-image="/assets/images/bg_admin_login.jpg"
  />

  <main class="bg-base-200/60 min-h-screen">
    <div class="container lg:max-w-6xl mx-auto px-4 py-10 space-y-8">
      <section class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-4">
        <div class="bg-base-100 border border-base-200 rounded-box shadow-sm p-5 md:p-6">
          <div class="flex flex-col md:flex-row gap-4 md:items-center">
            <div class="flex-1">
              <h2 class="text-2xl font-bold">需要協助嗎？</h2>
              <p class="text-base-content/60 mt-2">輸入關鍵字，或從分類快速找到對應規定。</p>
            </div>
            <label class="input w-full md:max-w-md">
              <span class="material-symbols-outlined text-base-content/40">search</span>
              <input v-model="search" type="search" placeholder="搜尋問題、付款、取消、保證金" />
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-base-100 border border-base-200 rounded-box shadow-sm p-5">
            <p class="text-sm text-base-content/50">問題數</p>
            <p class="text-3xl font-bold mt-1">{{ totalQuestions }}</p>
          </div>
          <div class="bg-base-100 border border-base-200 rounded-box shadow-sm p-5">
            <p class="text-sm text-base-content/50">分類</p>
            <p class="text-3xl font-bold mt-1">{{ sections.length }}</p>
          </div>
        </div>
      </section>

      <section v-if="!search" class="bg-base-100 border border-base-200 rounded-box shadow-sm p-5 md:p-6">
        <div class="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 class="text-xl font-bold">常用問題</h2>
            <p class="text-sm text-base-content/50 mt-1">每個分類最常被查詢的入口</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            v-for="item in popularQuestions"
            :key="item.key"
            class="text-left border border-base-200 rounded-box p-4 hover:border-primary hover:bg-base-200/40 transition-colors"
            @click="openIndex = item.key"
          >
            <span class="badge badge-outline badge-sm">{{ item.sectionTitle }}</span>
            <p class="font-semibold leading-snug mt-3">{{ item.question }}</p>
          </button>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-6 items-start">
        <aside class="lg:sticky lg:top-28 bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
          <div class="p-4 border-b border-base-200">
            <h2 class="font-bold">問題分類</h2>
          </div>
          <nav class="p-2">
            <button
              v-for="section in sections"
              :key="section.title"
              class="w-full flex items-center gap-3 rounded-box px-3 py-3 text-left hover:bg-base-200 transition-colors"
              :class="{ 'bg-primary text-primary-content hover:bg-primary': activeSection === sections.indexOf(section) && !search }"
              @click="selectSection(sections.indexOf(section))"
            >
              <span class="material-symbols-outlined text-xl">{{ iconForSection(section.title) }}</span>
              <span class="font-medium flex-1">{{ section.title }}</span>
              <span
                class="badge badge-sm"
                :class="activeSection === sections.indexOf(section) && !search ? 'badge-ghost text-primary-content border-primary-content/40' : 'badge-ghost'"
              >
                {{ section.items.length }}
              </span>
            </button>
          </nav>
        </aside>

        <section class="space-y-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold">問題列表</h2>
              <p class="text-sm text-base-content/50 mt-1">
                <template v-if="search">搜尋「{{ search }}」：{{ filteredSections.reduce((total, section) => total + section.items.length, 0) }} 筆結果</template>
                <template v-else>依分類瀏覽所有常見問題</template>
              </p>
            </div>
            <button v-if="search" class="btn btn-ghost btn-sm" @click="clearSearch">清除搜尋</button>
          </div>

          <template v-if="filteredSections.length">
            <div
              v-for="section in filteredSections"
              :id="`faq-section-${section.index}`"
              :key="section.title"
              class="bg-base-100 border border-base-200 rounded-box shadow-sm scroll-mt-28"
            >
              <div class="p-5 md:p-6 border-b border-base-200 flex items-center gap-3">
                <span class="material-symbols-outlined text-2xl text-primary">{{ iconForSection(section.title) }}</span>
                <div>
                  <h3 class="text-xl font-bold">{{ section.title }}</h3>
                  <p class="text-sm text-base-content/50">{{ section.items.length }} 個問題</p>
                </div>
              </div>

              <div class="divide-y divide-base-200">
                <article
                  v-for="item in section.items"
                  :key="`${section.index}-${item.index}`"
                  class="p-5 md:p-6"
                >
                  <button
                    class="w-full flex items-start justify-between gap-4 text-left"
                    @click="toggleItem(section.index, item.index)"
                  >
                    <span class="font-bold text-lg leading-snug">{{ item.question }}</span>
                    <span
                      class="material-symbols-outlined shrink-0 transition-transform mt-0.5"
                      :class="openIndex === `${section.index}-${item.index}` ? 'rotate-180 text-primary' : 'text-base-content/40'"
                    >
                      expand_more
                    </span>
                  </button>
                  <div v-if="openIndex === `${section.index}-${item.index}`" class="mt-4 text-base-content/70 leading-relaxed">
                    {{ item.answer }}
                  </div>
                </article>
              </div>
            </div>
          </template>

          <div v-else class="bg-base-100 border border-base-200 rounded-box shadow-sm p-10 text-center">
            <span class="material-symbols-outlined text-5xl text-base-content/25">manage_search</span>
            <p class="font-semibold mt-3">沒有符合條件的問題</p>
            <button class="btn btn-primary btn-sm mt-4" @click="clearSearch">查看全部問題</button>
          </div>
        </section>
      </div>

      <section class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
        <div class="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-6 lg:items-center">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold">找不到您的問題？</h2>
              <p class="text-base-content/60 mt-2">可直接聯繫服務人員，協助確認場館租借、付款或取消規定。</p>
            </div>
          </div>
          <a href="tel:037-320-025" class="btn btn-primary btn-lg">
            <span class="material-symbols-outlined">call</span>
            <span class="font-mono">037-320-025</span>
          </a>
        </div>
      </section>
    </div>
  </main>
</template>
