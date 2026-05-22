<template>
	<!-- Hero Section -->
	<div class="relative min-h-screen flex items-center justify-center overflow-hidden  pb-4 pt-16">
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
				class="absolute inset-0 bg-linear-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40 z-10 pointer-events-none">
			</div>
			<div
				class="absolute inset-0 bg-linear-to-t from-base-50 via-transparent to-transparent opacity-90 z-10 pointer-events-none">
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

				<!-- Quick Search Component -->
				<div class="w-full max-w-5xl animate-fade-in-up [animation-delay:800ms]">
					<QuickSearch />
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Section -->
	<div class="container mx-auto px-4 py-20">

		<!-- Purpose Selection -->
		<section class="mb-24">
			<div class="text-center mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold mb-4">依照您的需求挑選場地</h2>
				<p class=" text-lg max-w-2xl mx-auto">我們將場地依照用途分類，讓您能更快速找到最適合的活動空間</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div v-for="p in purposes" :key="p.id" class="card bg-base-100 shadow" :class="p.cardHoverClass">
					<div class="card-body items-center text-center">
						<span class="material-symbols-outlined text-6xl group-hover:scale-110 transition-transform"
							:class="p.textClass">{{ p.icon }}</span>
						<h3 class="card-title" :class="p.textClass">{{ p.title }}</h3>
						<p class=" text-sm">{{ p.desc }}</p>
					</div>
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

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<router-link v-for="item in latestNews" :key="item.id" :to="`/news/${item.id}`"
					class="card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer group">
					<figure v-if="item.imageUrl" class="aspect-video">
						<img :src="publicImageUrl(item.imageUrl)" :alt="item.title"
							class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
					</figure>
					<div class="card-body">
						<!-- Meta details -->
						<div class="flex flex-wrap items-center gap-2 mb-2 text-sm ">
							<span v-if="item.pinned" class="badge badge-warning badge-sm gap-1">
								<span class="material-symbols-outlined text-[14px]">push_pin</span>
								置頂
							</span>
							<span class="badge badge-outline badge-sm">{{ item.category }}</span>
							<span class="ml-auto flex items-center gap-1">
								<span class="material-symbols-outlined text-[14px]">calendar_today</span>
								{{ item.publishedAt }}
							</span>
						</div>
						<!-- Title & summary -->
						<h3 class="card-title text-lg group-hover: transition-colors line-clamp-2">
							{{ item.title }}
						</h3>
						<p class=" text-sm line-clamp-3 mt-2">{{ item.summary }}</p>
					</div>
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
import { ref, onMounted, onUnmounted } from 'vue';
import QuickSearch from "../../components/quickSearch.vue";
import mockNews from "@/mocks/news.json";
import { publicImageUrl } from '@/utils/assets'

// 載入所有圖片資源
const imageModules = import.meta.glob('@/assets/images/*.{jpg,jpeg,png}', { eager: true });
const images = Object.values(imageModules).map((mod: any) => mod.default || mod);

const currentImageIndex = ref(0);
const previousImageIndex = ref(-1);
const shuffledImages = ref<string[]>([]);
let intervalId: any = null;

const purposes = [
	{
		id: 'sports', title: '運動賽事', desc: '籃球、羽球、田徑場地，符合國際賽事標準',
		icon: 'sports_basketball',
		cardHoverClass: 'hover:border-info',
		textClass: 'text-info'
	},
	{
		id: 'events', title: '活動展演', desc: '專業舞台、音響設備，適合演出與大型展覽',
		icon: 'theater_comedy',
		cardHoverClass: 'hover:border-secondary',
		textClass: 'text-secondary'
	},
	{
		id: 'business', title: '會議課程', desc: '多功能會議室、講座廳，完善投影設備',
		icon: 'business_center',
		cardHoverClass: 'hover:border-warning',
		textClass: 'text-warning'
	},
	{
		id: 'family', title: '親子體驗', desc: '安全舒適的戶外空間，適合家庭休閒活動',
		icon: 'family_restroom',
		cardHoverClass: 'hover:border-error',
		textClass: 'text-error'
	},
]

// 取前三筆最新消息：優先置頂，再依日期排序
const latestNews = [...mockNews].sort((a, b) => {
	if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
	return b.publishedAt.localeCompare(a.publishedAt)
}).slice(0, 3)

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
