<template>
	<div class="drawer lg:drawer-open ">
		<input id="my-drawer-4" type="checkbox" class="drawer-toggle peer" v-model="drawerOpen" />
		<div class="drawer-content h-full flex flex-col">

			<!-- Navbar -->
			<nav class="navbar w-full bg-base-100 sticky top-0 z-30">
				<div class="flex-1 flex items-center space-x-1">
					<button v-if="!isTopLevel" class="btn btn-ghost btn-circle" @click="back()">
						<span class="material-symbols-outlined text-xl">arrow_back</span>
					</button>
					<div class="font-bold text-xl ">{{ pageTitle }}</div>
				</div>
				<div class="flex-none space-x-2 flex items-center">
					<span class="font-mono text-base text-base-content/70 tracking-wide pr-2 flex items-center gap-2">
						<span class="material-symbols-outlined inline-block">calendar_month</span>
						{{ todayLabel }}</span>
					<div class="join border border-base-300 mr-2 items-center">
						<button class="join-item btn btn-sm px-3 btn-ghost" @click="decreaseFontSize" :disabled="fontSize <= minFontSize" title="縮小字體">A-</button>
						<button class="join-item btn btn-sm px-2 btn-ghost font-mono text-xs w-14" @click="resetFontSize" title="還原預設">
							{{ Math.round((fontSize / 16) * 100) }}%
						</button>
						<button class="join-item btn btn-sm px-3 btn-ghost" @click="increaseFontSize" :disabled="fontSize >= maxFontSize" title="放大字體">A+</button>
					</div>
					<RouterLink class="btn btn-ghost btn-circle" to="/">
						<span class="material-symbols-outlined">home</span>
					</RouterLink>
					<div class="dropdown dropdown-end">
						<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
							<div class="avatar avatar-placeholder">
								<div class="bg-neutral text-neutral-content w-8 rounded-full">
									<span class="text-xs">UI</span>
								</div>
							</div>
						</div>
						<ul tabindex="-1"
							class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
							<li>
								<router-link to="/admin/profile" class="justify-between">
									個人資料
								</router-link>
							</li>
							<li><router-link to="/admin/login">登出</router-link></li>
						</ul>
					</div>
				</div>
			</nav>
			<div v-if="route.name !== 'admin-index'"
				class="breadcrumbs text-xs px-4 bg-base-100 border-b border-t border-base-300 sticky top-16 z-10 shadow  text-neutral-500">
				<ul>
					<li><router-link to="/admin">後台管理</router-link></li>
					<li v-for="ancestor in breadcrumbs.ancestors" :key="ancestor.to">
						<router-link :to="ancestor.to">{{ ancestor.label }}</router-link>
					</li>
					<li v-if="breadcrumbs.current">{{ breadcrumbs.current }}</li>
				</ul>
			</div>

			<!-- Page content here -->
			<div class="p-4 bg-base-200 flex-1">
				<router-view />
			</div>
		</div>

		<div class="drawer-side is-drawer-close:overflow-visible shadow-xl z-50 transition-transform duration-200 ease-out">
			<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
			<div
				class="flex min-h-full flex-col items-start bg-base-100 border-r border-base-300 transition-[width] duration-200 ease-out is-drawer-close:w-fit is-drawer-open:w-64">
				<!-- 網站名稱 -->
				<div
					class=" is-drawer-close:px-2 px-4 py-3 border-b border-base-300 w-full flex items-center gap-3 overflow-hidden">
					<!-- 假圓形 Logo -->
					<div
						class="w-10 h-10 rounded-full bg-primary shrink-0 flex items-center justify-center shadow-sm is-drawer-close:mx-auto">
						<span class="text-primary-content font-bold text-lg">苗</span>
					</div>

					<div class="is-drawer-close:hidden min-w-0">
						<p class="font-bold text-sm truncate">苗栗縣體育場館預約系統</p>
						<p class="text-xs text-base-content/40 truncate">後台管理系統</p>
					</div>
				</div>
				<!-- Sidebar content here -->
				<ul class="menu menu-lg w-full grow px-2">
					<template v-for="(group, index) in menuGroups" :key="group.title">
						<!-- 分類標題 -->
						<li class="menu-title is-drawer-close:hidden font-bold text-base-content/50"
							:class="index > 0 ? 'mt-4' : ''">
							{{ group.title }}
						</li>
						<!-- 取代上方空位用的隱形標題 (當抽屜合起時，讓間距一致) -->
						<li v-if="index > 0" class="is-drawer-open:hidden mt-2"></li>

						<!-- 選單項目 -->
						<li v-for="item in group.items" :key="item.name">
							<router-link :to="{ name: item.name }"
								class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center"
								:class="{ 'menu-active': item.name === 'admin-index' ? route.name === 'admin-index' : String(route.name).startsWith(item.name) }"
								:data-tip="item.label">
								<span class="material-symbols-outlined inline-block text-xl">{{ item.icon }}</span>
								<span class="is-drawer-close:hidden">{{ item.label }}</span>
							</router-link>
						</li>
					</template>
				</ul>
				<ul class="menu w-full border-t border-base-300">
					<li>
						<label for="my-drawer-4" aria-label="open sidebar" class="btn btn-square btn-ghost w-full">
							<span v-if="!drawerOpen" class="material-symbols-outlined">arrow_menu_open</span>
							<span v-else class="material-symbols-outlined">arrow_menu_close</span>
						</label>
					</li>
				</ul>
			</div>
		</div>
	</div>


</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import mockVenues from '@/mocks/venues.json'
import mockUsers from '@/mocks/users.json'
import mockAdmins from '@/mocks/admins.json'
import mockNews from '@/mocks/news.json'
import mockPermissions from '@/mocks/permissionGroups.json'

const route = useRoute()
const router = useRouter()

const drawerOpen = ref(false)

const savedSize = localStorage.getItem('app-font-size')
const parsedSize = Number(savedSize)
const fontSize = ref(parsedSize && !isNaN(parsedSize) ? parsedSize : 16)
const minFontSize = 12
const maxFontSize = 24

const increaseFontSize = () => {
	if (fontSize.value < maxFontSize) {
		fontSize.value += 1
		localStorage.setItem('app-font-size', fontSize.value.toString())
	}
}

const decreaseFontSize = () => {
	if (fontSize.value > minFontSize) {
		fontSize.value -= 1
		localStorage.setItem('app-font-size', fontSize.value.toString())
	}
}

const resetFontSize = () => {
	fontSize.value = 16
	localStorage.setItem('app-font-size', fontSize.value.toString())
}

watchEffect(() => {
	document.documentElement.style.fontSize = `${fontSize.value}px`
})

const back = () => {
	router.back()
}

const todayLabel = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })

const menuGroups = [
	{
		title: '營運概況',
		items: [
			{ name: 'admin-index', icon: 'dashboard', label: '儀表板' },
			{ name: 'admin-reports', icon: 'bar_chart', label: '營運報表' },
		]
	},
	{
		title: '核心業務',
		items: [
			{ name: 'admin-bookings', icon: 'event_note', label: '預約管理' },
			{ name: 'admin-refunds', icon: 'currency_exchange', label: '退款作業' },
			{ name: 'admin-venues-calendar', icon: 'calendar_month', label: '場館行事曆' },
			{ name: 'admin-venues', icon: 'stadium', label: '場館管理' },
		]
	},
	{
		title: '系統配置',
		items: [
			{ name: 'admin-news', icon: 'newspaper', label: '最新消息' },
			{ name: 'admin-members', icon: 'group', label: '會員管理' },
			{ name: 'admin-admins', icon: 'manage_accounts', label: '管理員管理' },
			{ name: 'admin-permissions', icon: 'shield', label: '權限設定' },
		]
	}
]

const isTopLevel = computed(() => {
	return menuGroups.some(group => group.items.some(item => item.name === route.name))
})

const TITLES: Record<string, string> = {
	'admin-index': '儀表板',
	'admin-venues': '場館管理',
	'admin-venue-edit': '場館編輯',
	'admin-venue-edit-basic': '基本資料',
	'admin-venue-edit-rental-rules': '租借規則',
	'admin-venue-edit-rental': '方案與價格',
	'admin-venue-edit-rental-items': '附加項目',
	'admin-venue-edit-photos': '照片管理',
	'admin-venues-calendar': '場館行事曆',
	'admin-bookings': '預約管理',
	'admin-booking-detail': '預約詳細',
	'admin-refunds': '退款作業',
	'admin-members': '會員管理',
	'admin-member-detail': '會員詳細',
	'admin-admins': '管理員管理',
	'admin-admin-detail': '管理員詳細',
	'admin-permissions': '權限管理',
	'admin-permission-detail': '權限詳細',
	'admin-reports': '營運報表',
	'admin-news': '最新消息',
	'admin-news-edit': '消息編輯',
	'admin-profile': '個人資料',
}

const entityName = computed(() => {
	const name = route.name as string
	const id = route.params.id as string | undefined
	if (!id) return null

	switch (name) {
		case 'admin-venue-edit':
		case 'admin-venue-edit-basic':
		case 'admin-venue-edit-rental-rules':
		case 'admin-venue-edit-rental':
		case 'admin-venue-edit-rental-items':
		case 'admin-venue-edit-photos':
			return mockVenues.find(v => v.id === Number(id))?.name ?? null
		case 'admin-booking-detail': {
			const b = useBookingsStore().getById(Number(id))
			if (!b) return null
			return `${b.reservationId} ${b.venueName} - ${b.applicant}`
		}
		case 'admin-member-detail':
			return mockUsers.find(u => u.id === id)?.name ?? null
		case 'admin-admin-detail':
			return mockAdmins.find(a => a.id === id)?.name ?? null
		case 'admin-permission-detail':
			return mockPermissions.find(p => p.id === id)?.name ?? null
		case 'admin-news-edit':
			return mockNews.find(n => n.id === Number(id))?.title ?? null
		default:
			return null
	}
})

const pageTitle = computed(() => {
	const base = TITLES[route.name as string] ?? '後台管理'
	const entity = entityName.value
	return entity ? `${base}：${entity}` : base
})

watchEffect(() => {
	document.title = `${pageTitle.value} - 苗栗場館租借平台`
})

const breadcrumbs = computed(() => {
	const name = route.name as string
	const id = route.params.id as string | undefined
	const ancestors: Array<{ label: string; to: string }> = []

	const entity = entityName.value

	switch (name) {
		case 'admin-venue-edit':
			ancestors.push({ label: '場館管理', to: '/admin/venues' })
			break
		case 'admin-venues-calendar':
			ancestors.push({ label: '場館管理', to: '/admin/venues' })
			break
		case 'admin-venue-edit-basic':
		case 'admin-venue-edit-rental-rules':
		case 'admin-venue-edit-rental':
		case 'admin-venue-edit-rental-items':
		case 'admin-venue-edit-photos':
			ancestors.push({ label: '場館管理', to: '/admin/venues' })
			if (entity) ancestors.push({ label: entity, to: `/admin/venues/${id}/edit` })
			break
		case 'admin-booking-detail':
			ancestors.push({ label: '預約管理', to: '/admin/bookings' })
			break
		case 'admin-member-detail':
			ancestors.push({ label: '會員管理', to: '/admin/members' })
			break
		case 'admin-admin-detail':
			ancestors.push({ label: '管理員管理', to: '/admin/admins' })
			break
		case 'admin-permission-detail':
			ancestors.push({ label: '權限管理', to: '/admin/permissions' })
			break
		case 'admin-news-edit':
			ancestors.push({ label: '最新消息', to: '/admin/news' })
			break
	}

	return {
		ancestors,
		current: name === 'admin-index' ? null : (TITLES[name] ?? null),
	}
})
</script>
