<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'secondary'; disabled?: boolean; type?: 'button' | 'submit' }>(), { variant: 'primary', type: 'button' })
</script>
<template><button :type="type" :disabled="disabled" class="ui-button" :class="`ui-button--${variant}`"><slot /></button></template>
