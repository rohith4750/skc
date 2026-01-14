const GLOBAL_LOADER_START = 'global-loader:start'
const GLOBAL_LOADER_STOP = 'global-loader:stop'

export const emitGlobalLoaderStart = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(GLOBAL_LOADER_START))
}

export const emitGlobalLoaderStop = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(GLOBAL_LOADER_STOP))
}

export const getGlobalLoaderEventNames = () => ({
  start: GLOBAL_LOADER_START,
  stop: GLOBAL_LOADER_STOP,
})
