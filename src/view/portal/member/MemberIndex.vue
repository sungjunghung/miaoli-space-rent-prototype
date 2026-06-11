<template>
  <main class="container mx-auto px-4 py-6 space-y-6">
    <!-- 會員資訊卡 -->
    <section class="bg-base-100 border border-base-200 rounded-box shadow-sm p-5">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center bg-secondary text-primary-content shrink-0">
          <span class="material-symbols-outlined text-3xl">person</span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-bold text-lg truncate">{{ user?.name || '會員' }}</p>
          <p class="text-sm text-base-content/50 truncate">{{ user?.email }}</p>
          <span class="badge badge-soft badge-secondary badge-sm mt-1">{{ identityLabel }}</span>
        </div>
        <router-link to="/member/profile" class="btn btn-ghost btn-sm btn-circle self-start" aria-label="編輯帳戶">
          <span class="material-symbols-outlined text-xl text-base-content/60">edit</span>
        </router-link>
      </div>
      <div class="divider my-4"></div>
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-2xl text-primary">savings</span>
        <div>
          <p class="text-xs text-base-content/50">留存保證金</p>
          <p class="font-bold">NT$ {{ retainedDeposit.toLocaleString() }}</p>
        </div>
      </div>
    </section>

    <!-- 功能選單 -->
    <section class="bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden">
      <ul class="menu w-full p-0">
        <li v-for="link in memberLinks" :key="link.to">
          <router-link :to="link.to" class="flex items-center gap-3 py-4 rounded-none">
            <span class="material-symbols-outlined text-2xl text-base-content/70">{{ link.icon }}</span>
            <span class="flex-1">{{ link.label }}</span>
            <span class="material-symbols-outlined text-base text-base-content/30">chevron_right</span>
          </router-link>
        </li>
      </ul>
    </section>

    <!-- 登出 -->
    <button class="btn btn-outline btn-error w-full" @click="logout">
      <span class="material-symbols-outlined text-base">logout</span>
      登出
    </button>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const IDENTITY_MAP: Record<string, string> = {
  general: '一般民眾',
  government: '政府機關 / 公部門',
  school: '學校單位 / 學生組織',
  company: '企業法人 / 公司行號',
  npo: '非營利組織 / 人民團體',
}

const memberLinks = [
  { to: '/member/bookings', label: '我的預訂', icon: 'event_available' },
  { to: '/member/refunds', label: '我的退款', icon: 'currency_exchange' },
]

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)
const retainedDeposit = computed(() => user.value?.retainedDeposit ?? 0)
const identityLabel = computed(() => IDENTITY_MAP[user.value?.identityType || 'general'])

// 此頁是手機版會員首頁;桌機改用導覽列的頭像選單,直接帶往帳戶頁
onMounted(() => {
  if (window.matchMedia('(min-width: 768px)').matches) {
    router.replace('/member/profile')
  }
})

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
