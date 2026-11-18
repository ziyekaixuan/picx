<script setup lang="ts">
import { LaunchPageEnum, setLaunchPage, useLaunchPage } from '@/utils/launch-page'

const launchPage = useLaunchPage()
const options = [
  { value: LaunchPageEnum.upload, label: 'nav.upload' },
  { value: LaunchPageEnum.management, label: 'nav.management' },
  { value: LaunchPageEnum.settings, label: 'nav.settings' },
] as const
</script>

<template>
  <section class="settings-section app-settings">
    <header class="settings-section-heading">
      <h1>
        {{ $t('settings_workspace.app') }}
      </h1>
      <p>{{ $t('settings_workspace.app_desc') }}</p>
    </header>
    <div class="settings-grid">
      <article class="settings-card">
        <h2>{{ $t('settings_workspace.launch_page') }}</h2>
        <p>{{ $t('settings_workspace.launch_page_desc') }}</p>
        <div class="settings-segments">
          <button v-for="option in options" :key="option.value" type="button" :class="{ 'is-active': launchPage === option.value }" @click="setLaunchPage(option.value)">
            {{ $t(option.label) }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="stylus">
@import "./app-settings.styl"
</style>
