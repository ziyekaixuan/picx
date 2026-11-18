<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  getCloudDeployInfo,
  setCloudDeployInfo,
} from '@/components/deploy-status-bar/deploy-status-bar.util'
import HeaderContent from '@/components/header-content/header-content.vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import SiteFooter from '@/components/site-footer/site-footer.vue'

const showBackToTop = ref(false)

function updateBackToTop() {
  showBackToTop.value = window.scrollY > 400
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const initDeployStatus = async () => {
  const res = await getCloudDeployInfo()
  if (res) {
    await setCloudDeployInfo(res.content)
  }
}

onMounted(() => {
  initDeployStatus()
  updateBackToTop()
  window.addEventListener('scroll', updateBackToTop, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateBackToTop)
})
</script>

<template>
  <div class="main-container">
    <HeaderContent />
    <main class="main-content border-box">
      <router-view />
    </main>
    <SiteFooter />
    <button type="button" class="back-to-top" :class="{ visible: showBackToTop }" :title="$t('app.back_to_top')" @click="scrollToTop">
      <PicxIcon name="arrow-up" />
    </button>
  </div>
</template>

<style scoped lang="stylus">
@import "./main-container.styl"
</style>
