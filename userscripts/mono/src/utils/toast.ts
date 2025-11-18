export function toast(message, duration = 3000, type = "info") {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.id = "toast-container"
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
    `
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toast = document.createElement("div")
  toast.style.cssText = `
    background-color: #333;
    color: #fff;
    padding: 12px 20px;
    border-radius: 4px;
    margin-bottom: 10px;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    max-width: 300px;
  `

  // Set toast type
  switch (type) {
    case "success":
      toast.style.backgroundColor = "#4CAF50"
      break
    case "error":
      toast.style.backgroundColor = "#F44336"
      break
    case "warning":
      toast.style.backgroundColor = "#FFC107"
      toast.style.color = "#333"
      break
  }

  toast.textContent = message

  // Add toast to container
  toastContainer.appendChild(toast)

  // Trigger reflow to enable transition
  toast.offsetHeight

  // Show toast
  toast.style.opacity = "1"

  // Hide toast after duration
  setTimeout(() => {
    toast.style.opacity = "0"
    setTimeout(() => {
      toastContainer.removeChild(toast)
    }, 300)
  }, duration)
}