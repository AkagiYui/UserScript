// ==UserScript==
// @name         【Grafana】Gotify通知
// @version      0.1.0
// @description  在只能获取数据的情况下，使用Gotify进行通知
// @icon         https://grafana.com/media/menus/products/grafana-menu-icon.svg
// @match        http://*:3000/*
// @match        https://*:3000/*
// @match        http://*/grafana/*
// @match        https://*/grafana/*
// @match        *://grafana.*/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @namespace    https://github.com/AkagiYui/UserScript
// @supportURL   https://github.com/AkagiYui/UserScript/issues
// @homepage     https://github.com/AkagiYui
// @author       AkagiYui
// @license      MIT
// ==/UserScript==


(function () {
    'use strict'

    const GOTIFY_URL = 'https://gotify./message'
    const GOTIFY_CLIENT_TOKEN = ''

    // 检测是否为 Grafana 页面
    if (!document.title.includes('Grafana') &&
        !document.querySelector('[data-testid="grafana"]') &&
        !window.location.pathname.includes('grafana')) {
        return; // 不是 Grafana 页面，退出
    }

    const pageWindow = unsafeWindow

    // Your code here...
    console.log("zzzzz")
    //oldFetch保存了原fetch的引用
    let oldFetch = pageWindow.fetch;
    function hookFetch(url, options) {
        // fetch需要返回一个promise，所以这里我们new一个Promise返回，
        // 然后自行处理fetch的逻辑后resolve出去
        // console.log('url', url)

        return new Promise((resolve, reject) => {
            // 这里我们使用fetch的原函数，
            // 通过apply更改了this指针至自身，并且传入了参数
            // 我们劫持函数的时候，
            // 由劫持函数调用原函数的过程中一定要使用call/apply进行修改this指针，
            // 以符合原来的调用过程。
            // 在then中则是我们处理response的过程
            oldFetch.apply(this, arguments).then((response) => {
                // 这部分代码是针对某些特定的函数进行过滤，
                // 我们可以对网页进行分析以及调试，
                // 或去返回内容进行查看，来判断调用了哪些函数。
                // 这里以json为例进行劫持，注意，如果你的网页未使用json函数可能导致劫持失败
                // 首先保存了原json的引用
                const oldJson = response.json;
                // 修改json属性为一个劫持函数
                response.json = function () {
                    // 由于json返回的是一个promise对象，
                    // 所以我们这里也需要返回一个promise
                    return new Promise((resolve, reject) => {
                        // 在promise内依对其原json函数进行调用，
                        // 并修改了this指向以及参数
                        // 最后对其结果进行一定的修改，
                        // 然后通过resolve(result)进行返回 
                        oldJson.apply(this, arguments).then((result) => {
                            //result.hook = "success"; //对返回的数据进行修改



                            if (url === "api/ds/query") {
                                // console.log(options)

                                const body = JSON.parse(options.body)
                                const tableName = body['queries'][0]['itemTag']['filter'].split(" ")[1]
                                // console.log(tableName)

                                const values = result['results']['A']['frames'][0]['data']['values']
                                const [timestamps, bandwidths] = values
                                // console.log(timestamps, bandwidths)

                                const lastTimestamp = timestamps[timestamps.length - 1]
                                const lastBandwidth = bandwidths[bandwidths.length - 1]
                                const lastLastBandwidth = bandwidths[bandwidths.length - 2]

                                const lastBandwidthMbps = (lastBandwidth / 1000 / 1000)
                                const lastLastBandwidthMbps = (lastLastBandwidth / 1000 / 1000)

                                const diff = lastBandwidthMbps - lastLastBandwidthMbps
                                if (diff > 900) { // 900
                                    // 流量增加超过1Mbps
                                    console.log('流量突增', tableName, lastBandwidthMbps, diff)

                                    GM_xmlhttpRequest({
                                        method: "POST",
                                        url: GOTIFY_URL,
                                        headers: {
                                            'Authorization': `Bearer ${GOTIFY_CLIENT_TOKEN}`,
                                            'Content-Type': 'application/json'
                                        },
                                        data: JSON.stringify({
                                            title: `【Grafana】${tableName} 流量突增`,
                                            message: `当前流量 ${lastBandwidthMbps.toFixed(2)} Mbps, 增加了 ${diff.toFixed(2)} Mbps`,
                                            priority: 5
                                        }),
                                        onload: function (res) {
                                            console.log('gotify send', res)
                                        },
                                        onerror: function (err) {
                                            console.error('gotify error', err)
                                        }
                                    });
                                }

                                console.log(tableName, lastTimestamp, lastBandwidthMbps, lastLastBandwidthMbps)
                            }




                            resolve(result);
                        });
                    });
                };
                resolve(response);
            });
        });
    }
    // 对window.fetch挂载成我们的劫持函数hookFetch
    pageWindow.fetch = hookFetch;
})();
