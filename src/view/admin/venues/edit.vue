<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAllVenueBaseRecords, getVenueEditFormData, type VenueEditFormData } from '@/mocks/venue-edit/adapter';

const route = useRoute();
const router = useRouter();

const venueId = computed(() => Number(route.params.id));
const formData = ref<VenueEditFormData>({
  id: 0,
  parentId: null,
  name: '',
  status: 'available',
  capacity: 0,
  location: '',
  type: '',
  description: '',
  mainImageUrl: '',
  gallery: [],
  pricePerHour: 0,
  facilities: [],
  openingHours: {},
  rentalModes: {
    daily: {
      enabled: false,
      minDays: 0,
      maxDays: 0,
      requireDocuments: false,
      requiredDocuments: [],
      depositEnabled: false,
      depositAmount: 0,
      setupAllowanceHours: 1,
      teardownAllowanceHours: 1,
      setupOverageUnitMinutes: 30,
      teardownOverageUnitMinutes: 30,
      setupOverageFeePerUnit: 0,
      teardownOverageFeePerUnit: 0,
      overageRoundingMode: 'ceil',
      weekendPricingEnabled: false,
      weekendDays: [0, 6],
      weekendIncludeHolidays: false,
    },
    session: {
      enabled: false,
      sessions: [],
      requireDocuments: false,
      requiredDocuments: [],
      depositEnabled: false,
      depositAmount: 0,
      setupAllowanceHours: 1,
      teardownAllowanceHours: 1,
      setupOverageUnitMinutes: 30,
      teardownOverageUnitMinutes: 30,
      setupOverageFeePerUnit: 0,
      teardownOverageFeePerUnit: 0,
      overageRoundingMode: 'ceil',
      weekendPricingEnabled: false,
      weekendDays: [0, 6],
      weekendIncludeHolidays: false,
    },
    hourly: {
      enabled: false,
      minHours: 0,
      maxHours: 0,
      requireDocuments: false,
      requiredDocuments: [],
      depositEnabled: false,
      depositAmount: 0,
      setupAllowanceHours: 1,
      teardownAllowanceHours: 1,
      setupOverageUnitMinutes: 30,
      teardownOverageUnitMinutes: 30,
      setupOverageFeePerUnit: 0,
      teardownOverageFeePerUnit: 0,
      overageRoundingMode: 'ceil',
      weekendPricingEnabled: false,
      weekendDays: [0, 6],
      weekendIncludeHolidays: false,
    },
  },
  pricing: { daily: {}, session: {}, hourly: {} },
  closedWeekdays: [],
  closedDates: [],
  rentalItems: [],
  notices: [],
  isActive: true,
  advanceBookingDays: 7,
  latestBookingDays: 1,
  receiptUploadDeadlineDays: 3,
  documentUploadDeadlineDays: 7,
  cancellationDeadlineDays: 7,
  weekendDays: [0, 6],
  weekendIncludeHolidays: false,
  weekendPricingEnabled: false,
  requiredDocuments: [],
});

onMounted(() => {
  const venue = getVenueEditFormData(venueId.value);
  if (venue) {
    formData.value = venue;
  }
});

const allVenues = computed(() => getAllVenueBaseRecords());

provide('venueFormData', formData);
provide('allVenues', allVenues);

const tabs = [
  { key: 'basic', label: '場館資料', routeName: 'admin-venue-edit-basic' },
  { key: 'rental-rules', label: '租借規則', routeName: 'admin-venue-edit-rental-rules' },
  { key: 'rental', label: '方案與價格', routeName: 'admin-venue-edit-rental' },
  { key: 'rental-items', label: '附加項目', routeName: 'admin-venue-edit-rental-items' },
  { key: 'photos', label: '場館場館照片', routeName: 'admin-venue-edit-photos' },
];

const activeTab = computed(() => {
  const name = route.name as string;
  const tab = tabs.find((t) => t.routeName === name);
  return tab?.key ?? 'basic';
});

function navigateTab(tab: (typeof tabs)[number]) {
  router.replace({ name: tab.routeName, params: { id: venueId.value } });
}
</script>

<template>
  <!-- Tabs -->
  <div role="tablist" class="tabs tabs-lift mb-4">
    <button v-for="tab in tabs" :key="tab.key" role="tab" class="tab" :class="{ 'tab-active': activeTab === tab.key }"
      @click="navigateTab(tab)">
      {{ tab.label }}
    </button>
  </div>
  <!-- Sub-page content -->
  <router-view />
</template>
