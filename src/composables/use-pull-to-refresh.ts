import { computed, onMounted, onUnmounted, ref } from 'vue'

export type PullToRefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing'

const RESISTANCE = 0.5
const MAX_PULL = 120

/**
 * 下拉刷新：页面位于顶部时下拉超过阈值后松手触发刷新。
 * 仅在触摸设备上生效，刷新期间忽略新的下拉手势。
 */
export function usePullToRefresh(options: {
  enabled: () => boolean
  onRefresh: () => Promise<void>
  threshold?: number
}) {
  const threshold = options.threshold ?? 64
  const pullDistance = ref(0)
  const state = ref<PullToRefreshState>('idle')
  const rotation = computed(() => Math.min(pullDistance.value * 2.5, 180))
  let startY = 0
  let pulling = false

  function reset() {
    pulling = false
    pullDistance.value = 0
    state.value = 'idle'
  }

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, .el-dialog, .el-image-viewer, .el-dropdown-menu, .el-message-box, .el-popover'))
  }

  function onTouchStart(event: TouchEvent) {
    if (state.value === 'refreshing' || !options.enabled() || isInteractiveTarget(event.target))
      return
    const touch = event.touches[0]
    if (!touch)
      return
    startY = touch.clientY
    pulling = false
  }

  function onTouchMove(event: TouchEvent) {
    if (state.value === 'refreshing' || !options.enabled())
      return
    const touch = event.touches[0]
    if (!touch || window.scrollY > 0)
      return
    const deltaY = touch.clientY - startY
    if (deltaY <= 0) {
      if (pulling)
        reset()
      return
    }
    event.preventDefault()
    pulling = true
    const distance = Math.min(deltaY * RESISTANCE, MAX_PULL)
    pullDistance.value = distance
    state.value = distance >= threshold ? 'ready' : 'pulling'
  }

  async function onTouchEnd() {
    if (!pulling)
      return
    if (state.value !== 'ready') {
      reset()
      return
    }
    state.value = 'refreshing'
    pullDistance.value = threshold
    try {
      await options.onRefresh()
    }
    finally {
      reset()
    }
  }

  function onTouchCancel() {
    if (state.value !== 'refreshing')
      reset()
  }

  onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchCancel)
  })

  return { pullDistance, pullState: state, pullRotation: rotation }
}
