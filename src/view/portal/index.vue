<template>
	<!-- Hero Section -->
	<div class="relative min-h-[calc(100dvh-5rem-env(safe-area-inset-bottom))] lg:min-h-[50dvh] flex items-center justify-center py-10 ">
		<!-- Background Image with Overlay -->
		<div class="absolute inset-0 z-0 bg-slate-900 overflow-hidden">
			<div class="absolute -inset-y-[35%] inset-x-0 will-change-transform" :style="heroParallaxStyle">
				<div v-for="(img, index) in shuffledImages" :key="img"
					class="absolute inset-0 w-full h-full bg-cover bg-center scale-105 transition-transform duration-[20s]"
					:class="{
						'opacity-100 z-0': index === currentImageIndex,
						'opacity-0 -z-10': index !== currentImageIndex,
						'animate-ken-burns': index === currentImageIndex || index === previousImageIndex
					}" :style="{
						backgroundImage: `url('${img}')`,
						transition: 'opacity 2s ease-in-out'
					}"></div>
			</div>
			<div
				class="absolute inset-0 bg-linear-to-r from-slate-900/70 via-slate-900/50 to-slate-900/20 z-10 pointer-events-none">
			</div>
			<div
				class="absolute inset-0 bg-linear-to-t from-base-30 via-transparent to-transparent opacity-90 z-10 pointer-events-none">
			</div>
		</div>

		<!-- Hero Content -->
		<div class="container mx-auto px-4 z-10 relative">
			<div class="flex flex-col items-center justify-center gap-10">
				<!-- Text Content -->
				<div class="text-center space-y-8 max-w-3xl">
					
					<div class="space-y-4">
						<h1
							class="text-4xl sm:text-5xl lg:text-7xl font-heading font-extrabold text-white leading-[1.1] tracking-tight animate-fade-in-up [animation-delay:200ms]">
							苗栗
							<span
								class="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">最佳活動空間</span>
						</h1>
						<p
							class="text-lg lg:text-xl text-slate-300 font-medium max-w-xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:400ms]">
							無論是國際賽事、商務會議還是親子活動，我們提供多元專業的場地選擇，滿足您的一站式租借需求。
						</p>
					</div>
					<!-- 行動版首頁搜尋:桌機由頁首釘選的搜尋列負責,故僅手機顯示 -->
					<div class="lg:hidden rounded-box bg-base-100 backdrop-blur-md p-4 shadow-xl text-left space-y-3">
						<div role="tablist" class="relative flex w-full rounded-full bg-base-200 p-1">
							<span
								class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-secondary shadow transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
								:class="searchMode === 'multi' ? 'translate-x-full' : 'translate-x-0'"></span>
							<button type="button" role="tab"
								class="relative z-10 flex-1 flex items-center justify-center rounded-full py-2 transition-colors duration-300"
								:class="searchMode === 'daily' ? 'text-secondary-content' : 'text-base-content/60'"
								:aria-selected="searchMode === 'daily'" @click="searchMode = 'daily'">
								<img src="@/assets/images/daily.svg" alt="" class="w-5 mr-2">
								時段租借
							</button>
							<button type="button" role="tab"
								class="relative z-10 flex-1 flex items-center justify-center rounded-full py-2 transition-colors duration-300"
								:class="searchMode === 'multi' ? 'text-secondary-content' : 'text-base-content/60'"
								:aria-selected="searchMode === 'multi'" @click="searchMode = 'multi'">
								<img src="@/assets/images/multi.svg" alt="" class="w-5 mr-2">
								多日租借
							</button>
						</div>
						<QuickSearch v-model:mode="searchMode" />
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- Main Content Section -->
	<div class="container mx-auto">

		<!-- Booking Heatmap Calendar -->
		<section>
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-6 lg:px-0 lg:py-8">
				<div>
					<h2 class="text-xl lg:text-3xl font-heading font-bold text-base-content mb-2">
						場館預約概況
					</h2>
					<p class="">紅色為該場館已有預約的日期,規劃前可先參考</p>
				</div>
				<select v-model.number="selectedVenueId" class="select select-bordered w-full sm:max-w-xs">
					<option :value="-1">全部場館(預約熱度)</option>
					<option v-for="v in venueOptions" :key="v.id" :value="v.id">{{ v.name }}</option>
				</select>
			</header>
	
			<div class="bg-base-100 border border-base-200 p-6 rounded-box">
	
				<MonthCalendar
					:bookings="filteredBookings"
					:counts="dailyCounts"
					:cell-events="cellEvents"
					:show-legend="!isAllVenues"
					:default-view="calendarDefaultView"
					viewable
					@select-date="onCalendarDayClick"
				/>
				<!-- 熱度模式專屬圖例 -->
				<div v-if="isAllVenues" class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-base-content/70">
					<span>預約場館數:</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/15 border border-error/20"></span>1</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/25 border border-error/30"></span>2-3</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/40 border border-error/50"></span>4-6</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/60 border border-error/70"></span>7-9</span>
					<span class="inline-flex items-center gap-1"><span class="w-3 h-3 rounded bg-error/80 border border-error/90"></span>10+</span>
				</div>
			</div>
		</section>

		<!-- News Section -->
		<section>
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-6 lg:px-0 lg:py-8">
				<div>
					<h2 class="text-3xl font-heading font-bold text-base-content mb-2">
						最新消息
					</h2>
					<p class="">場館公告、活動資訊與維護通知</p>
				</div>
				<router-link to="/news" class="btn btn-ghost self-start sm:self-auto hidden lg:inline-flex">
					查看全部
					<span class="material-symbols-outlined">arrow_forward</span>
				</router-link>
			</header>

			<!-- 列表版型與 NewsList 內頁一致 -->
			<div class="bg-base-100 border border-base-200 divide-y divide-base-200 overflow-hidden">
				<router-link v-for="item in latestNews" :key="item.id" :to="`/news/${item.id}`"
					class="group block transition-colors hover:bg-base-200/40">
					<article
						class="flex items-center gap-4 p-4 md:p-5 lg:grid lg:grid-cols-[10rem_minmax(0,1fr)_8.5rem] lg:gap-6 lg:items-center">
						<!-- 文字區:桌機用 contents 攤平成 meta / content 兩欄,手機則為圖片左側的縱向欄 -->
						<div class="flex flex-col gap-1 min-w-0 flex-1 lg:contents">
							<div class="flex flex-row lg:flex-col lg:items-start items-center gap-2 min-w-0">
								<div class="flex items-center gap-2 shrink-0">
									<span v-if="item.pinned" class="badge badge-warning badge-sm">置頂</span>
									<span class="badge badge-neutral badge-sm">{{ item.category }}</span>
								</div>
								<p class="text-xs uppercase tracking-[0.24em] text-base-content/40 hidden lg:block">News</p>
								<p class="text-xs lg:text-sm text-base-content/60 lg:mt-1">{{ formatDate(item.publishedAt) }}</p>
							</div>

							<div class="min-w-0">
								<h3
									class="text-base md:text-xl font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
									{{ item.title }}
								</h3>
								<p class="mt-1 lg:mt-2 text-sm md:text-base text-base-content/60 leading-relaxed line-clamp-2 hidden sm:block">
									{{ item.summary }}
								</p>
								<div class="mt-3 lg:mt-4 hidden lg:inline-flex items-center gap-1 text-sm font-semibold text-primary">
									閱讀全文
									<span
										class="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
								</div>
							</div>
						</div>

						<div class="w-24 sm:w-32 lg:w-auto lg:max-w-36 shrink-0 aspect-square lg:aspect-4/3 overflow-hidden rounded-md lg:rounded-none bg-base-200 lg:justify-self-end">
							<img v-if="item.imageUrl" :src="publicImageUrl(item.imageUrl)" :alt="item.title"
								class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
							<div v-else class="flex h-full w-full items-center justify-center">
								<span class="material-symbols-outlined text-4xl text-base-content/20">campaign</span>
							</div>
						</div>
					</article>
				</router-link>
			</div>

			<div class="mt-8 text-center sm:hidden px-4 mb-12">
				<router-link to="/news" class="btn btn-outline w-full">
					查看全部消息
				</router-link>
			</div>
		</section>
	</div>

	<!-- 預約清單 modal:點月曆某天時顯示當日的預約簡要列表 -->
	<dialog ref="bookingsModal" class="modal">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-1">{{ formatLongDate(selectedDate) }} 預約清單</h3>
			<p class="text-sm text-base-content/60 mb-4">
				{{ isAllVenues ? '全部場館' : venueNameOf(selectedVenueId) }} · 共 {{ bookingsOnSelectedDate.length }} 筆
			</p>

			<div v-if="bookingsOnSelectedDate.length" class="space-y-2 max-h-96 overflow-y-auto" data-lenis-prevent>
				<router-link v-for="b in bookingsOnSelectedDate" :key="b.id"
					:to="`/venues/${venueDetailId(b.venueId)}`"
					@click="closeBookingsModal"
					class="flex items-center justify-between gap-3 p-3 border border-base-200 rounded-box hover:bg-base-200/60 hover:border-base-300 transition-colors">
					<div class="min-w-0 flex justify-between items-center gap-4 flex-1">
						<div class="font-medium truncate">{{ venueNameOf(b.venueId) }}</div>
						<div class="text-sm text-base-content/60">{{ describeBookingTime(b) }}</div>
					</div>
					<span class="material-symbols-outlined text-base-content/40 shrink-0">chevron_right</span>
				</router-link>
			</div>
			<div v-else class="text-center py-10 text-base-content/50">當日無預約</div>

			<div class="modal-action">
				<button type="button" class="btn" @click="closeBookingsModal">關閉</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop"><button>close</button></form>
	</dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import mockNews from "@/mocks/news.json";
import mockBookings from "@/mocks/generateBookings";
import mockVenues from "@/mocks/venues.json";
import MonthCalendar from '@/components/portal/calendar/MonthCalendar.vue';
import QuickSearch from '@/components/portal/quickSearch.vue';
import { publicImageUrl } from '@/utils/assets'

// 行動版首頁搜尋的租借方式:daily=時段租借、multi=多日租借
const searchMode = ref<'daily' | 'multi'>('daily')

// 月曆顯示預約熱度;JSON 型別過寬,用 any 餵給 MonthCalendar 的 BookingRecord[]
const bookings = mockBookings as any[]
const venueOptions = mockVenues.map(v => ({ id: v.id, name: v.name }))
// -1 = 全部場館(熱度模式),其他為特定場館 ID
const selectedVenueId = ref<number>(-1)
const isAllVenues = computed(() => selectedVenueId.value === -1)

const filteredBookings = computed(() =>
  isAllVenues.value ? [] : bookings.filter(b => b.venueId === selectedVenueId.value)
)

// 行動版(<lg)月曆預設顯示「週」,桌機顯示「月」
const calendarMq = window.matchMedia('(max-width: 1023px)')
const calendarDefaultView = ref<'week' | 'month'>(calendarMq.matches ? 'week' : 'month')
const onCalendarMqChange = (e: MediaQueryListEvent) => {
  calendarDefaultView.value = e.matches ? 'week' : 'month'
}
onMounted(() => calendarMq.addEventListener('change', onCalendarMqChange))
onUnmounted(() => calendarMq.removeEventListener('change', onCalendarMqChange))

// 熱度模式:聚合每天有多少筆預約跨越該日(daily 含 start~end 區間,hourly 取當日)
const dailyCounts = computed<Record<string, number>>(() => {
  if (!isAllVenues.value) return {}
  const out: Record<string, number> = {}
  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  for (const b of bookings) {
    const startStr: string | undefined = b.startDate ?? b.date
    const endStr: string | undefined = b.endDate ?? b.date
    if (!startStr) continue
    const s = new Date(`${startStr}T00:00:00`)
    const e = new Date(`${endStr ?? startStr}T00:00:00`)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) continue
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = toKey(d)
      out[key] = (out[key] ?? 0) + 1
    }
  }
  return out
})

// ── 點日期 → 預約清單 modal ──
const bookingsModal = ref<HTMLDialogElement | null>(null)
const selectedDate = ref<string>('')
const venueMap = new Map<number, string>(mockVenues.map(v => [v.id, v.name]))
function venueNameOf(id: number): string {
  return venueMap.get(id) ?? `#${id}`
}

// 子場館(parentId 非空)→ 連回母場館詳情頁
const venueParentMap = new Map<number, number>()
for (const v of mockVenues as any[]) {
  if (v.parentId) venueParentMap.set(v.id, v.parentId)
}
function venueDetailId(id: number): number {
  return venueParentMap.get(id) ?? id
}

// 預載每個場館的時段名稱 → 時間區,讓 session 預約顯示「上午 08:00-12:00」之類
const sessionTimesByVenue = new Map<number, Record<string, { startTime: string; endTime: string }>>()
for (const v of mockVenues) {
  const sessions = (v as any).rentalModes?.session?.sessions
  if (!Array.isArray(sessions)) continue
  const map: Record<string, { startTime: string; endTime: string }> = {}
  for (const s of sessions) {
    if (s?.name) map[s.name] = { startTime: s.startTime, endTime: s.endTime }
  }
  sessionTimesByVenue.set(v.id, map)
}

// 拆成 { primary, time } 兩段,讓格子可以「主要文字一行 + 時間一行」呈現
type BookingParts = { primary: string; time?: string }
function bookingParts(b: any): BookingParts {
  if (b.rentalMode === 'daily') {
    if (b.startDate && b.endDate && b.startDate !== b.endDate) {
      return { primary: '整日', time: `${b.startDate.slice(5).replace('-', '/')} ~ ${b.endDate.slice(5).replace('-', '/')}` }
    }
    return { primary: '整日' }
  }
  if (b.rentalMode === 'session') {
    if (!b.session) return { primary: '-' }
    const range = sessionTimesByVenue.get(b.venueId)?.[b.session]
    return range ? { primary: b.session, time: `${range.startTime}-${range.endTime}` } : { primary: b.session }
  }
  if (b.rentalMode === 'hourly') return { primary: `${b.startTime ?? ''}-${b.endTime ?? ''}` }
  return { primary: '' }
}

// 每天的事件清單(全部場館:label=場館名,time=時段;特定場館:label=時段,time=細節時間)
const cellEvents = computed<Record<string, { label: string; time?: string }[]>>(() => {
  const out: Record<string, { label: string; time?: string }[]> = {}
  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const pool = isAllVenues.value ? bookings : bookings.filter(b => b.venueId === selectedVenueId.value)
  for (const b of pool) {
    const startStr = b.startDate ?? b.date
    const endStr = b.endDate ?? b.date
    if (!startStr) continue
    const s = new Date(`${startStr}T00:00:00`)
    const e = new Date(`${endStr ?? startStr}T00:00:00`)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) continue
    const parts = bookingParts(b)
    // 全部場館模式:場館名 + 時段時間分兩行(空間有限,場館名單獨一行較易讀)
    // 特定場館模式:整行不斷行,label 與 time 合成單行字串顯示
    const entry = isAllVenues.value
      ? { label: venueNameOf(b.venueId), time: parts.time ? `${parts.primary} ${parts.time}` : parts.primary }
      : { label: parts.time ? `${parts.primary} ${parts.time}` : parts.primary }
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = toKey(d)
      if (!out[key]) out[key] = []
      out[key].push(entry)
    }
  }
  return out
})

function describeBookingTime(b: any): string {
  if (b.rentalMode === 'daily') {
    if (b.startDate && b.endDate && b.startDate !== b.endDate) {
      return `整日 (${b.startDate.slice(5).replace('-', '/')} ~ ${b.endDate.slice(5).replace('-', '/')})`
    }
    return '整日'
  }
  if (b.rentalMode === 'session') {
    if (!b.session) return '-'
    const range = sessionTimesByVenue.get(b.venueId)?.[b.session]
    return range ? `${b.session} ${range.startTime}-${range.endTime}` : b.session
  }
  if (b.rentalMode === 'hourly') return `${b.startTime ?? ''} - ${b.endTime ?? ''}`
  return '-'
}

const bookingsOnSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  const target = selectedDate.value
  const pool = isAllVenues.value ? bookings : bookings.filter(b => b.venueId === selectedVenueId.value)
  return pool
    .filter(b => {
      if (b.rentalMode === 'daily') {
        const start = b.startDate ?? b.date
        const end = b.endDate ?? b.date
        return target >= start && target <= end
      }
      return b.date === target
    })
    .sort((a, b) => {
      if (a.venueId !== b.venueId) return a.venueId - b.venueId
      const aTime = a.startTime || a.session || ''
      const bTime = b.startTime || b.session || ''
      return aTime.localeCompare(bTime)
    })
})

// 桌機在格子內直接顯示前 2 筆;點任一天則都開 modal 看完整清單(任意尺寸)
function onCalendarDayClick(dateStr: string) {
  selectedDate.value = dateStr
  bookingsModal.value?.showModal()
}

function closeBookingsModal() {
  bookingsModal.value?.close()
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${y} 年 ${parseInt(m ?? '1')} 月 ${parseInt(d ?? '1')} 日`
}

// 載入所有圖片資源
const imageModules = import.meta.glob('@/assets/images/*.{jpg,jpeg,png}', { eager: true });
const images = Object.values(imageModules).map((mod: any) => mod.default || mod);

const currentImageIndex = ref(0);
const previousImageIndex = ref(-1);
const shuffledImages = ref<string[]>([]);
let intervalId: any = null;

// 取前三筆最新消息：優先置頂，再依日期排序
const latestNews = [...mockNews].sort((a, b) => {
	if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
	return b.publishedAt.localeCompare(a.publishedAt)
}).slice(0, 3)

function formatDate(date: string) {
	return date.replaceAll('-', '/')
}

const heroParallaxOffset = ref(0);
let heroParallaxTicking = false;
function onHeroParallaxScroll() {
	if (heroParallaxTicking) return;
	heroParallaxTicking = true;
	requestAnimationFrame(() => {
		heroParallaxOffset.value = window.scrollY * 0.35;
		heroParallaxTicking = false;
	});
}
const heroParallaxStyle = computed(() => ({
	transform: `translate3d(0, ${heroParallaxOffset.value}px, 0)`,
}));

onMounted(() => {
	if (images.length > 0) {
		// 隨機打亂陣列
		shuffledImages.value = [...images].sort(() => Math.random() - 0.5);

		intervalId = setInterval(() => {
			let nextIndex = Math.floor(Math.random() * shuffledImages.value.length);
			// 確保不與當前圖片重複
			if (nextIndex === currentImageIndex.value && shuffledImages.value.length > 1) {
				nextIndex = (nextIndex + 1) % shuffledImages.value.length;
			}
			previousImageIndex.value = currentImageIndex.value;
			currentImageIndex.value = nextIndex;
		}, 5000); // 每 5 秒切換一次
	}
	window.addEventListener('scroll', onHeroParallaxScroll, { passive: true });
});

onUnmounted(() => {
	if (intervalId) clearInterval(intervalId);
	window.removeEventListener('scroll', onHeroParallaxScroll);
});
</script>
