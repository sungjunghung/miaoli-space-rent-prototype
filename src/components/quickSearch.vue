<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import MonthCalendar from "@/components/calendar/MonthCalendar.vue";

const router = useRouter();

const emit = defineEmits<{
  (e: 'search'): void;
}>();

// 取得當前日期並格式化為 YYYY-MM-DD
const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 取得N天後的日期
const getDateAfterDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayDate = getTodayString();
const sevenDaysLater = getDateAfterDays(7);

const searchMode = ref<"daily" | "multi">("daily");
const searchDate = ref(todayDate);
const searchStartTime = ref("");
const searchStartDate = ref(sevenDaysLater);
const searchEndDate = ref(getDateAfterDays(8));

const handleCalendarSelect = (dateStr: string) => {
  if (!searchStartDate.value || (searchStartDate.value && searchEndDate.value)) {
    searchStartDate.value = dateStr;
    searchEndDate.value = "";
  } else {
    if (dateStr < searchStartDate.value) {
      searchStartDate.value = dateStr;
    } else {
      searchEndDate.value = dateStr;
    }
  }
};

const hourOptions = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

// 動態計算可用時間選項（當日需提前2小時，其他日期無限制）
const availableTimeOptions = computed(() => {
  // 如果選擇的日期不是今天，返回所有時段
  if (searchDate.value !== todayDate) {
    return hourOptions;
  }

  // 當日情況：計算當前時間 + 2小時後的時段
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // 計算2小時後的時間（以小時為單位，向上取整）
  const minHour = currentMinute > 0 ? currentHour + 3 : currentHour + 2;

  // 過濾出符合條件的時段
  return hourOptions.filter((time) => {
    const [hour] = time.split(":").map(Number);
    return hour !== undefined && hour >= minHour;
  });
});

// 監聽可用時間選項變化，自動設置為第一個可用時段
watch(
  availableTimeOptions,
  (newOptions) => {
    if (newOptions.length > 0 && !searchStartTime.value) {
      searchStartTime.value = newOptions[0] || "";
    }
  },
  { immediate: true }
);

// 監聽日期變化，重置時間選擇
watch(searchDate, () => {
  if (availableTimeOptions.value.length > 0) {
    searchStartTime.value = availableTimeOptions.value[0] || "";
  }
});

const handleSearch = (): void => {
  emit('search');
  if (searchMode.value === "multi") {
    if (!searchStartDate.value) return;
    const endDate = searchEndDate.value || searchStartDate.value;

    router.push({
      name: "venue-list",
      query: {
        mode: "daily",
        startDate: searchStartDate.value,
        endDate: endDate,
      },
    });
    return;
  }

  router.push({
    name: "venue-list",
    query: {
      mode: "hourly",
      date: searchDate.value,
      time: searchStartTime.value,
    },
  });
};
</script>

<template>
  <div class="card bg-base-100 shadow-xl overflow-visible mx-auto">
    <div class="card-body p-6 sm:p-8">

      <!-- Mode Toggle -->
      <div class="tabs tabs-boxed bg-base-200 p-1 rounded">
        <a class="tab tab-lg flex-1 gap-2 font-bold transition-all"
          :class="{ 'tab-active bg-neutral text-white': searchMode === 'daily' }" @click="searchMode = 'daily'">
          <span class="material-symbols-outlined text-[20px]">schedule</span>
          時段租借
        </a>
        <a class="tab tab-lg flex-1 gap-2 font-bold transition-all"
          :class="{ 'tab-active bg-neutral text-white': searchMode === 'multi' }" @click="searchMode = 'multi'">
          <span class="material-symbols-outlined text-[20px]">date_range</span>
          多日租借
        </a>
      </div>

      <!-- Form Inputs -->
      <!-- Daily Mode -->
      <div v-if="searchMode === 'daily'" key="daily" class="fieldset">
        <label class="label">預約日期</label>

        <input id="search-date" class="input w-full" v-model="searchDate" type="date" :min="todayDate" />
        <label class="label">開始時間</label>

        <select id="search-start-time" v-model="searchStartTime" class="select w-full">
          <option value="" disabled>選擇開始時間</option>
          <option v-for="option in availableTimeOptions" :key="`start-${option}`" :value="option">
            {{ option }}
          </option>
        </select>

        <!-- <div class="alert alert-warning shadow-sm mt-4 p-3 rounded flex items-center gap-2">
          <span class="material-symbols-outlined shrink-0 text-[18px]">info</span>
          <span class="text-sm font-medium">當日預約需提前 2 小時</span>
        </div> -->
      </div>

      <!-- Multi Mode -->
      <div v-else key="multi" class="fieldset">
        <label class="label mb-2">選擇租借範圍</label>
        
        <div class="bg-base-100 border border-base-200 rounded-lg pb-2 pt-0 shadow-inner">
           <MonthCalendar
             :selected-start="searchStartDate"
             :selected-end="searchEndDate"
             :show-legend="false"
             @select-date="handleCalendarSelect"
           />
        </div>
      </div>

      <!-- Action Button -->
      <div class="card-actions">
        <button type="button" class="btn btn-neutral w-full btn-lg mt-2" @click="handleSearch">
          <span class="material-symbols-outlined">search</span>
          搜尋場館

        </button>
      </div>

    </div>
  </div>
</template>
