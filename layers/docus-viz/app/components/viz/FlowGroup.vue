<script setup lang="ts">
defineProps<{ data: { label: string } }>()
</script>

<template>
  <div class="flow-group">
    <span class="flow-group__label">{{ data.label }}</span>
  </div>
</template>
