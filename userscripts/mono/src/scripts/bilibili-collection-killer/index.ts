"use strict"

import { getCookie } from "@/utils/cookie"
import { useLogger } from "@/utils/logger"
import { getCollectionPage, uncollectCollection } from "./api"
import { toast } from "@/utils/toast"
import "./style.css"

const { log } = useLogger("bilibili-collection-killer")

// 创建模态框
function createModal() {
  const overlay = document.createElement("div")
  overlay.className = "background-overlay"
  document.body.appendChild(overlay)

  const modal = document.createElement("div")
  modal.className = "collections-window"

  const title = document.createElement("h2")
  title.textContent = "订阅合集列表"
  title.style.marginBottom = "10px"
  modal.appendChild(title)

  const resultDiv = document.createElement("div")
  resultDiv.id = "result"
  resultDiv.className = "collections-result"
  modal.appendChild(resultDiv)

  const paginatorDiv = document.createElement("div")
  paginatorDiv.id = "paginator"
  paginatorDiv.className = "collections-paginator"
  modal.appendChild(paginatorDiv)

  document.body.appendChild(modal)

  // 使用一个标志来跟踪模态框是否刚刚被创建
  let isJustCreated = true

  const closeModalHandler = function (event) {
    // 如果模态框刚刚被创建，不要关闭它
    if (isJustCreated) {
      isJustCreated = false
      return
    }

    if (!modal.contains(event.target)) {
      modal.style.opacity = "0"
      overlay.style.opacity = "0"
      setTimeout(() => {
        document.body.removeChild(modal)
        document.body.removeChild(overlay)
        overlay.removeEventListener("click", closeModalHandler)
      }, 300)
    }
  }

  // 立即添加事件监听器
  overlay.addEventListener("click", closeModalHandler)

  // 使用 requestAnimationFrame 来重置 isJustCreated 标志
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isJustCreated = false
    })
  })

  log("模态框已创建")
  loadData(1)
}

function addFloatingButton() {
  const button = document.createElement("button")
  button.textContent = "合集管理"
  button.className = "floating-button"
  button.onclick = createModal
  document.body.appendChild(button)
}

// 加载数据
async function loadData(page: number) {
  const mid: number = getCookie("DedeUserID")
  if (!mid) {
    log("未登录")
    return
  }
  log("用户ID", mid)
  const { count, list } = await getCollectionPage(page, mid)
  if (!list) {
    log("合集列表为空")
    return
  }

  renderTable(list)
  renderPaginator(count, page)
}

// 渲染表格
function renderTable(list: any[]) {
  // 列表<table>元素
  const table = document.createElement("table")
  table.id = "collections-table"
  table.style.width = "100%"
  table.style.borderCollapse = "collapse"

  // 表头<tr>元素
  const thead = document.createElement("thead")
  const theadTr = document.createElement("tr")

  // 表头<th>元素
  const ths = ["封面", "标题", "视频数", "创建时间", "UP主", "操作"]
  ths.forEach((text) => {
    const th = document.createElement("th")
    th.textContent = text
    th.style.padding = "4px"
    theadTr.appendChild(th)
  })
  thead.appendChild(theadTr)
  table.appendChild(thead)

  // 表格内容<tbody>元素
  const tbody = document.createElement("tbody")
  list.forEach((collection) => {
    const tr = document.createElement("tr")

    // 封面
    const coverTd = document.createElement("td")
    const coverImg = document.createElement("img")
    coverImg.src = collection.cover
    coverImg.alt = "封面"
    coverTd.appendChild(coverImg)
    tr.appendChild(coverTd)

    // 标题
    const titleTd = document.createElement("td")
    const a1 = document.createElement("a")
    if (collection.type === 11) {
      // 收藏夹
      a1.href = `https://space.bilibili.com/${collection.mid}/favlist?fid=${collection.id}&ftype=create`
    } else if (collection.type === 21) {
      // 合集
      a1.href = `https://space.bilibili.com/${collection.mid}/channel/collectiondetail?sid=${collection.id}`
    }
    a1.textContent = collection.title
    a1.target = "_blank"
    titleTd.appendChild(a1)
    tr.appendChild(titleTd)

    // 视频数
    const mediaCountTd = document.createElement("td")
    mediaCountTd.textContent = collection.media_count.toString()
    tr.appendChild(mediaCountTd)

    // 创建时间
    const mtimeTd = document.createElement("td")
    mtimeTd.textContent = new Date(collection.mtime * 1000).toLocaleString()
    tr.appendChild(mtimeTd)

    // UP主
    const upTd = document.createElement("td")
    const a = document.createElement("a")
    a.href = `https://space.bilibili.com/${collection.upper.mid}`
    a.textContent = collection.upper.name
    a.target = "_blank"
    upTd.appendChild(a)
    tr.appendChild(upTd)

    // 操作
    const operationTd = document.createElement("td")
    const deleteButton = document.createElement("div")
    deleteButton.textContent = "取消订阅"
    deleteButton.className = "delete-button"
    deleteButton.onclick = async () => {
      log("取消订阅", collection.id)
      const ok = await uncollectCollection(collection.id)
      if (ok) {
        toast("取消订阅成功", 3000, "success")
        // 加上删除线
        a1.style.textDecoration = "line-through"
      } else {
        toast("取消订阅失败", 3000, "error")
      }
    }
    operationTd.appendChild(deleteButton)
    tr.appendChild(operationTd)

    tbody.appendChild(tr)
  })
  table.appendChild(tbody)

  const resultDiv = document.getElementById("result")
  if (resultDiv) {
    resultDiv.innerHTML = ""
    resultDiv.appendChild(table)
  }
  log("合集列表已加载")
}

// 渲染分页器
function renderPaginator(totalCount: number, currentPage: number) {
  const pageSize = 20
  const totalPages = Math.ceil(totalCount / pageSize)

  const paginatorDiv = document.getElementById("paginator")
  if (!paginatorDiv) return

  paginatorDiv.innerHTML = ""

  const prevButton = document.createElement("button")
  prevButton.textContent = "上一页"
  prevButton.disabled = currentPage === 1
  prevButton.onclick = () => loadData(currentPage - 1)
  paginatorDiv.appendChild(prevButton)

  const pageInfo = document.createElement("span")
  pageInfo.textContent = `${currentPage} / ${totalPages}`
  paginatorDiv.appendChild(pageInfo)

  const nextButton = document.createElement("button")
  nextButton.textContent = "下一页"
  nextButton.disabled = currentPage === totalPages
  nextButton.onclick = () => {
    loadData(currentPage + 1)
    // 滚动到顶部
    const table = document.getElementById("collections-table")
    if (table) {
      table.scrollIntoView({ behavior: "smooth" })
    }
  }
  paginatorDiv.appendChild(nextButton)

  const style = document.createElement("button")
  style.textContent = "清除失效合集"
  let cleaning = false
  style.onclick = async () => {
    if (cleaning) {
      toast("正在清除失效合集，请耐心等待！", 6000, "warning")
      return
    }
    cleaning = true
    log("清除失效合集中")
    toast("清除失效合集中，请等待", 3000, "info")
    const needToBeRemoved = []
    let currentPage = 1
    let hasMore = true
    while (hasMore) {
      toast(`正在检查第${currentPage}页`, 3000, "info")
      const { count, list, has_more } = await getCollectionPage(currentPage, getCookie("DedeUserID"))
      hasMore = has_more
      list.forEach((collection) => {
        if (collection.state === 1) {
          toast(`发现失效合集：${collection.id}`, 1500, "info")
          needToBeRemoved.push(collection.id)
        }
      })
      currentPage++
      // 防止请求过快
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    if (needToBeRemoved.length === 0) {
      cleaning = false
      toast("没有失效合集", 6000, "success")
      return
    }
    toast(`共发现${needToBeRemoved.length}个失效合集`, 10000, "success")
    // 逐个取消订阅，防止请求过快
    for (const id of needToBeRemoved) {
      toast(`正在取消订阅：${id}`, 1500, "info")
      await uncollectCollection(id)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    cleaning = false
    toast("清除失效合集完成", 6000, "success")
  }
  paginatorDiv.appendChild(style)
}

log("脚本已加载")

// 在页面加载完成后添加悬浮按钮
if (document.readyState === "complete" || document.readyState === "interactive") {
  addFloatingButton()
} else {
  addEventListener("DOMContentLoaded", addFloatingButton)
}
