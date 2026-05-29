<template>
	<!-- Hero Section -->
	<div class="relative min-h-[calc(100dvh-8rem)] lg:min-h-[50dvh] flex items-center justify-center overflow-hidden  pb-4 pt-16 ">
		<!-- Background Image with Overlay -->
		<div class="absolute inset-0 z-0 bg-slate-900">
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

				</div>
			</div>
		</div>
	</div>
	<!-- Main Content Section -->
	<div class="container mx-auto px-4 py-20 space-y-24">

		<!-- Booking Heatmap Calendar -->
		<section>
			<div class="text-center mb-12">
				<h2 class="text-3xl font-heading font-bold text-base-content mb-2">場館預約熱度</h2>
				<p class="text-base-content/60">紅色為該場館已有預約的日期,規劃前可先參考</p>
			</div>
			<div class="bg-base-100 border border-base-200 p-6 rounded-box">
				<label class="form-control mb-4 flex flex-row items-center gap-3">
					<span class="label-text text-sm font-medium text-base-content/70 shrink-0">場館</span>
					<select v-model.number="selectedVenueId" class="select select-bordered w-full max-w-sm">
						<option :value="-1">全部場館(預約熱度)</option>
						<option v-for="v in venueOptions" :key="v.id" :value="v.id">{{ v.name }}</option>
					</select>
				</label>
				<MonthCalendar
					:bookings="filteredBookings"
					:counts="dailyCounts"
					:show-legend="!isAllVenues"
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
			<div class="flex items-end justify-between mb-12">
				<div>
					<h2 class="text-3xl font-heading font-bold text-base-content mb-2">
						最新消息
					</h2>
					<p class="">場館公告、活動資訊與維護通知</p>
				</div>
				<router-link to="/news" class="btn btn-ghost">
					查看全部
					<span class="material-symbols-outlined">arrow_forward</span>
				</router-link>
			</div>

			<!-- 列表版型與 NewsList 內頁一致 -->
			<div class="bg-base-100 border border-base-200 divide-y divide-base-200 overflow-hidden">
				<router-link v-for="item in latestNews" :key="item.id" :to="`/news/${item.id}`"
					class="group block transition-colors hover:bg-base-200/40">
					<article
						class="grid gap-4 p-4 md:p-5 lg:grid-cols-[10rem_minmax(0,1fr)_8.5rem] lg:gap-6 lg:items-center">
						<div class="flex flex-row lg:flex-col lg:items-start items-center gap-3 lg:gap-2 min-w-0">
							<div class="flex items-center gap-2 shrink-0">
								<span v-if="item.pinned" class="badge badge-warning badge-sm">置頂</span>
								<span class="badge badge-neutral badge-sm">{{ item.category }}</span>
							</div>
							<div class="min-w-0">
								<p class="text-xs uppercase tracking-[0.24em] text-base-content/40">News</p>
								<p class="text-sm text-base-content/60 mt-1">{{ formatDate(item.publishedAt) }}</p>
							</div>
						</div>

						<div class="min-w-0">
							<h3
								class="text-lg md:text-xl font-bold leading-snug group-hover:text-primary transition-colors">
								{{ item.title }}
							</h3>
							<p class="mt-2 text-sm md:text-base text-base-content/60 leading-relaxed line-clamp-2">
								{{ item.summary }}
							</p>
							<div class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
								閱讀全文
								<span
									class="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
							</div>
						</div>

						<div class="lg:justify-self-end w-full max-w-36 aspect-4/3 overflow-hidden bg-base-200">
							<img v-if="item.imageUrl" :src="publicImageUrl(item.imageUrl)" :alt="item.title"
								class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
							<div v-else class="flex h-full w-full items-center justify-center">
								<span class="material-symbols-outlined text-4xl text-base-content/20">campaign</span>
							</div>
						</div>
					</article>
				</router-link>
			</div>

			<div class="mt-8 text-center sm:hidden">
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

			<div v-if="bookingsOnSelectedDate.length" class="space-y-2 max-h-96 overflow-y-auto">
				<div v-for="b in bookingsOnSelectedDate" :key="b.id"
					class="flex flex-wrap items-center gap-3 p-3 border border-base-200 rounded-box">
					<div class="flex-1 min-w-0">
						<div class="font-medium truncate">{{ venueNameOf(b.venueId) }}</div>
						<div class="text-sm text-base-content/60">{{ describeBookingTime(b) }}</div>
					</div>
					<span class="badge" :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span>
				</div>
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
import MonthCalendar from '@/components/calendar/MonthCalendar.vue';
import { publicImageUrl } from '@/utils/assets'

// 月曆顯示預約熱度;JSON 型別過寬,用 any 餵給 MonthCalendar 的 BookingRecord[]
const bookings = mockBookings as any[]
const venueOptions = mockVenues.map(v => ({ id: v.id, name: v.name }))
// -1 = 全部場館(熱度模式),其他為特定場館 ID
const selectedVenueId = ref<number>(-1)
const isAllVenues = computed(() => selectedVenueId.value === -1)

const filteredBookings = computed(() =>
  isAllVenues.value ? [] : bookings.filter(b => b.venueId === selectedVenueId.value)
)

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

const STATUS_LABEL: Record<string, string> = {
  reserved: '已預訂',
  document_review: '文件審核中',
  documents_rejected: '文件退回',
  pending_payment: '待繳費',
  payment_review: '繳費審核',
  confirmed: '已確認',
  completed: '已完成',
  cancellation_requested: '取消申請',
  cancelled: '已取消',
  cancelled_expired: '逾期取消',
  cancelled_rejected: '退回取消',
}
const STATUS_BADGE: Record<string, string> = {
  reserved: 'badge-info',
  document_review: 'badge-info',
  documents_rejected: 'badge-error',
  pending_payment: 'badge-warning',
  payment_review: 'badge-warning',
  confirmed: 'badge-success',
  completed: 'badge-success',
  cancellation_requested: 'badge-warning',
  cancelled: 'badge-ghost',
  cancelled_expired: 'badge-ghost',
  cancelled_rejected: 'badge-ghost',
}
function statusLabel(s: string) { return STATUS_LABEL[s] ?? s }
function statusBadgeClass(s: string) { return STATUS_BADGE[s] ?? 'badge-ghost' }

function describeBookingTime(b: any): string {
  if (b.rentalMode === 'daily') {
    if (b.startDate && b.endDate && b.startDate !== b.endDate) {
      return `整日 (${b.startDate.slice(5).replace('-', '/')} ~ ${b.endDate.slice(5).replace('-', '/')})`
    }
    return '整日'
  }
  if (b.rentalMode === 'session') return b.session ?? '-'
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
});

onUnmounted(() => {
	if (intervalId) clearInterval(intervalId);
});
</script>
