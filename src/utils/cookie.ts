export const getCookie = (function () {
  const cache = {}

  function parseAllCookies() {
    const cookies = {}
    document.cookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=")
      cookies[name] = value
    })
    return cookies
  }

  return function (name) {
    if (cache[name] === undefined) {
      const cookies = parseAllCookies()
      cache[name] = cookies[name] || null
    }
    return cache[name]
  }
})()
