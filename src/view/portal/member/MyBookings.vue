<template>
  <!-- Header -->
  <PageHeaderBasic
    title="我的預約"
    description="查看預約紀錄、管理訂單與申請退費。"
  />
  <div class="container lg:max-w-4xl mx-auto py-10 px-4">

    <main>
      <div class="flex items-center gap-2 mb-6">
        <select v-model="selectedStatus" class="select select-bordered select-sm">
          <option v-for="f in statusFilters" :key="f.value ?? 'all'" :value="f.value">
            {{ f.label }}（{{ f.count }}）
          </option>
        </select>
      </div>

      <div v-if="bookings.length === 0" class="text-center py-12">
        <p class="">目前沒有預約紀錄</p>
      </div>

      <section v-else class="space-y-4">
        <div v-for="booking in bookings" :key="booking.id"
          :class="['card lg:card-side bg-base-100 shadow cursor-pointer border-t-4 hover:shadow-lg', statusBadge(booking).borderCls]"
          @click="goToDetail(booking.id)">
          <!-- <figure v-if="booking.venueImage"
            class="flex justify-center items-center overflow-hidden  w-1/3 aspect-square  ">
            <img :src="booking.venueImage" :alt="booking.venueName" class="w-full h-full object-cover" />
          </figure> -->
          <div class="card-body flex flex-col">
            <h2 class="card-title flex justify-between">
              <span class=" flex items-center gap-2">
                <span class="material-symbols-outlined text-2xl">event</span>
                {{ booking.reservationId }}
              </span>
              <div class="flex items-center gap-1.5">
                <span v-if="activeStageLabel(booking)" class="badge badge-outline badge-warning">
                  {{ activeStageLabel(booking) }}
                </span>
                <span v-if="booking.status === 'cancellation_requested'" class="badge badge-outline badge-success">
                  申請取消中
                </span>
                <span v-if="cancelReasonLabel(booking)" class="badge badge-outline badge-error">
                  {{ cancelReasonLabel(booking) }}
                </span>
                <span :class="['badge', statusBadge(booking).cls]">{{ statusBadge(booking).label }}</span>
              </div>
            </h2>
            <div class="flex items-center justify-between">
            </div>
            <div class="flex-1">


              <!-- 預約資訊 -->
              <table class="table mb-2">
                <tbody>
                  <!-- <tr>
                    <td class=" w-24">訂單編號</td>
                    <td>{{ booking.reservationId }}</td>
                  </tr> -->
                  <tr>
                    <td class=" w-24">場館名稱</td>
                    <td><strong class=" text-lg font-semibold">{{ booking.venueName }}</strong></td>
                  </tr>
                  <!-- <tr>
                  <td class=" w-20">地點</td>
                  <td>{{ booking.venueLocation }}</td>
                </tr> -->
                  <tr>
                    <td class="">預訂日期</td>
                    <td>{{ formatDate(booking) }}</td>
                  </tr>
                  <tr
                    v-if="booking.status === 'confirmed' && booking.cancelDeadline && booking.cancelDeadline >= today">
                    <td class="">取消期限</td>
                    <td class="text-error">{{ toZhDate(booking.cancelDeadline) }} 前可申請取消</td>
                  </tr>
                  <!-- <tr>
                  <td class="">時間</td>
                  <td>{{ formatTime(booking) }}</td>
                </tr> -->
                  <tr v-if="booking.startTime && booking.endTime">
                    <td class="">使用時間</td>
                    <td>{{ formatTime(booking) }}</td>
                  </tr>
                  <!-- <tr v-if="booking.purpose">
                  <td class="">目的</td>
                  <td>{{ booking.purpose }}</td>
                </tr> -->
                </tbody>
              </table>

              <!-- 預約進度條 -->
              <div class="py-4 border border-base-300 rounded mb-2" v-if="ACTIVE_STATUSES.includes(booking.status)">
                <BookingProgress :booking="booking" :compact="true" />
              </div>

            </div>
            <!-- 底列：階段截止日 + 費用 -->
            <div class="flex items-center justify-between text-sm">
              <div v-if="stageDeadline(booking)"
                class="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-lg bg-base-200">
                <span class="material-symbols-outlined" style="font-size:16px;">schedule</span>
                {{ stageDeadline(booking) }}
              </div>
              <span v-else></span>
              <div class="text-right">
                <span class="text-2xl font-bold">
                  NT$ {{ booking.totalPrice.toLocaleString() }}
                </span>
                <p v-if="booking.deposit" class="text-xs">
                  保證金 NT$ {{ booking.deposit.toLocaleString() }}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHeaderBasic from '@/components/PageHeaderBasic.vue'
import { useAuthStore } from '../../../stores/auth'
import { useBookingsStore, type Booking } from '../../../stores/bookings'
import BookingProgress from '../../../components/BookingProgress.vue'
import { toZhDate, formatBookingDate, formatBookingTime } from '../../../composables/useBookingFormat'

const router = useRouter()
const authStore = useAuthStore()
const bookingsStore = useBookingsStore()

const today = new Date().toISOString().slice(0, 10)

const allBookings = computed(() =>
  authStore.user ? bookingsStore.getByUserId(authStore.user.id) : []
)

const selectedStatus = ref<string | null>(null)

const ACTIVE_STATUSES = ['reserved', 'document_review', 'documents_rejected', 'pending_payment', 'payment_review']
const CONFIRMED_STATUSES = ['confirmed', 'cancellation_requested']
const CANCELLED_STATUSES = ['cancelled', 'cancelled_expired', 'cancelled_rejected']

const bookings = computed(() => {
  const s = selectedStatus.value
  if (!s) return allBookings.value
  if (s === '__active') return allBookings.value.filter(b => ACTIVE_STATUSES.includes(b.status))
  if (s === '__confirmed') return allBookings.value.filter(b => CONFIRMED_STATUSES.includes(b.status))
  if (s === '__cancelled') return allBookings.value.filter(b => CANCELLED_STATUSES.includes(b.status))
  return allBookings.value.filter(b => b.status === s)
})

const statusFilters = computed(() => [
  { value: null, label: '全部', count: allBookings.value.length },
  { value: '__active', label: '預訂中', count: allBookings.value.filter(b => ACTIVE_STATUSES.includes(b.status)).length },
  { value: '__confirmed', label: '預訂成功', count: allBookings.value.filter(b => CONFIRMED_STATUSES.includes(b.status)).length },
  { value: 'completed', label: '已使用', count: allBookings.value.filter(b => b.status === 'completed').length },
  { value: '__cancelled', label: '已取消', count: allBookings.value.filter(b => CANCELLED_STATUSES.includes(b.status)).length },
])

function goToDetail(id: number) {
  router.push(`/member/bookings/${id}`)
}

function statusBadge(booking: Booking): { label: string; cls: string; borderCls: string } {
  if (ACTIVE_STATUSES.includes(booking.status)) return { label: '預訂中', cls: 'badge-warning', borderCls: 'border-warning' }
  if (booking.status === 'confirmed') return { label: '預訂成功', cls: 'badge-success', borderCls: 'border-success' }
  if (booking.status === 'cancellation_requested') return { label: '預訂成功', cls: 'badge-success', borderCls: 'border-success' }
  if (booking.status === 'completed') return { label: '已使用', cls: 'badge-neutral', borderCls: 'border-neutral' }
  if (['cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(booking.status))
    return { label: '已取消', cls: 'badge-error', borderCls: 'border-error' }
  return { label: booking.status, cls: 'badge-ghost', borderCls: 'border-base-300' }
}

function cancelReasonLabel(booking: Booking): string | null {
  if (booking.status === 'cancelled') return '取消成功'
  if (booking.status === 'cancelled_expired') {
    if (booking.requireDocuments && !booking.documentApprovedAt) return '文件逾期'
    return '繳費逾期'
  }
  if (booking.status === 'cancelled_rejected') return '文件審核未通過'
  return null
}

function activeStageLabel(booking: Booking): string | null {
  if (booking.status === 'reserved') {
    return booking.requireDocuments ? '待上傳文件' : '待繳費'
  }
  if (booking.status === 'document_review') return '文件審核中'
  if (booking.status === 'documents_rejected') return '文件退件'
  if (booking.status === 'pending_payment') return '待繳費'
  if (booking.status === 'payment_review') return '繳費審核中'
  return null
}

const formatDate = (b: Booking) => formatBookingDate(b, false)
const formatTime = (b: Booking) => formatBookingTime(b)

function stageDeadline(booking: Booking): string | null {
  if (booking.status === 'reserved' && booking.requireDocuments && booking.documentUploadDeadline) {
    return `文件上傳截止：${toZhDate(booking.documentUploadDeadline)}`
  }
  if (booking.status === 'reserved' && !booking.requireDocuments && booking.receiptUploadDeadline) {
    return `繳費截止：${toZhDate(booking.receiptUploadDeadline)}`
  }
  if (booking.status === 'documents_rejected' && booking.documentUploadDeadline) {
    return `重新上傳截止：${toZhDate(booking.documentUploadDeadline)}`
  }
  if (booking.status === 'pending_payment' && booking.receiptUploadDeadline) {
    return `繳費截止：${toZhDate(booking.receiptUploadDeadline)}`
  }
  return null
}
</script>
