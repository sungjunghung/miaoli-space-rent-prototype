<script setup lang="ts">
import { computed, ref } from 'vue'
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
  <!-- <PageHeaderBasic title="常見問題與注意事項" description="整理租借流程、費用付款、場地使用與會員帳號常見疑問。"
    bg-image="/assets/images/bg_admin_login.jpg" /> -->

  <header>
    <div class=" container mx-auto px-4 py-4 lg:py-10">
      <h1 class="text-2xl lg:text-8xl text-secondary">FAQ</h1>
      <p class="lg:text-xl ml-1 text-primary">常見問題</p>
    </div>
  </header>
  
  <main class="bg-base-200/60 min-h-screen">
    <div class="container mx-auto px-4 py-4 lg:py-10 space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-6 items-start">
        <aside class="hidden lg:block lg:sticky lg:top-28 bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
          <div class="p-4 border-b border-base-200">
            <h2 class="font-bold">問題分類</h2>
          </div>
          <nav class="p-2">
            <button v-for="section in sections" :key="section.title"
              class="w-full flex items-center gap-3 rounded-box px-3 py-3 text-left hover:bg-base-200 transition-colors"
              :class="{ 'bg-primary text-primary-content hover:bg-primary': activeSection === sections.indexOf(section) && !search }"
              @click="selectSection(sections.indexOf(section))">
              <span class="material-symbols-outlined text-xl">{{ iconForSection(section.title) }}</span>
              <span class="font-medium flex-1">{{ section.title }}</span>
              <span class="badge badge-sm"
                :class="activeSection === sections.indexOf(section) && !search ? 'badge-ghost text-primary-content border-primary-content/40' : 'badge-ghost'">
                {{ section.items.length }}
              </span>
            </button>
          </nav>
        </aside>

        <section class="space-y-5">
  
          <label class="input w-full md:max-w-md">
            <span class="material-symbols-outlined text-base-content/40">search</span>
            <input v-model="search" type="search" placeholder="搜尋問題、付款、取消、保證金" />
          </label>

          <template v-if="filteredSections.length">
            <div v-for="section in filteredSections" :id="`faq-section-${section.index}`" :key="section.title"
              class="bg-base-100 border border-base-200 rounded-box shadow-sm scroll-mt-28">
              <div class="p-5 md:p-6 border-b border-base-200 flex items-center gap-3">
                <span class="material-symbols-outlined text-2xl text-primary">{{ iconForSection(section.title) }}</span>
                <div>
                  <h3 class="text-xl font-bold">{{ section.title }}</h3>
                  <p class="text-sm text-base-content/50">{{ section.items.length }} 個問題</p>
                </div>
              </div>

              <div class="divide-y divide-base-200">
                <article v-for="item in section.items" :key="`${section.index}-${item.index}`" class="p-5 md:p-6">
                  <button class="w-full flex items-start justify-between gap-4 text-left"
                    @click="toggleItem(section.index, item.index)">
                    <span class="font-bold text-lg leading-snug">{{ item.question }}</span>
                    <span class="material-symbols-outlined shrink-0 transition-transform mt-0.5"
                      :class="openIndex === `${section.index}-${item.index}` ? 'rotate-180 text-primary' : 'text-base-content/40'">
                      expand_more
                    </span>
                  </button>
                  <div v-if="openIndex === `${section.index}-${item.index}`"
                    class="mt-4 text-base-content/70 leading-relaxed">
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
    </div>
  </main>
</template>
