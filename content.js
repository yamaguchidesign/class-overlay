// オーバーレイ表示の状態管理
let isOverlayEnabled = false;
let overlayElements = new Map(); // 要素ごとのオーバーレイを管理
let overlayPositions = new Map(); // オーバーレイの位置情報を管理
let currentUrl = null; // 現在のURLを管理

// オーバーレイ要素を作成する関数
function createOverlayElement(element) {
    const overlay = document.createElement('div');
    overlay.className = 'class-name-overlay';

    // 要素の情報を取得
    const tagName = getElementTagName(element);
    const classes = getElementClasses(element);
    const id = getElementId(element);

    // 色分けされたHTMLを作成
    let htmlContent = '';

    // タグ名（青背景、白文字、太字）
    if (tagName) {
        htmlContent += `<span style="background: rgba(33, 150, 243, 0.9); color: white; padding: 1px 4px; border-radius: 2px; font-weight: bold; margin-right: 2px;">${tagName}</span>`;
    }

    // クラス名（緑背景、白文字、通常）
    if (classes) {
        htmlContent += `<span style="background: rgba(34, 139, 34, 0.9); color: white; padding: 1px 4px; border-radius: 2px; margin-right: 2px;">${classes}</span>`;
    }

    // ID（紫背景、白文字、イタリック）
    if (id) {
        htmlContent += `<span style="background: rgba(156, 39, 176, 0.9); color: white; padding: 1px 4px; border-radius: 2px; font-style: italic;">${id}</span>`;
    }

    overlay.innerHTML = htmlContent;

    overlay.style.cssText = `
    position: absolute;
    background: transparent;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 10px;
    pointer-events: none;
    z-index: 999999;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    border: none;
    max-width: 200px;
    word-break: break-all;
    line-height: 1.2;
  `;

    return overlay;
}

// 要素のクラス名を取得する関数
function getElementClasses(element) {
    if (!element || !element.classList) {
        return '';
    }

    const classes = Array.from(element.classList);
    if (classes.length === 0) {
        return '';
    }

    return classes.map(cls => '.' + cls).join(' ');
}

// 要素のIDを取得する関数
function getElementId(element) {
    if (!element || !element.id) {
        return '';
    }

    return '#' + element.id;
}

// 要素のタグ名を取得する関数
function getElementTagName(element) {
    if (!element || !element.tagName) {
        return '';
    }

    return element.tagName.toLowerCase();
}

// 要素の完全な情報を取得する関数
function getElementInfo(element) {
    const tagName = getElementTagName(element);
    const classes = getElementClasses(element);
    const id = getElementId(element);

    // タグ.クラス名.IDの形式で結合
    let info = tagName;
    if (classes) {
        info += classes;
    }
    if (id) {
        info += id;
    }

    return info;
}

// 要素の位置とサイズを取得する関数
function getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    return {
        left: rect.left + scrollX,
        top: rect.top + scrollY,
        width: rect.width,
        height: rect.height
    };
}

// オーバーレイの可能な位置を定義
const OVERLAY_POSITIONS = {
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right',
    CENTER: 'center'
};

// 位置に応じたオーバーレイの座標を計算
function calculateOverlayPosition(elementRect, position, overlayWidth, overlayHeight) {
    const margin = 2; // 要素からのマージン

    switch (position) {
        case OVERLAY_POSITIONS.TOP_LEFT:
            return {
                left: elementRect.left + margin,
                top: elementRect.top + margin
            };
        case OVERLAY_POSITIONS.TOP_RIGHT:
            return {
                left: elementRect.left + elementRect.width - overlayWidth - margin,
                top: elementRect.top + margin
            };
        case OVERLAY_POSITIONS.BOTTOM_LEFT:
            return {
                left: elementRect.left + margin,
                top: elementRect.top + elementRect.height - overlayHeight - margin
            };
        case OVERLAY_POSITIONS.BOTTOM_RIGHT:
            return {
                left: elementRect.left + elementRect.width - overlayWidth - margin,
                top: elementRect.top + elementRect.height - overlayHeight - margin
            };
        case OVERLAY_POSITIONS.CENTER:
            return {
                left: elementRect.left + (elementRect.width - overlayWidth) / 2,
                top: elementRect.top + (elementRect.height - overlayHeight) / 2
            };
        default:
            return {
                left: elementRect.left + margin,
                top: elementRect.top + margin
            };
    }
}

// 2つの矩形が重なっているかチェック
function isOverlapping(rect1, rect2) {
    return !(rect1.left + rect1.width < rect2.left ||
        rect2.left + rect2.width < rect1.left ||
        rect1.top + rect1.height < rect2.top ||
        rect2.top + rect2.height < rect1.top);
}

// オーバーレイの重なりを検出して最適な位置を選択
function findBestPosition(elementRect, overlayWidth, overlayHeight) {
    const positions = Object.values(OVERLAY_POSITIONS);

    for (const position of positions) {
        const overlayRect = calculateOverlayPosition(elementRect, position, overlayWidth, overlayHeight);

        // 画面外に出ないかチェック
        if (overlayRect.left < 0 || overlayRect.top < 0 ||
            overlayRect.left + overlayWidth > window.innerWidth ||
            overlayRect.top + overlayHeight > window.innerHeight) {
            continue;
        }

        // 既存のオーバーレイとの重なりをチェック
        let hasOverlap = false;
        for (const [_, existingRect] of overlayPositions) {
            if (isOverlapping(overlayRect, existingRect)) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            return { position, rect: overlayRect };
        }
    }

    // 重ならない位置が見つからない場合は左上を返す
    return {
        position: OVERLAY_POSITIONS.TOP_LEFT,
        rect: calculateOverlayPosition(elementRect, OVERLAY_POSITIONS.TOP_LEFT, overlayWidth, overlayHeight)
    };
}

// すべての要素にオーバーレイを表示する関数
function showAllOverlays() {
    if (!isOverlayEnabled) return;

    // 既存のオーバーレイをクリア
    clearAllOverlays();

    // ページ内のすべての要素を取得
    const allElements = document.querySelectorAll('*');

    // 要素をサイズ順にソート（大きい要素から処理）
    const sortedElements = Array.from(allElements)
        .filter(element => !shouldSkipElement(element))
        .map(element => ({
            element,
            info: getElementInfo(element),
            position: getElementPosition(element)
        }))
        .filter(item => item.info && item.position.width > 0 && item.position.height > 0)
        .sort((a, b) => (b.position.width * b.position.height) - (a.position.width * a.position.height));

    sortedElements.forEach(item => {
        const { element, info, position } = item;

        // オーバーレイ要素を作成（一時的にDOMに追加してサイズを取得）
        const overlay = createOverlayElement(element);
        overlay.style.visibility = 'hidden'; // 一時的に非表示
        document.body.appendChild(overlay);

        // オーバーレイのサイズを取得
        const overlayRect = overlay.getBoundingClientRect();
        const overlayWidth = overlayRect.width;
        const overlayHeight = overlayRect.height;

        // 最適な位置を検索
        const bestPosition = findBestPosition(position, overlayWidth, overlayHeight);

        // オーバーレイを最適な位置に配置
        overlay.style.left = bestPosition.rect.left + 'px';
        overlay.style.top = bestPosition.rect.top + 'px';
        overlay.style.visibility = 'visible'; // 表示

        // 位置情報を保存
        overlayPositions.set(element, {
            left: bestPosition.rect.left,
            top: bestPosition.rect.top,
            width: overlayWidth,
            height: overlayHeight
        });

        overlayElements.set(element, overlay);
    });
}

// スキップすべき要素かどうかを判定
function shouldSkipElement(element) {
    // オーバーレイ要素自体はスキップ
    if (element.classList.contains('class-name-overlay')) return true;

    // 非表示要素はスキップ
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return true;

    // サイズが極小の要素はスキップ
    const rect = element.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return true;

    // タグ名、クラス名、IDがすべてない要素はスキップ
    const info = getElementInfo(element);
    if (!info || info.trim() === '') return true;

    return false;
}

// すべてのオーバーレイをクリアする関数
function clearAllOverlays() {
    overlayElements.forEach(overlay => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    });
    overlayElements.clear();
    overlayPositions.clear();
}

// イベントリスナーを追加する関数
function addEventListeners() {
    // スクロール時にオーバーレイを更新
    window.addEventListener('scroll', function () {
        if (isOverlayEnabled) {
            showAllOverlays();
        }
    });

    // ウィンドウリサイズ時にオーバーレイを更新
    window.addEventListener('resize', function () {
        if (isOverlayEnabled) {
            showAllOverlays();
        }
    });

    // DOM変更を監視してオーバーレイを更新
    const observer = new MutationObserver(function (mutations) {
        if (isOverlayEnabled) {
            // 少し遅延させてから更新（パフォーマンス向上）
            setTimeout(showAllOverlays, 100);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
}

// イベントリスナーを削除する関数
function removeEventListeners() {
    // 既存のオーバーレイをクリア
    clearAllOverlays();
}

// 現在のURLを取得
function getCurrentUrl() {
    return window.location.href;
}

// サイトごとの設定キーを生成
function getSiteKey(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.origin; // プロトコル + ドメイン + ポート
    } catch (error) {
        return url; // URL解析に失敗した場合は元のURLを使用
    }
}

// サイトごとの設定を取得
function getSiteSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['siteSettings'], function (result) {
            resolve(result.siteSettings || {});
        });
    });
}

// サイトごとの設定を保存
function setSiteSettings(siteSettings) {
    chrome.storage.local.set({ siteSettings: siteSettings });
}

// 拡張機能の状態を初期化
async function initializeExtension() {
    currentUrl = getCurrentUrl();
    const siteKey = getSiteKey(currentUrl);

    // サイトごとの設定を取得
    const siteSettings = await getSiteSettings();
    isOverlayEnabled = siteSettings[siteKey] || false;

    if (isOverlayEnabled) {
        addEventListeners();
        showAllOverlays();
    }
}

// メッセージリスナー（popupからの制御）
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.action === 'toggleOverlay') {
        isOverlayEnabled = request.enabled;
        currentUrl = getCurrentUrl();
        const siteKey = getSiteKey(currentUrl);

        if (isOverlayEnabled) {
            addEventListeners();
            showAllOverlays();
        } else {
            removeEventListeners();
        }

        // サイトごとの設定を保存
        const siteSettings = await getSiteSettings();
        siteSettings[siteKey] = isOverlayEnabled;
        setSiteSettings(siteSettings);

        sendResponse({ success: true });
    }

    if (request.action === 'getStatus') {
        sendResponse({ enabled: isOverlayEnabled });
    }

    if (request.action === 'ping') {
        sendResponse({ pong: true });
    }
});

// ページ読み込み完了後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}
