<script setup lang="ts">
import { ref, computed } from 'vue';

type RentalStatus = 'available' | 'partial' | 'rented' | 'closed';

interface CalendarDay {
  date: Date;
  status: RentalStatus;
}

interface BookingRecord {
  rentalMode: string;
  date: string;
  startDate?: string | null;
  endDate?: string | null;
  session?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
}

interface Props {
  closedWeekdays?: number[];
  closedDates?: string[];
  selectedStart?: string;
  selectedEnd?: string;
  bookings?: BookingRecord[];
  minDays?: number;
  maxDays?: number;
  showLegend?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closedWeekdays: () => [],
  closedDates: () => [],
  selectedStart: '',
  selectedEnd: '',
  bookings: () => [],
  minDays: 1,
  maxDays: 999,
  showLegend: true,
});

function isSelected(date: Date): boolean {
  const ds = formatDate(date);
  return ds === props.selectedStart || ds === props.selectedEnd;
}

function isInRange(date: Date): boolean {
  if (!props.selectedStart || !props.selectedEnd) return false;
  const ds = formatDate(date);
  return ds > props.selectedStart && ds < props.selectedEnd;
}

function isRangeStart(date: Date): boolean {
  return formatDate(date) === props.selectedStart && !!props.selectedStart;
}

function isRangeEnd(date: Date): boolean {
  return formatDate(date) === props.selectedEnd && !!props.selectedEnd;
}

const emit = defineEmits<{
  (e: 'select-date', dateStr: string): void;
}>();

const currentMonth = ref(new Date());

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isDayClosed(date: Date): boolean {
  return props.closedWeekdays.includes(date.getDay()) ||
    props.closedDates.includes(formatDate(date));
}

// 根據 bookings 資料判斷該日是否有租借記錄
function isDayRented(date: Date): boolean {
  const ds = formatDate(date);
  return props.bookings.some(b => {
    if (b.rentalMode === 'daily') {
      const start = b.startDate ?? b.date;
      const end = b.endDate ?? b.date;
      return ds >= start && ds <= end;
    }
    return b.date === ds;
  });
}

const getDaysInMonth = computed<(CalendarDay | null)[]>(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (CalendarDay | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    let status: RentalStatus = 'available';
    if (isDayClosed(date)) status = 'closed';
    else if (isDayRented(date)) status = 'rented';
    days.push({ date, status });
  }
  return days;
});

const monthYear = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth() + 1;
  return `${year}年${month}月`;
});

const previousMonth = (): void => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  currentMonth.value = new Date(year, month - 1, 1);
};

const nextMonth = (): void => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  currentMonth.value = new Date(year, month + 1, 1);
};

const isToday = (date: Date): boolean =>
  date.toDateString() === new Date().toDateString();

function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function canSelectDate(date: Date): boolean {
  if (isPastDate(date)) return false;
  if (isDayClosed(date) || isDayRented(date)) return false;

  const ds = formatDate(date);
  if (props.selectedStart && !props.selectedEnd) {
    const start = props.selectedStart;
    const minDateStr = ds < start ? ds : start;
    const maxDateStr = ds > start ? ds : start;

    const startD = new Date(minDateStr);
    const endD = new Date(maxDateStr);
    
    // 檢查範圍內是否有任何休館或已租借的日子
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      if (isDayClosed(d) || isDayRented(d)) return false;
    }

    const diffMs = Math.abs(endD.getTime() - startD.getTime());
    const diffDays = Math.round(diffMs / 86400000) + 1;
    
    if (diffDays > props.maxDays) return false;
    if (diffDays < props.minDays && minDateStr !== maxDateStr) return false;
  }
  return true;
}
</script>

<template>
  <div>
    <div class="flex justify-center items-center gap-2 mb-4">
      <button @click="previousMonth" class="btn btn-square btn-ghost">
        <span class="material-symbols-outlined text-base-content shrink-0 mt-0.5">chevron_left</span>
      </button>
      <span class="text-lg font-medium text-base-content min-w-20 text-center">{{ monthYear }}</span>
      <button @click="nextMonth" class="btn btn-square btn-ghost">
        <span class="material-symbols-outlined text-base-content shrink-0 mt-0.5">chevron_right</span>
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 mb-2">
      <div
        v-for="day in ['日', '一', '二', '三', '四', '五', '六']"
        :key="day"
        class="text-center text-xs font-medium text-base-content py-2"
      >
        {{ day }}
      </div>
    </div>

    <div class="grid grid-cols-7 gap-0 border-t border-l border-base-300">
      <div
        v-for="(day, index) in getDaysInMonth"
        :key="index"
        class="h-12 text-sm font-medium flex flex-col items-center justify-center transition-colors relative border-b border-r border-base-200"
        :class="day ? {
          'bg-base-200 text-base-content cursor-not-allowed': day.status === 'closed' || isPastDate(day.date),
          'bg-error text-error-content cursor-not-allowed': day.status === 'rented' && !isPastDate(day.date),
          'bg-base-200 text-base-content/50 cursor-not-allowed': day.status === 'available' && !isPastDate(day.date) && !canSelectDate(day.date),
          'ring-2 ring-success ring-offset-1 z-10': isToday(day.date) && day.status !== 'closed' && !isSelected(day.date),
          'bg-success text-success-content font-bold z-10': isSelected(day.date),
          'bg-success/15': isInRange(day.date) && day.status === 'available' && !isPastDate(day.date),
          'bg-base-100 text-base-content cursor-pointer hover:bg-base-200': day.status === 'available' && !isPastDate(day.date) && !isSelected(day.date) && !isInRange(day.date) && canSelectDate(day.date),
        } : 'invisible'"
        @click="day && canSelectDate(day.date) && emit('select-date', formatDate(day.date))"
      >
        <template v-if="day">
          <span>{{ day.date.getDate() }}</span>
          <span v-if="isRangeStart(day.date) && selectedEnd" class="text-[8px] leading-none font-normal mt-0.5">起</span>
          <span v-else-if="isRangeEnd(day.date)" class="text-[8px] leading-none font-normal mt-0.5">迄</span>
          <span v-else-if="day.status === 'closed'" class="text-[9px] leading-none text-base-content font-normal">休</span>
          <span v-else-if="day.status === 'rented'" class="w-1 h-1 rounded-full bg-error-content mt-0.5"></span>
        </template>
      </div>
    </div>

    <!-- 圖例 -->
    <div v-if="showLegend" class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-base-content">
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-base-100 border border-base-300"></span>
        可租借
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-error border border-error"></span>
        已有租借
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-base-200 border border-base-300"></span>
        休館日
      </div>
      <div v-if="selectedStart" class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-success"></span>
        已選取
      </div>
      <div v-if="selectedStart && selectedEnd" class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-success/15 border border-success"></span>
        選取範圍
      </div>
    </div>
  </div>
</template>
