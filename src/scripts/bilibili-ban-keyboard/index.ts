"use strict"
import { useBooleanMenu } from "@/utils/menu"
import { useLogger } from "@/utils/logger"

const { log } = useLogger("bilibili-ban-keyboard")

// 目标按键
const keysInfo: KeyInfo[] = [
  { name: "q", description: "点赞" },
  { name: "w", description: "投币" },
  { name: "e", description: "收藏" },
  { name: "d", description: "关闭弹幕" },
  { name: "f", description: "全屏" },
  { name: "m", description: "静音" },
  { name: "[", description: "上一集" },
  { name: "]", description: "下一集" },
  { name: "ArrowLeft", description: "后退", title: "←" },
  { name: "ArrowRight", description: "前进", title: "→" },
]

const config: BooleanConfigs = {}
keysInfo.forEach((value) => {
  const configKey = `block${value.name}`
  const title = `禁用按键 ${value.title || value.name.toUpperCase()} - ${value.description}`
  config[configKey] = { title, defaultValue: false }
})
const { getConfig } = useBooleanMenu(config)

// 读取配置，是否阻止特定按键
const keysConfig: { [key: string]: boolean } = {}
keysInfo.forEach((key) => {
  keysConfig[key.name] = GM_getValue(`block${key.name.toUpperCase()}`, false)
})

// 阻止特定按键的函数
function preventCertainKeys(e: { key: string; stopPropagation: () => void; preventDefault: () => void }) {
  if (getConfig(`block${e.key}`)) {
    log("阻止按键", e.key)
    e.stopPropagation()
    e.preventDefault()
  }
}

document.addEventListener("keydown", preventCertainKeys)
