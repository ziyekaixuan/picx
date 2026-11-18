<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import BrandLogo from '@/components/brand-logo/brand-logo.vue'
import HeaderTools from '@/components/header-tools/header-tools.vue'
import NavContent from '@/components/nav-content/nav-content.vue'

const headerBox = useTemplateRef<HTMLElement>('headerBox')
const isStuck = ref(false)
let stuckThreshold = 0

function measureThreshold() {
  const el = headerBox.value
  if (!el)
    return
  const top = Number.parseFloat(getComputedStyle(el).top) || 0
  stuckThreshold = el.offsetTop - top
}

function updateStuck() {
  isStuck.value = window.scrollY > stuckThreshold
}

function onResize() {
  measureThreshold()
  updateStuck()
}

onMounted(() => {
  measureThreshold()
  updateStuck()
  window.addEventListener('scroll', updateStuck, { passive: true })
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateStuck)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <header ref="headerBox" class="header-content-box" :class="{ 'is-stuck': isStuck }">
    <RouterLink class="brand-box" :to="{ path: '/', query: { jump: '0' } }" :aria-label="$t('header.home')">
      <BrandLogo />
      <span class="product-name">{{ $t('header.product') }}</span>
    </RouterLink>
    <NavContent>
      <HeaderTools />
    </NavContent>
  </header>
</template>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
