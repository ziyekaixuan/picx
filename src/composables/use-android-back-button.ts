import { App } from '@capacitor/app'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted } from 'vue'
import i18n from '@/plugins/vue/i18n'
import router from '@/router'
import { store } from '@/stores'

/**
 * 安卓返回键逐层返回。返回 true 表示本次返回已被消费，不再继续向外传递。
 */
export type BackButtonHandler = () => boolean

interface RegisteredHandler {
  handler: BackButtonHandler
  priority: number
  order: number
}

const handlers: RegisteredHandler[] = []
let orderCounter = 0
let listenerInstalled = false
let lastExitPress = 0

/** 注册一层返回处理，返回取消注册函数。优先级越高越先执行，同级后注册的先执行。 */
export function registerBackHandler(handler: BackButtonHandler, priority = 0): () => void {
  const entry: RegisteredHandler = { handler, priority, order: orderCounter++ }
  handlers.push(entry)
  return () => {
    const index = handlers.indexOf(entry)
    if (index >= 0)
      handlers.splice(index, 1)
  }
}

/** 在组件挂载期间注册一层返回处理，卸载时自动取消。 */
export function useBackHandler(handler: BackButtonHandler, priority = 0) {
  let unregister: (() => void) | undefined
  onMounted(() => {
    unregister = registerBackHandler(handler, priority)
  })
  onBeforeUnmount(() => unregister?.())
}

function pressBackAgainToExit() {
  const now = Date.now()
  if (now - lastExitPress < 2000) {
    void App.exitApp()
    return
  }
  lastExitPress = now
  ElMessage.info(i18n.global.t('app.press_back_again_to_exit'))
}

function handleBackButton() {
  const ordered = [...handlers].sort((a, b) => (b.priority - a.priority) || (b.order - a.order))
  for (const entry of ordered) {
    if (entry.handler())
      return
  }
  const path = router.currentRoute.value.path
  // 上传页是返回链的终点，双击返回退出应用
  if (path === '/upload') {
    pressBackAgainToExit()
    return
  }
  if (path === '/') {
    if (store.getters.getUserConfigInfo.logined)
      void router.replace('/upload')
    else
      pressBackAgainToExit()
    return
  }
  const back = router.options.history.state.back
  if (typeof back === 'string' && back) {
    // 跳过登录页，返回链终点始终是上传页
    if (router.resolve(back).path === '/')
      void router.replace('/upload')
    else
      router.back()
  }
  else {
    void router.push('/upload')
  }
}

/** 在应用根组件调用一次，接管安卓返回键。网页端 backButton 事件不会触发，无影响。 */
export function useAndroidBackButton() {
  onMounted(() => {
    if (listenerInstalled)
      return
    listenerInstalled = true
    void App.addListener('backButton', handleBackButton)
  })
}
