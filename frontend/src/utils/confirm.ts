import { ElMessageBox } from 'element-plus'
import { msg } from './message'

interface ConfirmOptions {
  message: string
  title?: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'error' | 'success'
  successMessage?: string
  cancelMessage?: string | false
  errorMessage?: string
  onConfirm?: () => Promise<any> | any
}

/**
 * 统一确认对话封装
 */
export async function confirmAction(opts: ConfirmOptions) {
  const {
    message,
    title = '确认操作',
    confirmText = '确定',
    cancelText = '取消',
    type = 'warning',
    successMessage,
    cancelMessage = false,
    errorMessage = '操作失败，请稍后重试',
    onConfirm
  } = opts

  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      type
    })
    if (onConfirm) {
      await onConfirm()
    }
    if (successMessage) msg.success(successMessage)
    return true
  } catch (e: any) {
    if (e === 'cancel') {
      if (cancelMessage) msg.info(cancelMessage)
      return false
    }
    msg.error(e?.message || errorMessage)
    return false
  }
}
