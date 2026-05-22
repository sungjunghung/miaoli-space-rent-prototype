<script setup lang="ts">
import { inject, computed, watchEffect, type Ref } from 'vue';

interface RentalModeBase {
  enabled: boolean;
  depositAmount: number;
  setupAllowanceHours: number;
  teardownAllowanceHours: number;
  setupOverageUnitMinutes: number;
  teardownOverageUnitMinutes: number;
  setupOverageFeePerUnit: number;
  teardownOverageFeePerUnit: number;
  overageRoundingMode: 'ceil' | 'floor' | 'nearest';
  weekendPricingEnabled: boolean;
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
}

const props = defineProps<{
  modeKey: 'daily' | 'session' | 'hourly';
  label: string;
}>();

const formData = inject<Ref<any>>('venueFormData')!;

const mode = computed<RentalModeBase>(() => formData.value.rentalModes[props.modeKey]);
const halfHourOptions = Array.from({ length: 13 }, (_, i) => {
  const value = i * 0.5;
  const minutes = i * 30;
  return {
    value,
    label: value === 0 ? '0 小時' : `${minutes} 分鐘 (${value} 小時)`,
  };
});

const overageUnitOptions = Array.from({ length: 8 }, (_, i) => {
  const minutes = (i + 1) * 30;
  return {
    value: minutes,
    label: `${minutes} 分鐘/單位`,
  };
});

// 從外層共用假日定義同步到各模式
watchEffect(() => {
  mode.value.weekendPricingEnabled =
    formData.value.weekendDays?.length > 0 || formData.value.weekendIncludeHolidays;
});
</script>

<template>
  <div class="collapse collapse-arrow border border-base-300 rounded-box mb-4"
    :class="{ 'bg-primary/5': mode.enabled }">
    <input type="checkbox" />
    <div class="collapse-title font-medium flex items-center gap-3 bg-base-100">
      <span class="text-lg">{{ label }}</span>
      <span v-if="mode.enabled" class="badge badge-success badge-sm ml-auto">已啟用</span>
    </div>

    <div class="collapse-content bg-base-100">
      <div class="p-2">
        <fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4 mb-4">
          <label class="label">
            <input type="checkbox" v-model="mode.enabled" class="toggle toggle-primary mb-0!" />
            啟用此租借模式
          </label>
        </fieldset>
        <fieldset v-if="mode.enabled" class="fieldset space-y-6">

          <!-- ── 價格設定 ── -->
          <div class="bg-base-200/30 rounded-box p-4 space-y-3">
            <h3 class="font-bold text-base border-b border-base-300 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">payments</span>
              價格設定
            </h3>
            <fieldset class="fieldset append">
              <!-- 各模式獨有的定價/設定區塊 -->
              <slot />
            </fieldset>
          </div>

          <!-- ── 保證金 ── -->
          <div class="bg-base-200/30 rounded-box p-4 space-y-3">
            <h3 class="font-bold text-base border-b border-base-300 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">shield</span>
              保證金
            </h3>
            <fieldset class="fieldset append">
              <label class="label">保證金金額</label>
              <div class="input">
                <input v-model.number="mode.depositAmount" type="number" min="0" step="1000" class="grow text-end" />
                <span>元</span>
              </div>
              <p class="label text-base-content/50">輸入 0 表示不需要保證金；活動結束且場地復原確認後可申請退還</p>
            </fieldset>
          </div>

          <!-- ── 場佈與撤場 ── -->
          <div class="bg-base-200/30 rounded-box p-4 space-y-3">
            <h3 class="font-bold text-base border-b border-base-300 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">construction</span>
              場佈與撤場
            </h3>
            <fieldset class="fieldset append">
              <label class="label">場佈容許時數</label>
              <select v-model.number="mode.setupAllowanceHours" class="select">
                <option v-for="opt in halfHourOptions" :key="`setup-allowance-${opt.value}`" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <label class="label">撤場容許時數</label>
              <select v-model.number="mode.teardownAllowanceHours" class="select">
                <option v-for="opt in halfHourOptions" :key="`teardown-allowance-${opt.value}`" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>

              <label class="label">場佈超時計費單位</label>
              <select v-model.number="mode.setupOverageUnitMinutes" class="select">
                <option v-for="opt in overageUnitOptions" :key="`setup-unit-${opt.value}`" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <label class="label">場佈超時每單位費用</label>
              <div class="input">
                <input v-model.number="mode.setupOverageFeePerUnit" type="number" min="0" step="1" class="grow text-end" />
                <span>元</span>
              </div>

              <label class="label">撤場超時計費單位</label>
              <select v-model.number="mode.teardownOverageUnitMinutes" class="select">
                <option v-for="opt in overageUnitOptions" :key="`teardown-unit-${opt.value}`" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <label class="label">撤場超時每單位費用</label>
              <div class="input">
                <input v-model.number="mode.teardownOverageFeePerUnit" type="number" min="0" step="1" class="grow text-end" />
                <span>元</span>
              </div>

              <label class="label">超時進位規則</label>
              <select v-model="mode.overageRoundingMode" class="select">
                <option value="ceil">無條件進位</option>
                <option value="nearest">四捨五入</option>
                <option value="floor">無條件捨去</option>
              </select>
            </fieldset>
          </div>

        </fieldset>
      </div>

    </div>
  </div>
</template>
