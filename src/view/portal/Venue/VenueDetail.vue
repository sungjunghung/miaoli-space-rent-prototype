<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import venues from "@/mocks/venues.json";
import allBookings from "@/mocks/generateBookings";
import calendarNotes from "@/mocks/calendarNotes.json";
import WeekCalendar from "@/components/portal/calendar/WeekCalendar.vue";
import MonthCalendar from "@/components/portal/calendar/MonthCalendar.vue";
import { publicImageUrl } from "@/utils/assets";

const route = useRoute();
const router = useRouter();

const venue = computed(() => {
  const id = Number(route.params.id);
  return venues.find((v) => v.id === id);
});

const hasWeekView = computed(() => {
  if (!venue.value) return false;
  const rm = venue.value.rentalModes;
  return rm.session?.enabled || rm.hourly?.enabled;
});

// 預約狀況預設用月曆(daily);使用者可再切到時段(週曆)
const rentalMode = ref<"hourly" | "daily">("daily");

// 租借費用:可切換顯示的模式(只列出有啟用的)
type FeeMode = "daily" | "session" | "hourly";
const feeModes = computed<{ value: FeeMode; label: string }[]>(() => {
  const rm = venue.value?.rentalModes;
  const list: { value: FeeMode; label: string }[] = [];
  if (rm?.daily?.enabled) list.push({ value: "daily", label: "整日租借" });
  if (rm?.session?.enabled) list.push({ value: "session", label: "時段租借" });
  if (rm?.hourly?.enabled) list.push({ value: "hourly", label: "小時租借" });
  return list;
});
const feeMode = ref<FeeMode>("daily");
// feeMode 永遠指向一個有啟用的模式(預設第一個)
watch(
  feeModes,
  (modes) => {
    if (!modes.some((m) => m.value === feeMode.value)) {
      feeMode.value = modes[0]?.value ?? "daily";
    }
  },
  { immediate: true },
);
const lightboxImage = ref<string | null>(null);
// 目前聚焦的照片索引;主圖會跟著它換
const activeImageIndex = ref(0);
const heroImage = computed(() => {
  const imgs = galleryImages.value;
  if (imgs.length) return imgs[activeImageIndex.value] ?? imgs[0];
  return venue.value ? publicImageUrl(venue.value.mainImageUrl) : "";
});

const parallaxOffset = ref(0);
let parallaxTicking = false;
function onParallaxScroll() {
  if (parallaxTicking) return;
  parallaxTicking = true;
  requestAnimationFrame(() => {
    parallaxOffset.value = window.scrollY * 0.35;
    parallaxTicking = false;
  });
}
onMounted(() => window.addEventListener("scroll", onParallaxScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener("scroll", onParallaxScroll));
const heroParallaxStyle = computed(() => ({
  transform: `translate3d(0, ${parallaxOffset.value}px, 0) scale(1.15)`,
}));

const closedWeekdays = computed(() => venue.value?.closedWeekdays ?? []);
const closedDates = computed(() => venue.value?.closedDates ?? []);

const allRequiredDocuments = computed(() => {
  if (!venue.value) return [];
  const rm = venue.value.rentalModes as any;
  const seen = new Set<string>();
  const docs: any[] = [];
  for (const mode of ["daily", "session", "hourly"]) {
    const modeData = rm[mode];
    if (!modeData?.enabled || !modeData.requireDocuments) continue;
    for (const doc of modeData.requiredDocuments ?? []) {
      if (doc.required && !seen.has(doc.key)) {
        seen.add(doc.key);
        docs.push(doc);
      }
    }
  }
  return docs;
});
const venueBookings = computed(() => {
  if (!venue.value) return [];
  const realBookings = allBookings.filter((b) => b.venueId === venue.value!.id);
  // 將時段保留轉為假的 booking record，讓行事曆顯示為已租借
  const blocked = calendarNotes
    .filter((n: any) => n.type === "blocked" && n.venueId === venue.value!.id)
    .map((n: any) => ({
      id: `blocked-${n.id}`,
      venueId: n.venueId,
      date: n.date,
      rentalMode: n.allDay ? "daily" : "hourly",
      startDate: n.allDay ? n.date : undefined,
      endDate: n.allDay ? n.date : undefined,
      startTime: n.startTime ?? undefined,
      endTime: n.endTime ?? undefined,
      status: "confirmed",
      applicant: n.title,
      purpose: n.description,
    }));
  return [...realBookings, ...blocked];
});

const sessionDefs = computed(() =>
  (venue.value?.rentalModes.session?.sessions ?? []).map((s) => ({
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
  })),
);

const galleryImages = computed(() => {
  if (!venue.value) return [];
  return Array.from(
    new Set(
      [venue.value.mainImageUrl, ...(venue.value.gallery ?? [])]
        .filter(Boolean)
        .map(publicImageUrl),
    ),
  );
});

const pricedRentalItems = computed(
  () => venue.value?.rentalItems?.filter((item) => item.amount > 0) ?? [],
);

// 照片輪播:每隔數秒聚焦下一張並替換主圖(慢速),到底回開頭;hover 暫停
const galleryTrack = ref<HTMLElement | null>(null);
let galleryTimer: number | undefined;
let galleryRaf: number | undefined;

// 自控的平滑捲動:rAF tween + easeInOutCubic,比瀏覽器原生 smooth 更柔順可控
function smoothScrollLeft(el: HTMLElement, to: number, duration = 900) {
  if (galleryRaf) cancelAnimationFrame(galleryRaf);
  const max = el.scrollWidth - el.clientWidth;
  const target = Math.max(0, Math.min(to, max));
  const start = el.scrollLeft;
  const dist = target - start;
  if (Math.abs(dist) < 1) return;
  const startTime = performance.now();
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = (now: number) => {
    const p = Math.min(1, (now - startTime) / duration);
    el.scrollLeft = start + dist * ease(p);
    if (p < 1) galleryRaf = requestAnimationFrame(step);
  };
  galleryRaf = requestAnimationFrame(step);
}

function focusGalleryImage(idx: number) {
  const total = galleryImages.value.length;
  if (!total) return;
  activeImageIndex.value = ((idx % total) + total) % total;
  // 把聚焦的縮圖柔順地捲到列表中央
  const track = galleryTrack.value;
  const el = track?.children[activeImageIndex.value] as HTMLElement | undefined;
  if (track && el) {
    smoothScrollLeft(track, el.offsetLeft - (track.clientWidth - el.clientWidth) / 2);
  }
}
function advanceGallery() {
  focusGalleryImage(activeImageIndex.value + 1);
}
function startGallery() {
  stopGallery();
  galleryTimer = window.setInterval(advanceGallery, 6000);
}
function stopGallery() {
  if (galleryTimer) {
    clearInterval(galleryTimer);
    galleryTimer = undefined;
  }
}
onMounted(startGallery);
onBeforeUnmount(() => {
  stopGallery();
  if (galleryRaf) cancelAnimationFrame(galleryRaf);
});

function selectDate(_day: unknown) {
  // WeekCalendar 用的日期選擇處理(目前為 no-op)
}

// ── 與首頁同樣的「點日期 → modal」體驗 ──
function bookingPartsForVenue(b: any): { primary: string; time?: string } {
  if (b.rentalMode === "daily") {
    if (b.startDate && b.endDate && b.startDate !== b.endDate) {
      return {
        primary: "整日",
        time: `${b.startDate.slice(5).replace("-", "/")} ~ ${b.endDate.slice(5).replace("-", "/")}`,
      };
    }
    return { primary: "整日" };
  }
  if (b.rentalMode === "session" && b.session) {
    const def = sessionDefs.value.find((s) => s.name === b.session);
    return def
      ? { primary: b.session, time: `${def.startTime}-${def.endTime}` }
      : { primary: b.session };
  }
  if (b.rentalMode === "hourly") {
    return { primary: `${b.startTime ?? ""}-${b.endTime ?? ""}` };
  }
  return { primary: b.purpose ?? "預約" };
}

function describeBookingFor(b: any): string {
  const parts = bookingPartsForVenue(b);
  return parts.time ? `${parts.primary} ${parts.time}` : parts.primary;
}

// 特定場館視圖:label + time 合成單行(與首頁的特定場館模式一致)
const cellEvents = computed<Record<string, { label: string; time?: string }[]>>(() => {
  const out: Record<string, { label: string; time?: string }[]> = {};
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  for (const b of venueBookings.value) {
    const startStr = (b as any).startDate ?? (b as any).date;
    const endStr = (b as any).endDate ?? (b as any).date;
    if (!startStr) continue;
    const s = new Date(`${startStr}T00:00:00`);
    const e = new Date(`${endStr ?? startStr}T00:00:00`);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) continue;
    const entry = { label: describeBookingFor(b) };
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = toKey(d);
      if (!out[key]) out[key] = [];
      out[key].push(entry);
    }
  }
  return out;
});

const bookingsModal = ref<HTMLDialogElement | null>(null);
const selectedDate = ref("");
const bookingsOnSelectedDate = computed(() => {
  if (!selectedDate.value) return [];
  const target = selectedDate.value;
  return venueBookings.value.filter((b: any) => {
    if (b.rentalMode === "daily") {
      const start = b.startDate ?? b.date;
      const end = b.endDate ?? b.date;
      return target >= start && target <= end;
    }
    return b.date === target;
  });
});

function onCalendarDayClick(dateStr: string) {
  selectedDate.value = dateStr;
  bookingsModal.value?.showModal();
}
function closeBookingsModal() {
  bookingsModal.value?.close();
}
function formatLongDate(s: string): string {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${y} 年 ${parseInt(m ?? "1")} 月 ${parseInt(d ?? "1")} 日`;
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const weekDays: { label: string; key: DayKey; isWeekend: boolean }[] = [
  { label: "週一", key: "mon", isWeekend: false },
  { label: "週二", key: "tue", isWeekend: false },
  { label: "週三", key: "wed", isWeekend: false },
  { label: "週四", key: "thu", isWeekend: false },
  { label: "週五", key: "fri", isWeekend: false },
  { label: "週六", key: "sat", isWeekend: true },
  { label: "週日", key: "sun", isWeekend: true },
];

const DAY_KEY_TO_NUM: Record<DayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function isWeeklyClosedDay(key: DayKey): boolean {
  return closedWeekdays.value.includes(DAY_KEY_TO_NUM[key]);
}

function getHours(key: DayKey) {
  return venue.value?.openingHours[key] ?? null;
}

function goBack() {
  router.push({ name: "venue-list" });
}

function goToBooking() {
  router.push({ name: "venue-booking", params: { id: route.params.id } });
}

function scrollToCalendar() {
  document
    .getElementById("calendar-section")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatMoney(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString() : "—";
}
</script>

<template>
  <div v-if="!venue" class="min-h-[70dvh] bg-base-200 flex items-center justify-center px-4">
    <div class="bg-base-100 border border-base-200 rounded-box shadow-sm p-8 max-w-md w-full text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-base-200 flex items-center justify-center mb-5">
        <span class="material-symbols-outlined text-3xl text-base-content/50">stadium</span>
      </div>
      <h2 class="text-2xl font-bold mb-2">找不到此場館</h2>
      <p class="text-base-content/60 mb-6">
        場館資料可能已被移除或暫時無法存取。
      </p>
      <button @click="goBack" class="btn btn-primary">返回場館列表</button>
    </div>
  </div>

  <main v-else class="bg-base-200/60">
    <section class="relative overflow-hidden bg-neutral flex flex-col min-h-dvh pb-4 lg:block lg:min-h-0 lg:pb-16">
      <Transition name="hero-fade">
        <img :key="heroImage" :src="heroImage" :alt="venue.name" :style="heroParallaxStyle"
          class="absolute inset-0 w-full h-full object-cover will-change-transform" />
      </Transition>
      <div class="absolute inset-0 bg-linear-to-r from-black/80 via-black/45 to-black/10"></div>
      <div
        class="absolute inset-x-0 bottom-0 h-full lg:h-3/5 bg-linear-to-t from-base-200 from-10% lg:from-0% to-transparent to-50% lg:to-80%">
      </div>

      <div
        class="container mx-auto px-8 relative z-10 pt-8 lg:pt-28 pb-8 lg:pb-14 flex flex-col justify-between lg:justify-end flex-1 lg:flex-none ">

        <div class="max-w-4xl text-white">
          <button class="btn btn-sm btn-ghost text-white/90 w-fit" @click="goBack">
            <span class="material-symbols-outlined text-base">arrow_back</span>
            場館列表
          </button>

          <h1 class="text-3xl md:text-5xl font-bold leading-tight">
            {{ venue.name }}
          </h1>
          <p class="text-lg md:text-xl leading-relaxed text-white/85 max-w-3xl">
            {{ venue.description }}
          </p>
        </div>

                <div class="mt-8 flex flex-wrap gap-3">
          <button v-if="venue.status === 'available'" class="btn btn-primary btn-lg" @click="goToBooking">
            立即預約
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
          <button class="btn btn-secondary btn-lg" @click="scrollToCalendar">
            查看可預約時段
          </button>
        </div>
        
      </div>
      <section v-if="galleryImages.length" class="shrink-0">
        <div
          ref="galleryTrack"
          class="flex gap-3 overflow-x-auto px-4 py-6 [justify-content:safe_center]"
          data-lenis-prevent
          @mouseenter="stopGallery"
          @mouseleave="startGallery"
        >
          <button
            v-for="(img, idx) in galleryImages"
            :key="img"
            class="relative shrink-0 overflow-hidden rounded-box w-40 md:w-52 aspect-square group focus:outline-none transition-all duration-500"
            :class="idx === activeImageIndex ? 'scale-105 shadow-xl z-10' : ''"
            @click="lightboxImage = img">
            <img :src="img" :alt="`${venue.name} 場地照片 ${idx + 1}`"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <span
              class="absolute right-2 bottom-2 w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="material-symbols-outlined">zoom_in</span>
            </span>
          </button>
        </div>
      </section>
    </section>

    <div class="container mx-auto px-4 lg:px-8 pb-10 z-40 relative">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-10 mb-8">

        <aside class="w-full lg:w-1/3 space-y-8">
          <section>
            <h3 class="text-lg font-bold">場館資訊</h3>
            <dl class="venues-detail-info">
              <dt>位置</dt>
              <dd>{{ venue.location }}</dd>
              <dt>容納人數</dt>
              <dd>{{ venue.capacity.toLocaleString() }} 人</dd>
              <dt>場地類型</dt>
              <dd>{{ venue.type }}</dd>
              <dt>設備與服務</dt>
              <dd class="flex flex-wrap gap-2">
                <span v-for="item in venue.facilities" :key="item" class="badge badge-neutral badge-outline">
                  {{ item }}
                </span>
              </dd>
              <dt>開放時間</dt>
              <dd>
                <ul>
                  <li v-for="{ label, key, isWeekend } in weekDays" :key="key" class="leading-relaxed">
                    <span :class="isWeekend ? 'text-error' : ''">{{ label }}</span>
                    <span class="ml-3">{{
                      isWeeklyClosedDay(key)
                        ? "固定休館"
                        : (getHours(key) ?? "休館")
                    }}</span>
                  </li>
                </ul>
              </dd>
            </dl>
          </section>
          <section>
            <h3 class="text-lg font-bold">租借費用</h3>
            <div v-if="venue.status === 'available'" class="space-y-3 mt-3">
              <div v-if="feeModes.length > 1" role="tablist" class="tabs tabs-box tabs-sm">
                <button v-for="m in feeModes" :key="m.value" type="button" role="tab" class="tab flex-1"
                  :class="{ 'tab-active': feeMode === m.value }" :aria-selected="feeMode === m.value"
                  @click="feeMode = m.value">
                  {{ m.label }}
                </button>
              </div>
              <div v-if="feeMode === 'daily'" class="border border-base-200 rounded-box overflow-hidden">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th></th>
                      <th class="text-right">平日</th>
                      <th class="text-right">假日</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>整日</td>
                      <td class="text-right font-semibold">
                        NT$ {{ formatMoney(venue.pricing.daily.weekday) }}
                      </td>
                      <td class="text-right font-semibold">
                        NT$ {{ formatMoney(venue.pricing.daily.weekend) }}
                      </td>
                    </tr>
                    <tr v-if="(venue.rentalModes as any).daily?.depositEnabled">
                      <td>保證金</td>
                      <td colspan="2" class="text-right font-semibold">
                        NT$ {{ formatMoney((venue.rentalModes as any).daily.depositAmount) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="feeMode === 'session'" class="border border-base-200 rounded-box overflow-hidden">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th></th>
                      <th class="text-right">平日</th>
                      <th class="text-right">假日</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in venue.rentalModes.session.sessions" :key="s.name">
                      <td>{{ s.name }}</td>
                      <td class="text-right font-semibold">
                        NT$ {{ formatMoney(s.weekday) }}
                      </td>
                      <td class="text-right font-semibold">
                        NT$ {{ formatMoney(s.weekend) }}
                      </td>
                    </tr>
                    <tr v-if="(venue.rentalModes as any).session?.depositEnabled">
                      <td>保證金</td>
                      <td colspan="2" class="text-right font-semibold">
                        NT$ {{ formatMoney((venue.rentalModes as any).session.depositAmount) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="feeMode === 'hourly'" class="border border-base-200 rounded-box overflow-hidden">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th></th>
                      <th class="text-right">平日</th>
                      <th class="text-right">假日</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>每小時</td>
                      <td class="text-right font-semibold">
                        NT$ {{ formatMoney(venue.pricing.hourly.weekday) }}
                      </td>
                      <td class="text-right font-semibold">
                        NT$ {{ formatMoney(venue.pricing.hourly.weekend) }}
                      </td>
                    </tr>
                    <tr v-if="(venue.rentalModes as any).hourly?.depositEnabled">
                      <td>保證金</td>
                      <td colspan="2" class="text-right font-semibold">
                        NT$ {{ formatMoney((venue.rentalModes as any).hourly.depositAmount) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="pricedRentalItems.length" class="border border-base-200 rounded-box overflow-hidden">
                <div class="px-4 py-3 bg-base-200/60 flex items-center gap-2 font-bold">
                  <span class="material-symbols-outlined text-base">add_circle</span>
                  額外費用
                </div>
                <table class="table table-sm">
                  <tbody>
                    <tr v-for="fee in pricedRentalItems" :key="fee.label">
                      <td>{{ fee.label }}</td>
                      <td class="text-right font-semibold">
                        NT$ {{ fee.amount.toLocaleString() }} / {{ fee.unit }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button @click="goToBooking" class="btn btn-primary btn-lg w-full">
                立即預約
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div v-else class="bg-base-100 border border-base-200 rounded-box shadow-sm p-6">
              <span class="material-symbols-outlined text-3xl text-warning">construction</span>
              <h2 class="text-xl font-bold mt-3">場館維護中</h2>
              <p class="text-base-content/60 mt-2">此場館目前暫不開放預約。</p>
            </div>
          </section>
        </aside>
        <div class="w-full lg:w-2/3 space-y-6">

          <section id="calendar-section" class="bg-base-100 border border-base-200 rounded-box shadow-sm scroll-mt-28">
            <div class="p-6 md:p-8">
              <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
                <div>
                  <h2 class="text-2xl font-bold">預約狀況</h2>
                </div>
                <div v-if="hasWeekView" class="tabs tabs-box">
                  <button class="tab gap-2" :class="rentalMode === 'hourly' ? 'tab-active' : ''"
                    @click="rentalMode = 'hourly'">
                    <span class="material-symbols-outlined text-sm">schedule</span>
                    週曆
                  </button>
                  <button class="tab gap-2" :class="rentalMode === 'daily' ? 'tab-active' : ''"
                    @click="rentalMode = 'daily'">
                    <span class="material-symbols-outlined text-sm">date_range</span>
                    月曆
                  </button>
                </div>
              </div>

              <div v-if="hasWeekView && rentalMode === 'hourly'">
                <WeekCalendar :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="venueBookings"
                  :session-defs="sessionDefs" @select-date="selectDate" />
              </div>
              <div v-else>
                <MonthCalendar :closed-weekdays="closedWeekdays" :closed-dates="closedDates" :bookings="venueBookings"
                  :cell-events="cellEvents" viewable @select-date="onCalendarDayClick" />
              </div>
            </div>
          </section>
          <section class="space-y-6">
            <div class="bg-base-100 border border-base-200 rounded-box shadow-sm p-6">
              <h2 class="text-xl font-bold mb-4">預約注意事項</h2>
              <ul class="space-y-3">
                <li class="flex gap-3 text-sm leading-relaxed">
                  <span class="material-symbols-outlined text-base text-warning shrink-0 mt-0.5">info</span>
                  <span>最早可於使用日前
                    {{ venue.advanceBookingDays }} 天提出申請。</span>
                </li>
                <li class="flex gap-3 text-sm leading-relaxed">
                  <span class="material-symbols-outlined text-base text-warning shrink-0 mt-0.5">info</span>
                  <span>文件需於申請後
                    {{ venue.documentUploadDeadlineDays }} 天內完成提交。</span>
                </li>
                <li class="flex gap-3 text-sm leading-relaxed">
                  <span class="material-symbols-outlined text-base text-warning shrink-0 mt-0.5">info</span>
                  <span>費用需於申請後
                    {{ venue.receiptUploadDeadlineDays }} 天內完成繳納。</span>
                </li>
                <li class="flex gap-3 text-sm leading-relaxed">
                  <span class="material-symbols-outlined text-base text-warning shrink-0 mt-0.5">info</span>
                  <span>如需取消，最晚需於使用日前
                    {{ venue.cancellationDeadlineDays }} 天完成取消申請。</span>
                </li>
                <li v-for="(item, idx) in venue.notices" :key="idx" class="flex gap-3 text-sm leading-relaxed">
                  <span class="material-symbols-outlined text-base text-warning shrink-0 mt-0.5">info</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <div v-if="allRequiredDocuments.length"
              class="bg-base-100 border border-base-200 rounded-box shadow-sm p-6">
              <h2 class="text-xl font-bold mb-4">預約文件下載</h2>
              <div class="space-y-3">
                <div v-for="doc in allRequiredDocuments" :key="doc.key"
                  class="flex items-center gap-3 rounded-box border border-base-200 bg-base-200/40 p-4">
                  <span class="material-symbols-outlined text-xl text-secondary">assignment</span>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold">{{ doc.label }}</p>
                    <p v-if="doc.hint" class="text-sm text-base-content/60 mt-1">
                      {{ doc.hint }}
                    </p>
                  </div>
                  <button class="btn btn-ghost btn-square">
                    <span class="material-symbols-outlined text-2xl">download</span>
                  </button>
                </div>
              </div>
            </div>


          </section>
        </div>
      </div>

    </div>

    <Teleport to="body">
      <div v-if="lightboxImage" class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        @click.self="lightboxImage = null">
        <button class="btn btn-circle btn-ghost absolute top-4 right-4 text-white" @click="lightboxImage = null">
          <span class="material-symbols-outlined">close</span>
        </button>
        <img :src="lightboxImage" :alt="venue.name" class="max-w-full max-h-[90vh] object-contain shadow-2xl" />
      </div>
    </Teleport>
  </main>

  <!-- 預約清單 modal:點月曆某天時顯示當日預約 -->
  <dialog ref="bookingsModal" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-1">{{ formatLongDate(selectedDate) }} 預約清單</h3>
      <p class="text-sm text-base-content/60 mb-4">
        {{ venue?.name }} · 共 {{ bookingsOnSelectedDate.length }} 筆
      </p>
      <div v-if="bookingsOnSelectedDate.length" class="space-y-2 max-h-96 overflow-y-auto" data-lenis-prevent>
        <div v-for="b in bookingsOnSelectedDate" :key="b.id" class="p-3 border border-base-200 rounded-box">
          <div class="font-medium">{{ describeBookingFor(b) }}</div>
          <div v-if="b.purpose" class="text-sm text-base-content/60">{{ b.purpose }}</div>
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

<style scoped>
/* 主圖換圖時淡入淡出(crossfade),比直接抽換柔順 */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 800ms ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}
</style>
