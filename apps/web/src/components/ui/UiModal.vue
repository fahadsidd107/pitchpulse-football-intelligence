<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch, useId } from 'vue'
const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>(); const titleId = useId(); let opener: HTMLElement | null = null
watch(() => props.open, async (open) => { await nextTick(); if (open) { opener = document.activeElement as HTMLElement; dialog.value?.showModal(); } else { dialog.value?.close(); opener?.focus() } })
function trap(event: KeyboardEvent) { if (event.key !== 'Tab') return; const items = dialog.value?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]'); if (!items?.length) { event.preventDefault(); return } const first = items[0]; const last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() } }
onBeforeUnmount(() => { if (props.open) opener?.focus() })
</script>
<template><Teleport to="body"><dialog ref="dialog" class="ui-modal" :aria-labelledby="titleId" @cancel.prevent="emit('close')" @keydown="trap"><div class="modal-heading"><h2 :id="titleId">{{ title }}</h2><button aria-label="Close dialog" class="icon-button" @click="emit('close')">×</button></div><slot /></dialog></Teleport></template>
