import { ref } from 'vue'
import { LS_LAUNCH_PAGE } from '@/common/constant'
import { getLocal, setLocal } from '@/utils/storage'

/** 应用启动页（仅本机保存，不同步到云端；未设置时默认首页） */
export enum LaunchPageEnum {
  upload = '/upload',

  management = '/management',

  settings = '/settings',
}

function readLaunchPage(): LaunchPageEnum {
  const value: unknown = getLocal(LS_LAUNCH_PAGE)
  return typeof value === 'string' && (Object.values(LaunchPageEnum) as string[]).includes(value)
    ? (value as LaunchPageEnum)
    : LaunchPageEnum.upload
}

const launchPage = ref<LaunchPageEnum>(readLaunchPage())

export function getLaunchPage(): LaunchPageEnum {
  return launchPage.value
}

export function setLaunchPage(page: LaunchPageEnum): void {
  launchPage.value = page
  setLocal(LS_LAUNCH_PAGE, page)
}

export function useLaunchPage() {
  return launchPage
}
