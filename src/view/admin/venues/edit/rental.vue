<script setup lang="ts">
import { inject, watchEffect, type Ref } from 'vue';
import RentalModeCollapse from './RentalModeCollapse.vue';

interface SessionDef {
  name: string;
  startTime: string;
  endTime: string;
  weekday: number;
  weekend: number;
}

interface RequiredDocument {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  templateFile?: string | null;
  appliesTo: { daily: boolean; session: boolean; hourly: boolean };
}

interface RentalModeBase {
  enabled: boolean;
  requireDocuments: boolean;
  requiredDocuments: RequiredDocument[];
  depositEnabled: boolean;
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

interface Venue {
  rentalModes: {
    daily: RentalModeBase & { minDays: number; maxDays: number };
    session: RentalModeBase & { sessions: SessionDef[] };
    hourly: RentalModeBase & { minHours: number; maxHours: number };
  };
  pricing: {
    daily: Record<string, number>;
    hourly: Record<string, number>;
  };
  pricePerHour: number;
  advanceBookingDays: number;
  latestBookingDays: number;
  receiptUploadDeadlineDays: number;
  documentUploadDeadlineDays: number;
  cancellationDeadlineDays: number;
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
  weekendPricingEnabled: boolean;
  requiredDocuments: RequiredDocument[];
}

const formData = inject<Ref<Venue>>('venueFormData')!;
const venueDefaults = formData.value as Venue & Record<string, any>;

// 確保新欄位有預設值
venueDefaults.advanceBookingDays ??= 7;
venueDefaults.latestBookingDays ??= 1;
venueDefaults.receiptUploadDeadlineDays ??= 3;
venueDefaults.documentUploadDeadlineDays ??= 7;
venueDefaults.cancellationDeadlineDays ??= 7;

// 共用假日定義（從第一個有值的模式提取，或使用預設值）
const firstMode = venueDefaults.rentalModes.daily || venueDefaults.rentalModes.session || venueDefaults.rentalModes.hourly;
venueDefaults.weekendDays ??= firstMode?.weekendDays ?? [0, 6];
venueDefaults.weekendIncludeHolidays ??= firstMode?.weekendIncludeHolidays ?? false;

// 確保每個租借方式都有各自管理的欄位
for (const mode of ['daily', 'session', 'hourly'] as const) {
  const rm = formData.value.rentalModes[mode] as any;
  if (!('depositEnabled' in rm)) rm.depositEnabled = false;
  rm.depositAmount ??= 0;
  rm.setupAllowanceHours ??= 1;
  rm.teardownAllowanceHours ??= 1;
  rm.setupOverageUnitMinutes ??= 30;
  rm.teardownOverageUnitMinutes ??= 30;
  rm.setupOverageFeePerUnit ??= 0;
  rm.teardownOverageFeePerUnit ??= 0;
  rm.overageRoundingMode ??= 'ceil';
  if (!('weekendPricingEnabled' in rm)) rm.weekendPricingEnabled = false;
  if (!('weekendDays' in rm)) rm.weekendDays = formData.value.weekendDays ?? [0, 6];
  if (!('weekendIncludeHolidays' in rm)) rm.weekendIncludeHolidays = formData.value.weekendIncludeHolidays ?? false;
}

// 確保 sessions 是新格式（陣列物件）
function ensureSessionFormat() {
  const s = formData.value.rentalModes.session;
  if (!Array.isArray(s.sessions) || (s.sessions.length > 0 && typeof s.sessions[0] === 'string')) {
    (s as any).sessions = [];
  }
}
ensureSessionFormat();

// 同步共用假日定義到各模式
watchEffect(() => {
  const enabled = formData.value.weekendDays?.length > 0 || formData.value.weekendIncludeHolidays;
  for (const mode of ['daily', 'session', 'hourly'] as const) {
    const rm = formData.value.rentalModes[mode] as any;
    rm.weekendPricingEnabled = enabled;
    rm.weekendDays = formData.value.weekendDays;
    rm.weekendIncludeHolidays = formData.value.weekendIncludeHolidays;
  }
});

function addSession() {
  formData.value.rentalModes.session.sessions.push({
    name: '',
    startTime: '08:00',
    endTime: '12:00',
    weekday: 0,
    weekend: 0,
  });
}

function removeSession(index: number) {
  formData.value.rentalModes.session.sessions.splice(index, 1);
}

const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
});

function handleSave() {
  alert('租借方式儲存成功（prototype 模擬）');
}
</script>

<template>
  <!-- ========== 方案與價格 ========== -->

  <!-- 整日租借 -->
  <RentalModeCollapse mode-key="daily" label="整日租借">

    <label class="label">最少租借天數</label>
    <div class="input">
      <input v-model.number="formData.rentalModes.daily.minDays" type="number" min="1" class="input text-end" />
      <span>天</span>
    </div>

    <label class="label">最多租借天數</label>
    <div class="input">
      <input v-model.number="formData.rentalModes.daily.maxDays" type="number" min="1" class="input text-end" />
      <span>天</span>
    </div>

    <label class="label">價格（元/日）</label>
    <div class="input">
      <input v-model.number="formData.pricing.daily.weekday" type="number" min="0" class="input text-end" />
      <span>元/日</span>
    </div>

    <template v-if="formData.weekendPricingEnabled">
      <label class="label">假日價格</label>
      <div class="input">
        <input v-model.number="formData.pricing.daily.weekend" type="number" min="0" class="input text-end" />
        <span>元/日</span>
      </div>
    </template>

  </RentalModeCollapse>

  <!-- 時段租借 -->
  <RentalModeCollapse mode-key="session" label="時段租借（自訂租借時段，設定各時段的名稱、時間範圍與價格）">

    <label class="label">時段名稱</label>
    <div class="fieldset flex gap-4 bg-base-200 p-4 rounded-box"
      v-for="(session, index) in formData.rentalModes.session.sessions" :key="index">
      <button type="button" class="btn btn-error btn-ghost btn-square self-end mb-2" @click="removeSession(index)">
        <span class="material-symbols-outlined">delete</span>
      </button>
      <div class="form-control">
        <label class="label">時段名稱</label>
        <input v-model="session.name" type="text" placeholder="例如：上午" class="input" />
      </div>
      <div class="form-control">
        <label class="label">開始時間</label>
        <select v-model="session.startTime" class="select">
          <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="form-control">
        <label class="label">結束時間</label>
        <select v-model="session.endTime" class="select">
          <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="form-control">
        <label class="label">價格</label>
        <div class="input">
          <input v-model.number="session.weekday" type="number" min="0" class="input text-end" />
          <span>元</span>
        </div>
      </div>
      <div v-if="formData.weekendPricingEnabled" class="form-control">
        <label class="label">假日</label>
        <div class="input">
          <input v-model.number="session.weekend" type="number" min="0" class="input text-end" />
          <span>元</span>
        </div>
      </div>
    </div>

    <button type="button" class="btn btn-neutral w-fit" @click="addSession">＋ 新增時段</button>

  </RentalModeCollapse>

  <!-- 計時租借 -->
  <RentalModeCollapse mode-key="hourly" label="計時租借">

    <label class="label">最低時數</label>
    <div class="input">
      <input v-model.number="formData.rentalModes.hourly.minHours" type="number" min="1" class="input text-end" />
      <span>小時</span>
    </div>

    <label class="label">最多時數</label>
    <div class="input">
      <input v-model.number="formData.rentalModes.hourly.maxHours" type="number" min="1" class="input text-end" />
      <span>小時</span>
    </div>

    <label class="label">價格</label>
    <div class="input">
      <input v-model.number="formData.pricing.hourly.weekday" type="number" min="0" class="input text-end" />
      <span>元/時</span>
    </div>

    <template v-if="formData.weekendPricingEnabled">
      <label class="label">假日價格</label>
      <div class="input">
        <input v-model.number="formData.pricing.hourly.weekend" type="number" min="0" class="input text-end" />
        <span>元/時</span>
      </div>
    </template>

  </RentalModeCollapse>

  <!-- 儲存 -->
  <div class="flex justify-end">
    <button type="button" class="btn btn-primary px-8" @click="handleSave">儲存租借方式</button>
  </div>

</template>
