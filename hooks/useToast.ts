'use client'

import * as React from 'react'

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type ToastActionElement = React.ReactElement

export type ToastState =
  | 'info'
  | 'warning'
  | 'error'
  | 'danger'
  | 'success'

export type ToastActionConvey =
  | 'danger'
  | 'warning'
  | 'success'
  | 'info'
  | 'none'

export type ToastAction = [
  buttonName: string,
  convey: ToastActionConvey,
  action: string
]

export type ToastProps = {
  open?: boolean

  state?: ToastState

  /*
   * Number of seconds before this toast dismisses itself. Zero means manual
   * dismissal only; null disables dismissal entirely.
   */
  dismissesOn?: number | null

  /*
   * Same name = same visual stack.
   */
  name: string

  icon?: React.ReactNode

  actions?: ToastAction[]

  className?: string

  onOpenChange?: (open: boolean) => void

  /*
   * Allows additional custom props if you need them.
   */
  [key: string]: unknown
}

export type ToasterToast = ToastProps & {
  id: string

  title?: React.ReactNode

  description?: React.ReactNode

  action?: ToastActionElement

}

/*
|--------------------------------------------------------------------------
| Config
|--------------------------------------------------------------------------
|
| Keep this identical to the exit duration in toast.tsx.
|
*/

export const TOAST_EXIT_DURATION = 400

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

interface State {
  toasts: ToasterToast[]
}

let memoryState: State = {
  toasts: [],
}

/*
|--------------------------------------------------------------------------
| IDs
|--------------------------------------------------------------------------
*/

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER

  return count.toString()
}

/*
|--------------------------------------------------------------------------
| Subscribers
|--------------------------------------------------------------------------
*/

const listeners = new Set<
  (state: State) => void
>()

function emit() {
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function setState(
  updater:
    | State
    | ((state: State) => State)
) {
  memoryState =
    typeof updater === 'function'
      ? updater(memoryState)
      : updater

  emit()
}

/*
|--------------------------------------------------------------------------
| Remove timers
|--------------------------------------------------------------------------
|
| A dismissed toast stays in memory for 400ms.
|
| During those 400ms:
|
| open = false
|
| toast.tsx sees that and slides it to the right.
|
| Only after the animation is complete do we actually remove it.
|
*/

const removeTimeouts = new Map<
  string,
  ReturnType<typeof setTimeout>
>()

function scheduleRemove(id: string) {
  if (removeTimeouts.has(id)) {
    return
  }

  const timeout = setTimeout(() => {
    removeTimeouts.delete(id)

    removeToast(id)
  }, TOAST_EXIT_DURATION)

  removeTimeouts.set(
    id,
    timeout
  )
}

/*
|--------------------------------------------------------------------------
| Internal actions
|--------------------------------------------------------------------------
*/

function addToast(
  toast: ToasterToast
) {
  setState((state) => ({
    ...state,

    /*
     * Newest toast always goes first.
     *
     * Therefore when grouped by name:
     *
     * group[0] = newest/front
     * group[1] = previous
     * group[2] = older
     */
    toasts: [
      toast,
      ...state.toasts,
    ],
  }))
}

function updateToast(
  id: string,
  update: Partial<ToasterToast>
) {
  setState((state) => ({
    ...state,

    toasts: state.toasts.map(
      (toast) =>
        toast.id === id
          ? {
              ...toast,
              ...update,

              /*
               * Never allow update to change ID.
               */
              id,
            }
          : toast
    ),
  }))
}

function dismissToast(
  id: string
) {
  const toast =
    memoryState.toasts.find(
      (toast) =>
        toast.id === id
    )

  if (!toast) {
    return
  }

  /*
   * Already exiting.
   */
  if (toast.open === false) {
    return
  }

  setState((state) => ({
    ...state,

    toasts: state.toasts.map(
      (item) =>
        item.id === id
          ? {
              ...item,
              open: false,
            }
          : item
    ),
  }))

  scheduleRemove(id)
}

function removeToast(
  id: string
) {
  const existingTimeout =
    removeTimeouts.get(id)

  if (existingTimeout) {
    clearTimeout(existingTimeout)

    removeTimeouts.delete(id)
  }

  setState((state) => ({
    ...state,

    toasts: state.toasts.filter(
      (toast) =>
        toast.id !== id
    ),
  }))
}

function dismissAll() {
  /*
   * Each name should dismiss as its own stack.
   */
  const names = Array.from(
    new Set(
      memoryState.toasts.map(
        (toast) =>
          toast.name
      )
    )
  )

  names.forEach((name) => {
    dismissByName(name)
  })
}

/*
|--------------------------------------------------------------------------
| Sequential stack dismissal
|--------------------------------------------------------------------------
|
| If:
|
| A
| B
| C
|
| exists in one name group:
|
| A exits
| wait 400ms
| B becomes front
| B exits
| wait 400ms
| C becomes front
| C exits
|
*/

function dismissByName(
  name: string
) {
  /*
   * Capture the stack as it exists right now.
   *
   * memoryState is newest-first.
   */
  const ids =
    memoryState.toasts
      .filter(
        (toast) =>
          toast.name === name &&
          toast.open !== false
      )
      .map(
        (toast) =>
          toast.id
      )

  if (ids.length === 0) {
    return
  }

  ids.forEach(
    (id, index) => {
      window.setTimeout(
        () => {
          dismissToast(id)
        },
        index *
          TOAST_EXIT_DURATION
      )
    }
  )
}

/*
|--------------------------------------------------------------------------
| Public toast()
|--------------------------------------------------------------------------
*/

export type ToastInput =
  Omit<
    ToasterToast,
    'id' | 'open'
  >

export type ToastUpdate =
  Partial<
    Omit<
      ToasterToast,
      'id'
    >
  >

export function toast(
  props: ToastInput
) {
  const id = genId()

  const toastItem: ToasterToast = {
    ...props,

    id,

    open: true,
  }

  addToast(toastItem)

  return {
    id,

    /*
     * Close this individual toast.
     */
    dismiss() {
      dismissToast(id)
    },

    /*
     * Update this toast.
     *
     * Example:
     *
     * const task = toast(...)
     *
     * task.update({
     *   title: 'Completed',
     *   state: 'success'
     * })
     */
    update(
      update: ToastUpdate
    ) {
      updateToast(
        id,
        update
      )
    },

    /*
     * Immediately remove without animation.
     *
     * Usually you don't need this.
     */
    remove() {
      removeToast(id)
    },
  }
}

/*
|--------------------------------------------------------------------------
| External store
|--------------------------------------------------------------------------
|
| useSyncExternalStore is a much cleaner fit here than repeatedly
| adding/removing useEffect listeners.
|
*/

function subscribe(
  listener: (state: State) => void
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return memoryState
}

function getServerSnapshot() {
  return memoryState
}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export function useToast() {
  const state =
    React.useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot
    )

  return {
    ...state,

    toast,

    /*
     * dismiss()
     *
     * no ID:
     * dismiss everything
     *
     * ID:
     * dismiss one
     */
    dismiss(
      toastId?: string
    ) {
      if (toastId) {
        dismissToast(toastId)

        return
      }

      dismissAll()
    },

    dismissByName,

    remove(
      toastId: string
    ) {
      removeToast(toastId)
    },

    update(
      toastId: string,
      update: ToastUpdate
    ) {
      updateToast(
        toastId,
        update
      )
    },
  }
}
