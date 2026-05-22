<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import QuickSearch from "../components/quickSearch.vue";

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isMenuOpen = ref(false)
const showQuickSearch = ref(false)
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
</script>

<template>
  <div class="w-full rounded-none fixed z-40 transition-all duration-300 text-primary-content p-4"
    :class="{ 'bg-base-100/35 backdrop-blur-md shadow-sm text-base-content! p-0!': isScrolled }">
    <div class="navbar">
      <div class="navbar-start">
        <button class="btn btn-ghost text-xl">
          <img src="../assets/images/logo.svg" alt="" class="w-10">
          <span class="hidden md:block font-semibold">苗栗縣體育場館預約系統</span>
        </button>
      </div>
      <div class="navbar-center">
        <div class="relative">
          <button class="btn rounded-full btn-outline w-64 flex-nowrap" @click="showQuickSearch = !showQuickSearch">
            <span class="material-symbols-outlined shrink-0">search</span>
            <span class="truncate">{{ searchConditionsText }}</span>
          </button>

          <!-- 背景遮罩，點擊收合 -->
          <div v-if="showQuickSearch" class="fixed inset-0 z-40" @click="showQuickSearch = false"></div>

          <!-- 展開的搜尋框 -->
          <div v-if="showQuickSearch"
            class="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] md:w-auto md:min-w-[450px] z-50">
            <QuickSearch @search="showQuickSearch = false" />
          </div>
        </div>
      </div>
      <div class="navbar-end">
        <ul class="menu menu-lg menu-horizontal gap-4 hidden lg:flex mr-6">
          <li><router-link to="/">首頁</router-link></li>
          <li><router-link to="/venues">場館資訊</router-link></li>
          <li><router-link to="/news">最新消息</router-link></li>
          <li><router-link to="/faq">常見問題</router-link></li>

          <template v-if="!authStore.isLoggedIn">
            <li> <router-link to="/login" class="btn btn-neutral">登入</router-link></li>
            <li><router-link to="/register" class="btn btn-neutral">註冊</router-link></li>
          </template>
          <template v-else>
            <li>
              <details>
                <summary> {{ authStore.user?.name }}</summary>
                <ul class="bg-base-100 p-2 w-52 text-base-content right-0 left-auto! shadow z-10">
                  <li>
                    <router-link to="/member/profile">我的帳戶</router-link>
                  </li>
                  <li><router-link to="/member/bookings">我的預訂</router-link></li>
                  <li><router-link to="/member/refunds">我的退款</router-link></li>
                  <li><a @click="logout">登出</a></li>
                </ul>
              </details>
            </li>

          </template>
        </ul>
        <button class="btn btn-ghost lg:hidden" @click="isMenuOpen = !isMenuOpen">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </button>
      </div>
    </div>
    <div v-show="isMenuOpen" class="lg:hidden bg-base-100/95 backdrop-blur shadow-md w-full border-t border-base-200">
      <template v-if="authStore.isLoggedIn">
        <div class="flex items-center gap-2 border-b border-base-200 p-4" tabindex="0" role="button">
          <div class="avatar avatar-placeholder">
            <div class="bg-neutral text-neutral-content w-8 rounded-full">
              <span class="text-xs">{{ authStore.user?.name.charAt(0) }}</span>
            </div>
          </div>
          <div class="flex-1">
            <p class="font-semibold">{{ authStore.user?.name }}</p>
            <p class="text-base-content/60 text-xs">{{ authStore.user?.email }}</p>
          </div>
        </div>
      </template>
      <ul class="menu w-full p-2" @click="isMenuOpen = false">
        <li><router-link to="/">首頁</router-link></li>
        <li><router-link to="/venues">場館資訊</router-link></li>
        <li><router-link to="/news">最新消息</router-link></li>
        <li><router-link to="/faq">常見問題</router-link></li>
        <template v-if="authStore.isLoggedIn">
          <li><router-link to="/member/profile">我的帳戶</router-link></li>
          <li><router-link to="/member/bookings">我的預訂</router-link></li>
          <li><router-link to="/member/refunds">我的退款</router-link></li>
          <li><a @click="logout">登出</a></li>
        </template>
        <template v-else>
          <li><router-link to="/login">登入</router-link></li>
          <li><router-link to="/register">註冊</router-link></li>
        </template>
      </ul>
    </div>
  </div>

</template>
