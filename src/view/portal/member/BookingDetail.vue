<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeaderBasic from '@/components/portal/PageHeaderBasic.vue'
import { useAuthStore } from '../../../stores/auth'
import { useBookingsStore, type Booking } from '../../../stores/bookings'
import BookingProgress from '../../../components/portal/BookingProgress.vue'
import mockVenues from '../../../mocks/venues.json'
import {
  toZhDate, formatBookingDate, formatBookingTime, RENTAL_MODE_LABELS,
} from '../../../composables/useBookingFormat'
import {
  REFUND_STEPS, getRefundStepState, REFUND_TYPE_LABELS, REFUND_STATUS_LABELS
} from '../../../composables/useBookingStatus'

const route = useRoute()
const authStore = useAuthStore()
const bookingsStore = useBookingsStore()

const bookingId = Number(route.params.id)

const booking = computed<Booking | undefined>(() => {
  if (!authStore.isLoggedIn) return undefined
  return bookingsStore.getById(bookingId)
})

const contact = computed(() => ({
  name: authStore.user?.name ?? '—',
  phone: authStore.user?.phone ?? '—',
  email: authStore.user?.email ?? '—',
}))

const today = new Date().toISOString().slice(0, 10)

const venue = computed(() => {
  if (!booking.value) return null
  return mockVenues.find(v => v.id === booking.value!.venueId) ?? null
})
const cancellationDeadlineDays = computed(() => (venue.value as any)?.cancellationDeadlineDays ?? 7)

const cancellationDeadlineDate = computed(() => {
  if (!booking.value) return null
  const eventDate = booking.value.startDate ?? booking.value.date
  const d = new Date(eventDate)
  d.setDate(d.getDate() - cancellationDeadlineDays.value)
  return d.toISOString().slice(0, 10)
})

const canCancel = computed(() => {
  if (!booking.value) return false
  const s = booking.value.status
  if (['confirmed', 'completed', 'cancellation_requested',
    'cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(s)) return false
  // 需要文件審核且文件已通過 → 需走申請取消流程，不可直接取消
  if (booking.value.requireDocuments && booking.value.documentApprovedAt) return false
  return !booking.value.cancelDeadline || booking.value.cancelDeadline >= today
})

const canRequestCancellation = computed(() => {
  if (!booking.value) return false
  const s = booking.value.status
  if (['completed', 'cancellation_requested',
    'cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(s)) return false
  // confirmed：一定走申請取消
  if (s === 'confirmed') {
    return !cancellationDeadlineDate.value || today <= cancellationDeadlineDate.value
  }
  // 需要文件且文件已通過（pending_payment / payment_review）：也需申請取消
  if (booking.value.requireDocuments && booking.value.documentApprovedAt) {
    return !booking.value.cancelDeadline || booking.value.cancelDeadline >= today
  }
  return false
})

const cancelModalOpen = ref(false)
const cancelReason = ref('')

const remittance = ref({ last5: '', amount: '', datetime: '', senderName: '', note: '' })
const uploadError = ref('')
const paymentProof = ref<string | null>(null)

const handleReceiptUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (!validTypes.includes(file.type)) { uploadError.value = '僅支援 JPG、PNG 或 PDF 格式'; return }
  if (file.size > 5 * 1024 * 1024) { uploadError.value = '檔案大小不能超過 5MB'; return }
  uploadError.value = ''
  paymentProof.value = file.name // TODO: 串接上傳 API
  input.value = ''
}

const formatDate = (b: Booking) => formatBookingDate(b, false)
const formatTime = (b: Booking) => formatBookingTime(b)
const rentalModeLabel = computed(() => RENTAL_MODE_LABELS[booking.value?.rentalMode ?? ''] ?? '')

function submitCancellationRequest() {
  // TODO: 串接取消申請 API → status 變為 cancellation_requested
  cancelModalOpen.value = false
}

const ACTIVE_STATUSES = ['reserved', 'document_review', 'documents_rejected', 'pending_payment', 'payment_review']

function statusBadge(b: Booking): { label: string; cls: string; borderCls: string } {
  if (ACTIVE_STATUSES.includes(b.status)) return { label: '預訂中', cls: 'badge-warning', borderCls: 'border-warning' }
  if (b.status === 'confirmed') return { label: '預訂成功', cls: 'badge-success', borderCls: 'border-success' }
  if (b.status === 'cancellation_requested') return { label: '預訂成功', cls: 'badge-success', borderCls: 'border-success' }
  if (b.status === 'completed') return { label: '已使用', cls: 'badge-neutral', borderCls: 'border-neutral' }
  if (['cancelled', 'cancelled_expired', 'cancelled_rejected'].includes(b.status))
    return { label: '已取消', cls: 'badge-error', borderCls: 'border-error' }
  return { label: b.status, cls: 'badge-ghost', borderCls: 'border-base-300' }
}

function cancelReasonLabel(b: Booking): string | null {
  if (b.status === 'cancelled') return '取消成功'
  if (b.status === 'cancelled_expired') {
    if (b.requireDocuments && !b.documentApprovedAt) return '文件逾期'
    return '繳費逾期'
  }
  if (b.status === 'cancelled_rejected') return '文件審核未通過'
  return null
}

function activeStageLabel(b: Booking): string | null {
  if (b.status === 'reserved') {
    return b.requireDocuments ? '待上傳文件' : '待繳費'
  }
  if (b.status === 'document_review') return '文件審核中'
  if (b.status === 'documents_rejected') return '文件退件'
  if (b.status === 'pending_payment') return '待繳費'
  if (b.status === 'payment_review') return '繳費審核中'
  return null
}

const hasDocumentPhase = computed(() => booking.value?.requireDocuments ?? false)

const showDocumentSection = computed(() => {
  if (!hasDocumentPhase.value) return false
  const s = booking.value?.status
  return s && ['reserved', 'document_review', 'documents_rejected',
    'pending_payment', 'payment_review', 'confirmed', 'completed',
    'cancellation_requested', 'cancelled_expired', 'cancelled_rejected', 'cancelled'].includes(s)
})

const showPaymentSection = computed(() => {
  const s = booking.value?.status
  if (!s) return false
  if (['pending_payment', 'payment_review', 'confirmed', 'completed',
    'cancellation_requested', 'cancelled'].includes(s)) return true
  // 不需文件審核：從 reserved 起就可繳費
  if (s === 'reserved' && !booking.value?.requireDocuments) return true
  return false
})

const canUploadDocuments = computed(() => {
  const s = booking.value?.status
  return s === 'reserved' || s === 'documents_rejected'
})

// ── 退費相關 ──
const hasRefund = computed(() => !!booking.value?.refund && booking.value.refund.status !== 'none')

function getStepState(stepKey: string) {
  if (!booking.value?.refund) return 'future'
  return getRefundStepState(booking.value.refund.status, stepKey as any)
}

const handleDocUpload = (_docKey: string, event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (!validTypes.includes(file.type)) { alert('僅支援 JPG、PNG 或 PDF 格式'); return }
  if (file.size > 5 * 1024 * 1024) { alert('檔案大小不能超過 5MB'); return }
  // TODO: 串接上傳 API
  input.value = ''
}
</script>

<template>
  <!-- Header -->
  <PageHeaderBasic
    title="預約詳情"
    :description="`預約編號：#${booking?.id ?? '—'}`"
  />
  <!-- Not found -->
  <div v-if="!booking" class="max-w-2xl mx-auto py-10 px-4 space-y-4">
    <div class="alert alert-error"><span>找不到此預約資料</span></div>
    <div class="text-center">
      <router-link to="/member/bookings" class="btn btn-primary">返回我的預約</router-link>
    </div>
  </div>

  <!-- Content -->
  <div v-else class="container lg:max-w-4xl mx-auto py-10 px-4 space-y-4">
    <div class="pb-4 flex items-center gap-2">
      <router-link to="/member/bookings" class="btn btn-ghost btn-circle">
        <span class="material-symbols-outlined text-2xl">arrow_back</span>
      </router-link>
      <strong class="text-xl">
        {{ booking.reservationId }}
      </strong>
      <div class="flex items-center gap-1.5">
        <span v-if="booking.refund && booking.refund.status !== 'none'" class="badge badge-outline badge-ghost">
          {{ REFUND_TYPE_LABELS[booking.refund.refundType] ?? '退費' }}·{{
            REFUND_STATUS_LABELS[booking.refund.status]?.label ?? booking.refund.status }}
        </span>
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
    </div>

    <!-- 狀態提示區 -->
    <!-- 已完成使用 -->
    <div v-if="booking.status === 'completed'" class="alert alert-info mb-2 shadow-sm">
      <span class="material-symbols-outlined shrink-0 text-3xl">check_circle</span>
      <div>
        <h4 class="font-bold">租借已結束</h4>
        <p class="text-sm opacity-90 mt-1">感謝您的使用，本次租借已圓滿完成。</p>
      </div>
    </div>

    <!-- 退件取消 / 逾期取消 / 已取消 -->
    <div v-if="booking.status.startsWith('cancelled')" class="alert alert-error mb-2 shadow-sm">
      <span class="material-symbols-outlined shrink-0 text-3xl">cancel</span>
      <div>
        <h4 class="font-bold">預約已取消</h4>
        <p class="text-sm opacity-90 mt-1">{{ booking.cancelReason || '逾期或未符合資格，系統/管理員已取消。' }}</p>
      </div>
    </div>

    <!-- ① 進度條卡 -->
    <div
      v-if="['reserved', 'document_review', 'documents_rejected', 'pending_payment', 'payment_review'].includes(booking.status)"
      class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body py-4 px-5">
        <h3 class="card-title text-sm  mb-2">預約進度</h3>
        <BookingProgress :booking="booking" :compact="false" />
      </div>
    </div>



    <!-- ② 場館卡 + 預約摘要 -->
    <div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
      <figure class="h-44 overflow-hidden">
        <img :src="booking.venueImage" :alt="booking.venueName" class="w-full h-full object-cover" />
      </figure>
      <div class="card-body gap-4">
        <h3 class="card-title mb-3">預訂資訊</h3>
        <!-- 預約摘要 -->
        <table class="table">
          <tbody>
            <tr>
              <td class="">訂單編號</td>
              <td class="font-mono text-sm">{{ booking.reservationId }}</td>
            </tr>
            <tr>
              <td class=" w-24">預訂場館</td>
              <td>
                <p class="font-semibold">{{ booking.venueName }}</p>
                <p class=" text-sm">{{ booking.venueLocation }}</p>
              </td>
            </tr>
            <!-- <tr>
              <td class=" w-24">申請人 / 單位</td>
              <td class="font-semibold">{{ booking.applicant }}</td>
            </tr> -->
            <!-- <tr>
              <td class="">預訂狀態</td>
              <td>
                <span :class="['badge', getPortalStatusDisplay(booking.status).className]">
                  {{ getPortalStatusDisplay(booking.status).label }}
                </span>
              </td>
            </tr> -->
            <tr>
              <td class="">使用日期</td>
              <td>{{ formatDate(booking) }}</td>
            </tr>
            <tr>
              <td class="">使用時間</td>
              <td>{{ formatTime(booking) }}</td>
            </tr>
            <tr>
              <td class="">租借方式</td>
              <td>{{ rentalModeLabel }}</td>
            </tr>
            <tr v-if="booking.totalHours">
              <td class="">租借時數</td>
              <td>{{ booking.totalHours }} 小時</td>
            </tr>
            <tr v-if="booking.rentalDays">
              <td class="">租借天數</td>
              <td>{{ booking.rentalDays }} 天</td>
            </tr>
            <tr v-if="booking.peopleCount">
              <td class="">預估人數</td>
              <td>{{ booking.peopleCount }} 人</td>
            </tr>
            <tr v-if="booking.purpose">
              <td class="">使用目的</td>
              <td>{{ booking.purpose }}</td>
            </tr>
            <tr v-if="booking.cancelDeadline && !booking.status.startsWith('cancelled')">
              <td class=" w-24">取消期限</td>
              <td><span class=" badge-error badge-sm">{{ toZhDate(booking.cancelDeadline) }}</span>
              </td>
            </tr>
            <tr>
              <td class="">申請日期</td>
              <td>{{ toZhDate(booking.createdAt) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 操作按鈕 -->
        <div class="flex justify-end gap-2">
          <button v-if="canCancel" class="btn btn-error btn-wide">取消預約</button>
          <button v-if="canRequestCancellation" class="btn btn-neutral" @click="cancelModalOpen = true">
            <span class="material-symbols-outlined text-base">event_busy</span>
            申請取消預約
          </button>
        </div>

        <!-- 取消申請中提示 -->
        <div v-if="booking.status === 'cancellation_requested'" class="alert alert-warning alert-soft mt-2">
          <span class="material-symbols-outlined">hourglass_top</span>
          <div>
            <p class="font-semibold">取消申請已送出，等待承辦人員審核</p>
            <p v-if="booking.cancelReason" class="text-sm opacity-80 mt-1">取消原因：{{ booking.cancelReason }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ③ 申請文件 -->
    <div v-if="showDocumentSection && booking.documents?.length"
      class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <div class="flex items-center justify-between mb-3">
          <h3 class="card-title">申請文件</h3>
          <span class="badge badge-sm badge-primary">
            {{booking.documents.filter(d => d.uploaded).length}} / {{booking.documents.filter(d => d.required).length
            }} 必要項已上傳
          </span>
        </div>

        <div v-if="booking.documentUploadDeadline" class="text-xs  mb-3 flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">schedule</span>
          文件上傳截止：{{ toZhDate(booking.documentUploadDeadline) }}
        </div>

        <!-- 文件退貨理由 -->
        <div v-if="booking.status === 'documents_rejected' && booking.documentRejectReason"
          class="alert alert-error alert-soft p-3 mb-4 rounded-box flex items-start gap-3">
          <span class="material-symbols-outlined text-error shrink-0">error</span>
          <div>
            <p class="font-bold text-error">文件需補件/修改</p>
            <p class="text-sm mt-1 ">{{ booking.documentRejectReason }}</p>
          </div>
        </div>

        <div class="space-y-2">
          <div v-for="doc in booking.documents.filter(d => d.required)" :key="doc.key" class="alert "
            :class="doc.uploaded ? 'alert-success' : 'alert-neutral '">
            <span class="material-symbols-outlined text-2xl shrink-0">
              {{ doc.uploaded ? 'check_circle' : 'upload_file' }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">{{ doc.label }}</p>
              <p v-if="doc.uploaded && doc.fileName" class="text-xs  truncate">
                {{ doc.fileName }}
              </p>
              <p v-if="doc.uploaded && doc.uploadedAt" class="text-xs ">
                上傳於 {{ toZhDate(doc.uploadedAt) }}
              </p>
            </div>

            <!-- 可上傳狀態：每個文件各自上傳 -->
            <template v-if="canUploadDocuments">
              <label v-if="!doc.uploaded" class="btn btn-sm btn-neutral">
                <span class="material-symbols-outlined text-base">upload</span>
                上傳
                <input type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf"
                  @change="handleDocUpload(doc.key, $event)" />
              </label>
              <label v-else class="btn btn-sm btn-ghost gap-1  cursor-pointer">
                <span class="material-symbols-outlined text-base">refresh</span>
                重新上傳
                <input type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf"
                  @change="handleDocUpload(doc.key, $event)" />
              </label>
            </template>
            <template v-else>
              <span v-if="doc.uploaded" class="badge badge-sm badge-success">已上傳</span>
              <span v-else class="badge badge-sm badge-error badge-outline">待上傳</span>
            </template>
          </div>
        </div>

        <p v-if="canUploadDocuments" class="text-xs  mt-3">
          支援 JPG、PNG、PDF，每個檔案最大 5MB
        </p>
      </div>
    </div>

    <!-- ④ 費用資訊 -->
    <div class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <h3 class="card-title mb-3">費用明細</h3>
        <table class="table">
          <thead>
            <tr>
              <th>項目</th>
              <th class="text-right">單價</th>
              <th class="text-right">數量</th>
              <th class="text-right">小計</th>
            </tr>
          </thead>
          <tbody>
            <!-- 場地費：計時 -->
            <tr v-if="booking.rentalMode === 'hourly' && booking.pricePerHour && booking.totalHours">
              <td class="">場地費（計時）</td>
              <td class="text-right">NT$ {{ booking.pricePerHour.toLocaleString() }}</td>
              <td class="text-right">{{ booking.totalHours }} 小時</td>
              <td class="text-right font-medium">NT$ {{ booking.baseFee.toLocaleString() }}</td>
            </tr>
            <!-- 場地費：全日 -->
            <tr v-else-if="booking.rentalMode === 'daily' && booking.pricePerDay && booking.rentalDays">
              <td class="">場地費（全日）</td>
              <td class="text-right">NT$ {{ booking.pricePerDay.toLocaleString() }}</td>
              <td class="text-right">{{ booking.rentalDays }} 天</td>
              <td class="text-right font-medium">NT$ {{ booking.baseFee.toLocaleString() }}</td>
            </tr>
            <!-- 場地費：場次 -->
            <tr v-else-if="booking.rentalMode === 'session' && booking.session">
              <td class="">場地費（{{ { morning: '上午場', afternoon: '下午場', evening: '晚間場' }[booking.session]
                }}）
              </td>
              <td class="text-right">—</td>
              <td class="text-right">1 場</td>
              <td class="text-right font-medium">NT$ {{ booking.baseFee.toLocaleString() }}</td>
            </tr>
            <!-- 附加費用 -->
            <tr v-for="fee in booking.additionalFees" :key="fee.label">
              <td class="">{{ fee.label }}</td>
              <td class="text-right">—</td>
              <td class="text-right">{{ fee.unit }}</td>
              <td class="text-right font-medium">NT$ {{ fee.amount.toLocaleString() }}</td>
            </tr>
            <!-- 保證金（固定最後一行） -->
            <tr v-if="booking.deposit" class="border-t border-base-200">
              <td class="">保證金</td>
              <td class="text-right">—</td>
              <td class="text-right">1 次</td>
              <td class="text-right font-medium">NT$ {{ booking.deposit.toLocaleString() }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-base-300">
              <td colspan="3" class="text-right font-semibold ">合計</td>
              <td class="text-right text-lg font-black ">NT$ {{ booking.totalPrice.toLocaleString() }}</td>
            </tr>
          </tfoot>
        </table>
        <p class=" mt-3 text-center">實際費用以場館確認為準。</p>
      </div>
    </div>

    <!-- ⑤ 繳款證明（含繳費說明） -->
    <div v-if="showPaymentSection" class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <h3 class="card-title mb-3">繳款證明</h3>

        <!-- 已確認 / 確認中：顯示匯款資訊 -->
        <template
          v-if="booking.remittance && ['confirmed', 'completed', 'payment_review', 'cancellation_requested', 'cancelled'].includes(booking.status)">
          <div v-if="['confirmed', 'completed', 'cancellation_requested', 'cancelled'].includes(booking.status)"
            class="alert alert-success">
            <span class="material-symbols-outlined text-3xl shrink-0">check_circle</span>
            <div>
              <p class="font-bold">繳款已確認</p>
              <p class="text-sm ">款項已核對完成，感謝您的配合。</p>
            </div>
          </div>
          <div v-else class="alert alert-warning">
            <span class="material-symbols-outlined text-3xl shrink-0">hourglass_top</span>
            <div>
              <p class="font-bold">等待管理員確認中</p>
              <p class="text-sm ">已收到您的匯款資訊，正在核對中。</p>
            </div>
          </div>
          <table v-if="booking.remittance" class="table">
            <tbody>
              <tr>
                <td class=" w-28">帳號後五碼</td>
                <td class="font-mono">{{ booking.remittance.last5 }}</td>
              </tr>
              <tr>
                <td class="">匯款金額</td>
                <td>NT$ {{ booking.remittance.amount.toLocaleString() }}</td>
              </tr>
              <tr>
                <td class="">匯款時間</td>
                <td>{{ booking.remittance.datetime.replace('T', ' ') }}</td>
              </tr>
              <tr v-if="booking.remittance.senderName">
                <td class="">匯款人</td>
                <td>{{ booking.remittance.senderName }}</td>
              </tr>
              <tr v-if="booking.remittance.note">
                <td class="">補充說明</td>
                <td>{{ booking.remittance.note }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- 待付款：顯示繳費說明 + 匯款表單 -->
        <template v-else>
          <div class="alert alert-warning alert-soft mb-4">
            <div class="space-y-1">
              <p class="font-semibold">請完成匯款後上傳證明</p>
              <p>銀行匯款｜玉山銀行（808）帳號：1234-567-890123</p>
              <p>戶名：苗栗縣政府體育場</p>
              <p class="text-sm opacity-80">匯款後請務必保留收據並上傳證明，以利核帳。</p>
            </div>
          </div>

          <!-- 匯款資訊欄位 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <fieldset class="fieldset">
              <label class="label">帳號後五碼 <span class="text-error">*</span></label>
              <input v-model="remittance.last5" type="text" inputmode="numeric" maxlength="5" placeholder="例：12345"
                class="input w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <label class="label">匯款金額 <span class="text-error">*</span></label>
              <input v-model="remittance.amount" type="number" min="0" placeholder="例：3500" class="input w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <label class="label">匯款時間</label>
              <input v-model="remittance.datetime" type="datetime-local" class="input w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <label class="label">匯款人姓名</label>
              <input v-model="remittance.senderName" type="text" placeholder="若與申請人不同請填寫" class="input w-full" />
            </fieldset>
            <fieldset class="fieldset sm:col-span-2">
              <label class="label">補充說明</label>
              <input v-model="remittance.note" type="text" placeholder="例：分兩筆匯入" class="input w-full" />
            </fieldset>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
              :class="paymentProof ? 'bg-success border-success' : 'bg-error border-error'">
              <span class="material-symbols-outlined text-lg shrink-0"
                :class="paymentProof ? 'text-success' : 'text-error'">
                {{ paymentProof ? 'check_circle' : 'upload_file' }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">繳費收據或證明</p>
                <p v-if="paymentProof" class="text-xs  truncate">{{ paymentProof }}</p>
              </div>
              <label v-if="!paymentProof" class="btn btn-sm btn-primary btn-outline gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-base">upload</span>
                上傳
                <input type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf" @change="handleReceiptUpload" />
              </label>
              <label v-else class="btn btn-sm btn-ghost gap-1  cursor-pointer">
                <span class="material-symbols-outlined text-base">refresh</span>
                重新上傳
                <input type="file" class="hidden" accept=".jpg,.jpeg,.png,.pdf" @change="handleReceiptUpload" />
              </label>
            </div>
            <div v-if="uploadError" class="alert alert-error p-2"><span>{{ uploadError }}</span></div>
          </div>

          <p class="text-xs  mt-3">支援 JPG、PNG、PDF，每個檔案最大 5MB</p>
        </template>
      </div>
    </div>

    <!-- ⑤ 聯絡資訊 -->
    <div class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <h3 class="card-title mb-3">聯絡資訊</h3>
        <table class="table">
          <tbody>
            <tr>
              <td class=" w-24">聯絡人</td>
              <td>{{ contact.name }}</td>
            </tr>
            <tr>
              <td class="">電話</td>
              <td>{{ contact.phone }}</td>
            </tr>
            <tr>
              <td class="">Email</td>
              <td>{{ contact.email }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 取消退款 -->
    <!-- 退費進度（已提交退費申請時顯示） -->
    <div v-if="hasRefund" class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <h3 class="card-title mb-4">
          取消退款
          <span v-if="booking.refund?.status === 'completed'" class="badge badge-success badge-sm">已完成</span>
          <span v-else class="badge badge-info badge-sm">處理中</span>
        </h3>
        <router-link to="/member/refunds" class="btn btn-outline btn-sm w-fit mb-2">
          <span class="material-symbols-outlined text-base">receipt_long</span>
          查看我的退款紀錄
        </router-link>

        <!-- 退費步驟 -->
        <ul v-if="booking.refund?.status !== 'completed'" class="steps steps-vertical lg:steps-horizontal w-full mb-4">
          <li v-for="step in REFUND_STEPS" :key="step.key" class="step" :class="{
            'step-success': getStepState(step.key) === 'done',
            'step-warning': getStepState(step.key) === 'active',
          }">
            <span v-if="getStepState(step.key) === 'done'" class="step-icon material-symbols-outlined"
              style="font-size:16px;">check</span>
            <span v-else-if="getStepState(step.key) === 'active'" class="step-icon material-symbols-outlined"
              style="font-size:16px;">hourglass_top</span>
            {{ step.label }}
          </li>
        </ul>

        <!-- 退費明細 -->
        <table class="table">
          <tbody>
            <tr v-if="booking.refund?.amount != null">
              <td class="">核定金額</td>
              <td class="font-bold">NT$ {{ booking.refund!.amount!.toLocaleString() }}</td>
            </tr>
            <tr v-if="booking.refund?.refundMethod">
              <td class="">退費方式</td>
              <td>{{ booking.refund!.refundMethod === 'transfer' ? '匯款退款' : '支票退款' }}</td>
            </tr>
            <tr>
              <td class="">申請日期</td>
              <td>{{ booking.refund?.requestedAt ? toZhDate(booking.refund.requestedAt) : '—' }}</td>
            </tr>
            <tr v-if="booking.refund?.adminApprovedAt">
              <td class="">承辦核准</td>
              <td>{{ toZhDate(booking.refund.adminApprovedAt) }}</td>
            </tr>
            <tr v-if="booking.refund?.accountingApprovedAt">
              <td class="">會計核定</td>
              <td>{{ toZhDate(booking.refund.accountingApprovedAt) }}</td>
            </tr>
            <tr v-if="booking.refund?.completedAt">
              <td class="">撥款完成</td>
              <td class="text-success font-medium">{{ toZhDate(booking.refund.completedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 取消預約申請 Modal -->
    <dialog class="modal" :class="{ 'modal-open': cancelModalOpen }">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg mb-4">申請取消預約</h3>

        <div class="space-y-4">
          <div class="alert alert-warning alert-soft">
            <span class="material-symbols-outlined">info</span>
            <div>
              <p class="font-semibold">取消申請將由承辦人員審核</p>
              <p class="text-sm mt-1">提交後預約將暫時凍結，審核通過後訂單狀態會變更為「已取消」，届時可申請退還已繳費用。</p>
            </div>
          </div>

          <div class="text-sm space-y-1 bg-base-200 rounded-lg p-3">
            <p><span class="">預約場館：</span>{{ booking.venueName }}</p>
            <p><span class="">使用日期：</span>{{ formatDate(booking) }}</p>
            <p><span class="">取消期限：</span>須於使用日 <strong>{{ cancellationDeadlineDays }}</strong>
              天前提出申請
            </p>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">取消原因 <span class="text-error">*</span></legend>
            <textarea v-model="cancelReason" class="textarea textarea-bordered w-full" rows="3"
              placeholder="請說明取消原因，例如：活動因故延期、天候因素無法舉行..."></textarea>
          </fieldset>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="cancelModalOpen = false">返回</button>
          <button class="btn btn-warning" :disabled="!cancelReason.trim()" @click="submitCancellationRequest">
            確認送出取消申請
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="cancelModalOpen = false"></form>
    </dialog>

    <!-- ⑥ 備註 -->
    <div v-if="booking.note" class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <h3 class="card-title mb-2">備註</h3>
        <p class="leading-relaxed  p-3 bg-base-200 rounded-lg">{{ booking.note }}</p>
      </div>
    </div>

    <!-- ⑦ 管理員備註 -->
    <div v-if="booking.adminNote" class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <h3 class="card-title mb-2">管理員備註</h3>
        <p class=" leading-relaxed p-3 bg-warning rounded-lg border border-warning">{{ booking.adminNote }}</p>
      </div>
    </div>



    <div class="pt-2 pb-4">
      <router-link to="/member/bookings" class="btn btn-ghost btn-sm">← 返回列表</router-link>
    </div>

  </div>
</template>

<style scoped></style>
