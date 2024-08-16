import { getCookie } from "@/utils/cookie"
import { fetchWithParams } from "@/utils/fetch"

export async function getCollectionPage(index: number, upId: number): Promise<CollectionPage | null> {
  const params: GetCollectionPageRequestParams = {
    pn: index,
    ps: 20,
    up_mid: upId,
    platform: "web",
  }

  try {
    const data = await fetchWithParams<BilibiliDataResponse<CollectionPage>>(
      "https://api.bilibili.com/x/v3/fav/folder/collected/list",
      params,
    )
    return data.data
  } catch (error) {
    return null
  }
}

export async function uncollectCollection(collectionId: number): Promise<boolean> {
  try {
    const data = await fetch("https://api.bilibili.com/x/v3/fav/season/unfav", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        season_id: collectionId.toString(),
        platform: "web",
        csrf: getCookie("bili_jct"),
      }),
      credentials: "include",
    })
    const json = await data.json()
    console.debug(json)

    return json.code === 0
  } catch (error) {
    return false
  }
}
