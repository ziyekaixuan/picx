<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import BrandLogo from '@/components/brand-logo/brand-logo.vue'
import HeaderTools from '@/components/header-tools/header-tools.vue'
import NavContent from '@/components/nav-content/nav-content.vue'

const headerBox = useTemplateRef<HTMLElement>('headerBox')
const isStuck = ref(false)
const isHidden = ref(false)
let stuckThreshold = 0
let lastScrollY = 0

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

// 上滑（往下滚）隐藏顶栏，下滑（往上滚）显示顶栏；
// 位移按累计量判断，慢速滑动也能正常触发
function updateVisibility() {
  const scrollY = window.scrollY
  if (scrollY <= 120) {
    isHidden.value = false
    lastScrollY = scrollY
    return
  }
  const deltaY = scrollY - lastScrollY
  if (deltaY <= -4) {
    isHidden.value = false
    lastScrollY = scrollY
  }
  else if (deltaY >= 10 && !document.querySelector('.nav-panel')) {
    isHidden.value = true
    lastScrollY = scrollY
  }
}

function onScroll() {
  updateStuck()
  updateVisibility()
}

function onResize() {
  measureThreshold()
  onScroll()
}

onMounted(() => {
  measureThreshold()
  lastScrollY = window.scrollY
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <header ref="headerBox" class="header-content-box" :class="{ 'is-stuck': isStuck, 'is-hidden': isHidden }">
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
