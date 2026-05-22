<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import allVenues from '@/mocks/venues.json'
import PageHeaderBasic from '@/components/PageHeaderBasic.vue'

const router = useRouter()

const availableVenues = computed(() => allVenues.filter(venue => venue.status === 'available'))

function goToDetail(id: number) {
  router.push({ name: 'venue-detail', params: { id } })
}

function modeLabels(venue: any) {
  const labels = []
  if (venue.rentalModes?.hourly?.enabled) labels.push('小時')
  if (venue.rentalModes?.session?.enabled) labels.push('時段')
  if (venue.rentalModes?.daily?.enabled) labels.push('整日')
  return labels
}

function lowestPrice(venue: any) {
  const prices: number[] = []
  if (venue.rentalModes?.hourly?.enabled) {
    if (venue.pricing?.hourly?.weekday) prices.push(venue.pricing.hourly.weekday)
    if (venue.pricing?.hourly?.weekend) prices.push(venue.pricing.hourly.weekend)
  }
  if (venue.rentalModes?.session?.enabled) {
    for (const session of venue.rentalModes.session.sessions ?? []) {
      if (session.weekday) prices.push(session.weekday)
      if (session.weekend) prices.push(session.weekend)
    }
  }
  if (venue.rentalModes?.daily?.enabled) {
    if (venue.pricing?.daily?.weekday) prices.push(venue.pricing.daily.weekday)
    if (venue.pricing?.daily?.weekend) prices.push(venue.pricing.daily.weekend)
  }
  return prices.length ? `NT$ ${Math.min(...prices).toLocaleString()}` : '洽詢'
}
</script>

<template>
  <PageHeaderBasic
    title="場地列表"
    description="立即查看 available 時段，快速找到理想空間。"
    bg-image="/assets/images/bg_admin_login.jpg"
  />

  <main class="bg-base-200/60 min-h-screen">
    <div class="container mx-auto px-4 py-10 space-y-8">
      <section class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 class="text-2xl font-bold">場館結果</h2>
          <p class="text-sm text-base-content/50 mt-1">共 {{ availableVenues.length }} 個可租借場地</p>
        </div>
      </section>

      <section v-if="availableVenues.length === 0" class="bg-base-100 border border-base-200 rounded-box shadow-sm p-10 text-center">
        <span class="material-symbols-outlined text-6xl text-base-content/25">event_busy</span>
        <h3 class="text-xl font-bold mt-4">目前沒有可租借場地</h3>
        <p class="text-base-content/60 mt-2">請稍後再回來查看。</p>
      </section>

      <section v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <article
          v-for="venue in availableVenues"
          :key="venue.id"
          class="group bg-base-100 border border-base-200 rounded-box shadow-sm overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer"
          @click="goToDetail(venue.id)"
        >
          <figure class="relative aspect-[4/3] bg-base-300 overflow-hidden">
            <img
              :src="venue.mainImageUrl"
              :alt="venue.name"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div class="absolute left-3 top-3 flex gap-2 flex-wrap">
              <span class="badge badge-primary">{{ venue.status === 'available' ? '可租借' : '維護中' }}</span>
              <span class="badge badge-neutral">{{ venue.type }}</span>
            </div>
            <div class="absolute left-4 bottom-4 text-white">
              <h3 class="text-xl font-bold leading-tight">{{ venue.name }}</h3>
              <p class="text-sm text-white/80 mt-1">{{ lowestPrice(venue) }} 起</p>
            </div>
          </figure>

          <div class="p-5 space-y-4">
            <div class="space-y-2 text-sm text-base-content/70">
              <p class="flex items-start gap-2">
                <span class="material-symbols-outlined text-lg text-base-content/40 mt-0.5">location_on</span>
                <span>{{ venue.location }}</span>
              </p>
              <p class="flex items-center gap-2">
                <span class="material-symbols-outlined text-lg text-base-content/40">groups</span>
                {{ venue.capacity.toLocaleString() }} 人
              </p>
            </div>

            <div class="flex gap-2 flex-wrap">
              <span v-for="mode in modeLabels(venue)" :key="mode" class="badge badge-outline badge-sm">{{ mode }}</span>
              <span v-for="facility in venue.facilities.slice(0, 3)" :key="facility" class="badge badge-ghost badge-sm">{{ facility }}</span>
              <span v-if="venue.facilities.length > 3" class="badge badge-ghost badge-sm">+{{ venue.facilities.length - 3 }}</span>
            </div>

            <div class="pt-2 flex items-center justify-between border-t border-base-200">
              <span class="text-sm text-base-content/50 line-clamp-1">{{ venue.description }}</span>
              <span class="btn btn-ghost btn-sm shrink-0">
                詳情
                <span class="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
              </span>
            </div>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>
