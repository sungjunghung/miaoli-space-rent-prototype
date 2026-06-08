<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import QuickSearch from "./quickSearch.vue";

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 選單單一來源:桌機橫向選單、手機 dropdown、底部 dock 共用
const navLinks = [
  { to: '/', label: '首頁', icon: 'home' },
  { to: '/venues', label: '場館資訊', icon: 'stadium' },
  { to: '/news', label: '最新消息', icon: 'newspaper' },
  { to: '/faq', label: '常見問題', icon: 'help' },
]
const memberLinks = [
  { to: '/member/profile', label: '我的帳戶' },
  { to: '/member/bookings', label: '我的預訂' },
  { to: '/member/refunds', label: '我的退款' },
]
// dock 高亮目前所在頁(首頁需精準比對,其餘比對前綴以涵蓋子頁面)
const isNavActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

const showQuickSearch = ref(false)
const isScrolled = ref(false)
// 租借方式:由 navbar 的 tabs 控制,下傳給 QuickSearch
const searchMode = ref<'daily' | 'multi'>('daily')
// lg 斷點(1024px)以上視為桌機;手機版不自動展開搜尋框,需手動按下搜尋鈕
const isDesktop = ref(window.matchMedia('(min-width: 768px)').matches)
const isHomePage = computed(() => route.path === '/')
const shouldPinQuickSearch = computed(() => isDesktop.value && isHomePage.value && !isScrolled.value)
const isQuickSearchVisible = computed(() => shouldPinQuickSearch.value || showQuickSearch.value)

function toggleQuickSearch() {
  if (shouldPinQuickSearch.value) return
  showQuickSearch.value = !showQuickSearch.value
}

function closeQuickSearch() {
  if (shouldPinQuickSearch.value) return
  showQuickSearch.value = false
}

// 搜尋後一定會前往結果頁,無論是否 pinned 都要重置展開狀態,
// 否則離開首頁後 showQuickSearch 殘留會讓搜尋框繼續展開
function onSearched() {
  showQuickSearch.value = false
}

const handleScroll = () => {
  isScrolled.value = window.scrollY >= 120
}

const desktopMq = window.matchMedia('(min-width: 768px)')
const handleMqChange = (e: MediaQueryListEvent) => {
  isDesktop.value = e.matches
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  desktopMq.addEventListener('change', handleMqChange)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  desktopMq.removeEventListener('change', handleMqChange)
})

const searchConditionsText = computed(() => {
  const q = route.query;
  if (!q.mode) return '搜尋';

  const formatDateShort = (dateStr: any) => {
    if (!dateStr) return '';
    const d = new Date(String(dateStr));
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (q.mode === 'hourly' && q.date) {
    let text = formatDateShort(q.date);
    if (q.time) text += ` ${q.time}`;
    return text;
  }

  if (q.mode === 'daily' && q.startDate) {
    const start = formatDateShort(q.startDate);
    if (q.endDate && q.startDate !== q.endDate) {
      const end = formatDateShort(q.endDate);
      return `${start} - ${end}`;
    }
    return start;
  }

  return '搜尋';
});

function logout() {
  authStore.logout()
  router.push('/login')
}

const SEARCH_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
function onSearchBeforeEnter(el: Element) {
  const node = el as HTMLElement
  node.style.transition = 'none'
  node.style.height = '0'
  node.style.opacity = '0'
  node.style.overflow = 'hidden'
}
function onSearchEnter(el: Element, done: () => void) {
  const node = el as HTMLElement
  // 讀 scrollHeight 會強制 reflow,等同於 commit beforeEnter 的起點
  const target = node.scrollHeight
  node.style.transition = `height 460ms ${SEARCH_EASE}, opacity 320ms ease-out`
  node.style.height = `${target}px`
  node.style.opacity = '1'
  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'height') return
    node.removeEventListener('transitionend', onEnd)
    node.style.transition = ''
    node.style.height = ''
    node.style.opacity = ''
    node.style.overflow = ''
    done()
  }
  node.addEventListener('transitionend', onEnd)
}
function onSearchLeave(el: Element, done: () => void) {
  const node = el as HTMLElement
  // 用固定 height 鎖住當前高度(不是 max-height!),內部子元素之後如何縮放都不影響外殼
  node.style.transition = 'none'
  node.style.height = `${node.scrollHeight}px`
  node.style.opacity = '1'
  node.style.overflow = 'hidden'
  // 強制 reflow:把上面的起點寫入計算樣式
  void node.offsetHeight
  // 套上 transition + 終點
  node.style.transition = `height 320ms ${SEARCH_EASE}, opacity 220ms ease-in`
  node.style.height = '0'
  node.style.opacity = '0'
  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'height') return
    node.removeEventListener('transitionend', onEnd)
    done()
  }
  node.addEventListener('transitionend', onEnd)
}
</script>
<template>

  <div class="w-full rounded-none sticky top-0 transition-all duration-300 z-50 bg-base-100" :class="{
    'backdrop-blur-md shadow-xl bg-base-100/65': isScrolled || isQuickSearchVisible,
  }">
    <div class="navbar">
      <div class="navbar-start w-fit lg:w-1/2">
        <button class="btn btn-ghost text-xl normal-case text-primary" @click="$router.push('/')">
          <img src="../assets/images/logo.svg" alt="" class="w-10">
          <span class="hidden lg:block font-semibold mb-1">苗栗縣體育場館預約系統</span>
        </button>
      </div>
      <div class="navbar-center flex-1 lg:flex-none">
        <div v-if="!isQuickSearchVisible" @click="toggleQuickSearch"
          class=" bg-base-200 rounded-full w-full lg:w-64 px-4 py-2 flex items-center gap-2 cursor-pointer select-none">
          <span class="material-symbols-outlined shrink-0">search</span> <span>{{ searchConditionsText }}</span>
        </div>
        <div v-else role="tablist" class="tabs tabs-sm md:tabs-md xl:tabs-lg tabs-box mx-auto rounded-full w-full">
          <button
            type="button"
            role="tab"
            class="tab rounded-full lg:px-8 flex-1"
            :class="{ 'tab-active bg-secondary text-secondary-content': searchMode === 'daily' }"
            :aria-selected="searchMode === 'daily'"
            @click="searchMode = 'daily'"
          >
          <span class="material-symbols-outlined text-xl lg:text-2xl mr-1">calendar_month</span>
          時段租借</button>
          <button
            type="button"
            role="tab"
            class="tab rounded-full lg:px-8 flex-1"
            :class="{ 'tab-active bg-secondary text-secondary-content': searchMode === 'multi' }"
            :aria-selected="searchMode === 'multi'"
            @click="searchMode = 'multi'"
          >
          <span class="material-symbols-outlined text-xl lg:text-2xl mr-1">group</span>
          多日租借</button>
        </div>
      </div>
      <div class="navbar-end  md:flex w-fit lg:w-1/2">
        <div class="w-18 md:hidden" v-if="isQuickSearchVisible"></div>
        <ul class="menu menu-md xl:menu-lg xl:gap-1 xl:mr-3 text-secondary-700  menu-horizontal hidden lg:flex">
          <li v-for="link in navLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link></li>
        </ul>
        <template v-if="!authStore.isLoggedIn">
          <router-link to="/login" class="btn btn-primary hidden lg:flex">登入</router-link>
        </template>
        <template v-else>
          <div class="dropdown dropdown-end hidden lg:block">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
              <div class="w-10 rounded-full flex items-center justify-center bg-secondary text-primary-content">
                <span class="material-symbols-outlined text-2xl">person</span>
              </div>
            </div>
            <ul tabindex="-1" class="menu dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
              <li v-for="link in memberLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link>
              </li>
              <li><a @click="logout">登出</a></li>
            </ul>
          </div>

        </template>
        <div class="dropdown dropdown-end hidden md:flex lg:hidden">
          <div tabindex="0" role="button" class="btn btn-lg btn-ghost">
            <span class="material-symbols-outlined text-base">menu</span>
          </div>
          <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li v-for="link in navLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link></li>
            <template v-if="authStore.isLoggedIn">
              <li v-for="link in memberLinks" :key="link.to"><router-link :to="link.to">{{ link.label }}</router-link>
              </li>
              <li><a @click="logout">登出</a></li>
            </template>
            <template v-else>
              <li><router-link to="/login">登入</router-link></li>
            </template>
          </ul>
        </div>
      </div>
    </div>
    <!-- 展開的搜尋框 -->
    <Transition
      :css="false"
      @before-enter="onSearchBeforeEnter"
      @enter="onSearchEnter"
      @leave="onSearchLeave"
    >
      <div v-if="isQuickSearchVisible">
        <div class="lg:max-w-1/2 xl:max-w-2/5 mx-auto p-4">
          <QuickSearch v-model:mode="searchMode" @search="onSearched" />
        </div>
      </div>
    </Transition>
  </div>
  <div v-if="showQuickSearch && !shouldPinQuickSearch" class="fixed inset-0 z-40 w-full h-full bg-black/50"
    @click="closeQuickSearch"></div>
  <div class="dock dock-xl bg-neutral text-neutral-content z-50 md:hidden">
    <router-link v-for="link in navLinks" :key="link.to" :to="link.to" :class="{ 'dock-active': isNavActive(link.to) }">
      <span class="material-symbols-outlined text-[1.5rem]">{{ link.icon }}</span>
      <span class="dock-label">{{ link.label }}</span>
    </router-link>
    <router-link v-if="!authStore.isLoggedIn" to="/login" :class="{ 'dock-active': isNavActive('/login') }">
      <span class="material-symbols-outlined text-[1.5rem]">login</span>
      <span class="dock-label">登入</span>
    </router-link>
    <router-link v-else to="/member/profile" :class="{ 'dock-active': route.path.startsWith('/member') }">
      <span class="material-symbols-outlined text-[1.5rem]">account_circle</span>
      <span class="dock-label">會員</span>
    </router-link>
  </div>
</template>

