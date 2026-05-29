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
						<option v-for="v in venueOptions" :key="v.id" :value="v.id">{{ v.name }}</option>
					</select>
				</label>
				<MonthCalendar :bookings="filteredBookings" />
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import mockNews from "@/mocks/news.json";
import mockBookings from "@/mocks/bookings.json";
import mockVenues from "@/mocks/venues.json";
import MonthCalendar from '@/components/calendar/MonthCalendar.vue';
import { publicImageUrl } from '@/utils/assets'

// 月曆顯示預約熱度;JSON 型別過寬,用 any 餵給 MonthCalendar 的 BookingRecord[]
const bookings = mockBookings as any[]
const venueOptions = mockVenues.map(v => ({ id: v.id, name: v.name }))
const selectedVenueId = ref<number>(venueOptions[0]?.id ?? 0)
const filteredBookings = computed(() => bookings.filter(b => b.venueId === selectedVenueId.value))

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
