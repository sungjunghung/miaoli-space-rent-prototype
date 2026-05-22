<script setup lang="ts">
import { inject, ref, watchEffect, type Ref } from 'vue';

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
  weekendPricingEnabled: boolean;
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
}

interface Venue {
  rentalModes: {
    daily: RentalModeBase & { minDays: number; maxDays: number };
    session: RentalModeBase & { sessions: any[] };
    hourly: RentalModeBase & { minHours: number; maxHours: number };
  };
  advanceBookingDays: number;
  latestBookingDays: number;
  receiptUploadDeadlineDays: number;
  documentUploadDeadlineDays: number;
  cancellationDeadlineDays: number;
  weekendDays: number[];
  weekendIncludeHolidays: boolean;
  requiredDocuments: RequiredDocument[];
}

const formData = inject<Ref<Venue>>('venueFormData')!;
const venueDefaults = formData.value as Venue & Record<string, any>;

venueDefaults.advanceBookingDays ??= 7;
venueDefaults.latestBookingDays ??= 1;
venueDefaults.receiptUploadDeadlineDays ??= 3;
venueDefaults.documentUploadDeadlineDays ??= 7;
venueDefaults.cancellationDeadlineDays ??= 7;

const firstMode = venueDefaults.rentalModes.daily || venueDefaults.rentalModes.session || venueDefaults.rentalModes.hourly;
venueDefaults.weekendDays ??= firstMode?.weekendDays ?? [0, 6];
venueDefaults.weekendIncludeHolidays ??= firstMode?.weekendIncludeHolidays ?? false;

for (const mode of ['daily', 'session', 'hourly'] as const) {
  const rm = formData.value.rentalModes[mode] as any;
  if (!('weekendDays' in rm)) rm.weekendDays = formData.value.weekendDays ?? [0, 6];
  if (!('weekendIncludeHolidays' in rm)) rm.weekendIncludeHolidays = formData.value.weekendIncludeHolidays ?? false;
  if (!('weekendPricingEnabled' in rm)) rm.weekendPricingEnabled = false;
}

watchEffect(() => {
  const enabled = formData.value.weekendDays?.length > 0 || formData.value.weekendIncludeHolidays;
  for (const mode of ['daily', 'session', 'hourly'] as const) {
    const rm = formData.value.rentalModes[mode] as any;
    rm.weekendPricingEnabled = enabled;
    rm.weekendDays = formData.value.weekendDays;
    rm.weekendIncludeHolidays = formData.value.weekendIncludeHolidays;
  }
});

watchEffect(() => {
  for (const doc of formData.value.requiredDocuments ?? []) {
    for (const mode of ['daily', 'session', 'hourly'] as const) {
      if (!formData.value.rentalModes[mode]?.enabled) {
        doc.appliesTo[mode] = false;
      }
    }
  }
});

const weekdayOptions = [
  { value: 0, label: '日' },
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
];

function toggleWeekendDay(day: number) {
  const days = formData.value.weekendDays;
  const idx = days.indexOf(day);
  if (idx >= 0) {
    days.splice(idx, 1);
  } else {
    days.push(day);
  }
}

const newDocLabel = ref('');

function addDocument() {
  const label = newDocLabel.value.trim();
  if (!label) return;
  formData.value.requiredDocuments.push({
    key: Date.now().toString(),
    label,
    hint: '',
    required: true,
    templateFile: '',
    appliesTo: { daily: true, session: true, hourly: true },
  });
  newDocLabel.value = '';
}

function removeDocument(index: number) {
  formData.value.requiredDocuments.splice(index, 1);
}

function handleTemplateUpload(event: Event, doc: any) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    doc.templateFile = file.name;
    target.value = '';
  }
}

const MODE_LABELS: Record<string, string> = {
  daily: '整日',
  session: '時段',
  hourly: '計時',
};

function isModeEnabled(mode: keyof RequiredDocument['appliesTo']) {
  return !!formData.value.rentalModes[mode]?.enabled;
}

function handleSave() {
  alert('租借規則儲存成功（prototype 模擬）');
}
</script>

<template>
  <div class="card bg-base-100 shadow-sm mb-6">
    <div class="card-body">
      <h2 class="card-title">
        <span class="material-symbols-outlined text-primary">rule</span>
        申請規則
      </h2>
      <fieldset class="fieldset append">
        <label class="label">最早可申請時間</label>
        <div class="input">
          使用日前
          <input v-model.number="formData.advanceBookingDays" type="number" min="0" class="grow text-end" />
          <span>天開放申請</span>
        </div>
        <label class="label">匯款資料上傳期限</label>
        <div class="input">
          確認預約後
          <input v-model.number="formData.receiptUploadDeadlineDays" type="number" min="1" class="grow text-end" />
          <span>天內需完成上傳</span>
        </div>
        <label class="label">最晚可預約期限</label>
        <div class="input">
          使用日前
          <input v-model.number="formData.latestBookingDays" type="number" min="0" class="grow text-end" />
          <span>天截止預約</span>
        </div>
        <label class="label">最晚取消期限</label>
        <div class="input">
          使用日前
          <input v-model.number="formData.cancellationDeadlineDays" type="number" min="1" class="grow text-end" />
          <span>天可取消預約</span>
        </div>
      </fieldset>
    </div>
  </div>

  <div class="card bg-base-100 shadow-sm mb-6">
    <div class="card-body space-y-3">
      <h2 class="card-title">
        <span class="material-symbols-outlined text-primary">calendar_month</span>
        假日定義
      </h2>
      <p class="text-sm text-base-content/50">勾選的星期將適用假日價格，所有租借模式共用此設定</p>
      <div class="flex flex-wrap gap-8">
        <label v-for="wd in weekdayOptions" :key="wd.value" class="label cursor-pointer gap-2">
          <input type="checkbox" class="checkbox checkbox-success"
            :checked="formData.weekendDays?.includes(wd.value)" @change="toggleWeekendDay(wd.value)" />
          <span>{{ wd.label }}</span>
        </label>
        <label class="label cursor-pointer gap-2">
          <input type="checkbox" class="checkbox checkbox-success" v-model="formData.weekendIncludeHolidays" />
          <span>法定國定假日</span>
        </label>
      </div>
    </div>
  </div>

  <div class="card bg-base-100 shadow-sm mb-6">
    <div class="card-body space-y-3">
      <h2 class="card-title">
        <span class="material-symbols-outlined text-primary">description</span>
        申請文件
      </h2>
      <fieldset class="fieldset append">
        <label class="label">文件上傳期限</label>
        <div class="input">
          審核通過後
          <input v-model.number="formData.documentUploadDeadlineDays" type="number" min="1" class="grow text-end" />
          <span>天內須上傳</span>
        </div>
        <label class="label">新增需求文件</label>
        <div class="flex gap-2 mb-3">
          <input v-model="newDocLabel" type="text" placeholder="輸入文件名稱後按 Enter 或點擊新增"
            class="input input-bordered flex-1" @keyup.enter="addDocument" />
          <button type="button" class="btn btn-primary" @click="addDocument">新增</button>
        </div>
        <div class="space-y-3">
          <div v-if="!formData.requiredDocuments?.length" class="text-base-content/30 italic p-3">尚未新增任何文件</div>
          <div v-for="(doc, index) in formData.requiredDocuments" :key="doc.key"
            class="p-3 bg-base-100 rounded-lg border border-base-300 space-y-2">
            <div class="flex items-center gap-3">
              <button type="button" class="btn btn-ghost btn-circle btn-sm" @click="removeDocument(index)">✕</button>
              <span class="badge badge-neutral">{{ index + 1 }}</span>
              <p class="flex-1 text-base truncate font-medium">{{ doc.label }}</p>

              <div class="flex items-center gap-3">
                <span v-if="!doc.templateFile" class="text-xs text-base-content/50">尚未上傳範本 (選填)</span>
                <div v-else class="flex items-center gap-2 bg-base-100 px-3 py-1 rounded border border-base-300">
                  <span class="material-symbols-outlined text-sm text-primary">description</span>
                  <span class="text-xs truncate max-w-50 font-medium">{{ doc.templateFile }}</span>
                  <button type="button" class="btn btn-ghost btn-xs btn-circle text-error" @click="doc.templateFile = ''">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <button type="button" class="btn btn-outline btn-sm bg-base-100"
                  @click="($refs['fileInput_' + index] as HTMLInputElement[])[0]?.click()">
                  <span class="material-symbols-outlined text-sm">upload_file</span>
                  上傳範本
                </button>
                <input type="file" :ref="'fileInput_' + index" class="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                  @change="(e) => handleTemplateUpload(e, doc)" />
              </div>
            </div>
            <div class="flex items-center gap-4 pl-13">
              <span class="text-xs text-base-content/50 shrink-0">適用於：</span>
              <label v-for="(mLabel, mKey) in MODE_LABELS" :key="mKey" class="label cursor-pointer gap-1.5">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                  v-model="doc.appliesTo[mKey as keyof typeof doc.appliesTo]"
                  :disabled="!isModeEnabled(mKey as keyof typeof doc.appliesTo)" />
                <span class="text-sm" :class="{ 'text-base-content/40': !isModeEnabled(mKey as keyof typeof doc.appliesTo) }">{{ mLabel }}</span>
              </label>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  </div>

  <div class="flex justify-end">
    <button type="button" class="btn btn-primary px-8" @click="handleSave">儲存租借規則</button>
  </div>
</template>
