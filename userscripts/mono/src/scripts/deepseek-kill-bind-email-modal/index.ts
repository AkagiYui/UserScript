"use strict"

import { useLogger } from "@/utils/logger"

const { log, warn } = useLogger("deepseek-kill-bind-email-modal")

const CONFIG = {
    clickRemindMeLater: true,
    delayMs: 100,
    retryIntervalMs: 500,
    maxRetries: 10,
} as const

interface ModalElements {
    content: Element | null
    wrapper: Element | null
    overlay: Element | null
}

function findModal(): ModalElements | null {
    // 方式1: 通过标题文字查找
    const titleEl = document.querySelector(".ds-modal-content__title")
    if (titleEl && titleEl.textContent?.trim() === "绑定邮箱") {
        const modalContent = titleEl.closest(".ds-modal-content")
        if (modalContent) {
            return {
                content: modalContent,
                wrapper: modalContent.closest(".ds-modal-wrapper"),
                overlay: document.querySelector(".ds-modal-overlay"),
            }
        }
    }

    // 方式2: 通过对话框角色查找
    const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]')
    for (let i = 0; i < dialogs.length; i++) {
        const dialog = dialogs[i]
        if (dialog.textContent?.includes("绑定邮箱")) {
            return {
                content: dialog,
                wrapper: dialog.closest(".ds-modal-wrapper"),
                overlay: document.querySelector(".ds-modal-overlay"),
            }
        }
    }

    // 方式3: 通过"稍后再填"按钮查找
    const laterBtn = findLaterButton()
    if (laterBtn) {
        const modalContent = laterBtn.closest(".ds-modal-content")
        if (modalContent) {
            return {
                content: modalContent,
                wrapper: modalContent.closest(".ds-modal-wrapper"),
                overlay: document.querySelector(".ds-modal-overlay"),
            }
        }
    }

    return null
}

function findLaterButton(): HTMLButtonElement | null {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".ds-button")
    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i]
        if (btn.textContent?.trim() === "稍后再填") {
            return btn
        }
    }
    return null
}

function dismissModal(): boolean {
    const modal = findModal()
    if (!modal) {
        log("未检测到绑定邮箱弹窗")
        return false
    }

    log("检测到绑定邮箱弹窗，正在关闭...")

    if (CONFIG.clickRemindMeLater) {
        const laterBtn = findLaterButton()
        if (laterBtn) {
            laterBtn.click()
            log("已点击「稍后再填」按钮")
            return true
        }
        warn("未找到「稍后再填」按钮，尝试直接移除弹窗")
    }

    if (modal.wrapper) {
        modal.wrapper.remove()
    }
    if (modal.overlay) {
        modal.overlay.remove()
    }
    log("已移除绑定邮箱弹窗DOM")
    return true
}

let retryCount = 0

function tryDismissWithRetry() {
    if (retryCount >= CONFIG.maxRetries) {
        warn("已达到最大重试次数，停止尝试")
        return
    }

    const dismissed = dismissModal()
    if (!dismissed) {
        retryCount++
        log(`第 ${retryCount} 次未检测到弹窗，${retryCount < CONFIG.maxRetries ? "继续监听..." : "停止"}`)
        if (retryCount < CONFIG.maxRetries) {
            setTimeout(tryDismissWithRetry, CONFIG.retryIntervalMs)
        }
    } else {
        retryCount = 0
    }
}

function setupMutationObserver() {
    const observer = new MutationObserver(() => {
        setTimeout(tryDismissWithRetry, CONFIG.delayMs)
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    })

    log("MutationObserver 已启动，正在监听弹窗...")
}

function init() {
    log("脚本已启动，目标: platform.deepseek.com")

    // 页面加载后立即尝试一次
    setTimeout(tryDismissWithRetry, CONFIG.delayMs)

    // 页面完全加载后再试一次
    window.addEventListener("load", () => {
        setTimeout(tryDismissWithRetry, CONFIG.delayMs + 200)
    })

    // 持续监听 DOM 变化
    if (document.body) {
        setupMutationObserver()
    } else {
        document.addEventListener("DOMContentLoaded", setupMutationObserver)
    }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    init()
} else {
    document.addEventListener("DOMContentLoaded", init)
}
