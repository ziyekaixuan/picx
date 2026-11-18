<template>
  <section class="login-container">
    <header class="connection-intro">
      <h1 id="connection-title">
        {{ $t('connection.title') }}
      </h1>
      <p>{{ $t('connection.description') }}</p>
    </header>
    <form class="connection-card" @submit.prevent="submitToken">
      <div class="card-heading">
        <span class="login-icon"><PicxIcon name="key-round" :size="28" /></span>
      </div>
      <h2 id="token-title">
        {{ $t('authorization.text_2') }}
      </h2>
      <p id="token-description">
        {{ $t('connection.token_description') }}
      </p>
      <div class="token-field">
        <label for="connection-token">{{ $t('connection.token_label') }}</label>
        <div class="token-input-wrap" :class="{ invalid: Boolean(errorKey) }">
          <input
            id="connection-token"
            ref="tokenInput"
            v-model="tokenDraft"
            :type="tokenVisible ? 'text' : 'password'"
            :placeholder="$t('config_page.input_token')"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            :disabled="pending"
            @input="tokenRequired = false"
          >
          <button type="button" class="picx-icon-button" :title="$t(tokenVisible ? 'connection.hide_token' : 'connection.show_token')" :disabled="pending" @click="tokenVisible = !tokenVisible">
            <PicxIcon :name="tokenVisible ? 'eye-off' : 'eye'" :size="18" />
          </button>
        </div>
        <p v-if="errorKey" id="token-error" class="connection-error" role="alert">
          {{ $t(errorKey) }}
        </p>
      </div>
      <div class="login-actions">
        <el-button native-type="submit" :loading="busy" :disabled="pending">
          <PicxIcon name="key-round" :size="18" />{{ $t('connection.token_continue') }}
        </el-button>
        <div class="login-links">
          <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">{{ $t('authorization.text_12') }}</a>
          <a href="https://picx-docs.xpoet.cn/usage-guide/config.html#填写-github-token-登录" target="_blank" rel="noopener noreferrer">{{ $t('connection.token_help') }}</a>
        </div>
      </div>
    </form>
    <p v-if="loggedInAccount" class="login-container__account">
      <PicxIcon name="github" :size="20" />
      <i18n-t keypath="connection.logged_in_account" tag="span">
        <template #account>
          <strong>{{ loggedInAccount }}</strong>
        </template>
      </i18n-t>
    </p>
    <p v-if="pending" class="connection-progress" role="status">
      {{ $t(progressKey) }}
    </p>
  </section>
</template>

<script setup lang="ts">
/* eslint vue/block-order: ["error", { order: ["template", "script", "style"] }] */
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { useGithubConnection } from '@/composables/use-github-connection'
import router from '@/router'
import { store } from '@/stores'
import { cleanConnectionQuery, connectionReturnTo } from '@/utils/login-navigation'
import { getLaunchPage, LaunchPageEnum } from '@/utils/launch-page'

const { connection, busy, connect, restore } = useGithubConnection()
const loggedInAccount = computed(() => {
  const config = store.getters.getUserConfigInfo
  return config.logined ? config.owner : ''
})
const tokenDraft = ref('')
const tokenVisible = ref(false)
const tokenRequired = ref(false)
const tokenInput = useTemplateRef<HTMLInputElement>('tokenInput')
const pending = computed(() => busy.value)
const errorKey = computed(() => {
  if (tokenRequired.value)
    return 'connection.token_required'
  if (connection.value.phase !== 'failed')
    return ''
  const kind = connection.value.error.kind
  return ['initialization-failed', 'storage-unavailable'].includes(kind)
    ? `connection.${kind}`
    : `request_error.${kind}`
})
const progressKey = computed(() => connection.value.phase === 'initializing'
  ? `connection.step_${connection.value.step}`
  : 'connection.validating')

async function submitToken() {
  if (pending.value)
    return
  tokenRequired.value = !tokenDraft.value.trim()
  if (tokenRequired.value) {
    tokenInput.value?.focus()
    return
  }
  if (await connect(tokenDraft.value.trim())) {
    tokenDraft.value = ''
    tokenVisible.value = false
    await router.replace(connectionReturnTo(router.currentRoute.value.query.returnTo))
  }
}

async function initializeConnectionPage() {
  const query = router.currentRoute.value.query
  const target = connectionReturnTo(query.returnTo)
  if (query.focus === '1') {
    await router.replace({ path: '/', query: cleanConnectionQuery(query) })
    await nextTick()
    tokenInput.value?.focus()
    return
  }
  if (query.auto === '1') {
    await router.replace({ path: '/', query: cleanConnectionQuery(query) })
    if (await restore())
      await router.replace(target)
    return
  }
  const config = store.getters.getUserConfigInfo
  if (query.jump !== '0' && config.token && config.logined && config.owner && config.repo && config.branch) {
    const home = getLaunchPage()
    await router.replace({ path: home, query: home === LaunchPageEnum.upload && !config.selectedDir ? { directory: '1' } : {} })
  }
}

onMounted(initializeConnectionPage)
watch(() => router.currentRoute.value.fullPath, () => {
  const route = router.currentRoute.value
  if (route.path === '/' && (route.query.focus === '1' || route.query.auto === '1')) {
    initializeConnectionPage()
  }
})
</script>

<style scoped lang="stylus">
@import './picx-login.styl'
</style>
