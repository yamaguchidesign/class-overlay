// オーバーレイ表示の状態管理
let isOverlayEnabled = false;
let overlayElements = new Map(); // 要素ごとのオーバーレイを管理
let overlayPositions = new Map(); // オーバーレイの位置情報を管理
let currentUrl = null; // 現在のURLを管理
let mouseOverlayElement = null; // マウスオーバー用のオーバーレイ要素
let isMouseOverlayVisible = false; // マウスオーバーオーバーレイの表示状態

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

// マウスオーバー用のオーバーレイ要素を作成する関数
function createMouseOverlayElement(element) {
    const overlay = document.createElement('div');
    overlay.className = 'mouse-overlay';
    
    // 要素の情報を取得
    const tagName = getElementTagName(element);
    const classes = getElementClasses(element);
    const id = getElementId(element);
    
    // 色分けされたHTMLを作成（既存と同じスタイリング）
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
    position: fixed;
    background: transparent;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 10px;
    pointer-events: none;
    z-index: 1000000;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    border: none;
    max-width: 200px;
    word-break: break-all;
    line-height: 1.2;
    display: none;
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

// 要素の親子関係を判定
function isParentChild(parentElement, childElement) {
    return parentElement.contains(childElement) && parentElement !== childElement;
}

// 要素の兄弟関係を判定
function areSiblings(element1, element2) {
    return element1.parentNode === element2.parentNode && element1 !== element2;
}

// 要素の階層レベルを取得
function getElementLevel(element) {
    let level = 0;
    let current = element.parentNode;
    while (current && current !== document.body) {
        level++;
        current = current.parentNode;
    }
    return level;
}

// オーバーレイの重なりを検出して最適な位置を選択
function findBestPosition(elementRect, overlayWidth, overlayHeight, currentElement) {
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
        let overlappingElement = null;

        for (const [existingElement, existingRect] of overlayPositions) {
            if (isOverlapping(overlayRect, existingRect)) {
                hasOverlap = true;
                overlappingElement = existingElement;
                break;
            }
        }

        if (!hasOverlap) {
            return { position, rect: overlayRect };
        }

        // 重なっている場合、親要素または兄要素を上に移動
        if (overlappingElement && currentElement) {
            const shouldMoveUp = shouldMoveElementUp(currentElement, overlappingElement);
            if (shouldMoveUp) {
                // 親要素または兄要素を上に24px移動
                moveElementUp(overlappingElement, 24);
                return { position, rect: overlayRect };
            }
        }
    }

    // 重ならない位置が見つからない場合は左上を返す
    return {
        position: OVERLAY_POSITIONS.TOP_LEFT,
        rect: calculateOverlayPosition(elementRect, OVERLAY_POSITIONS.TOP_LEFT, overlayWidth, overlayHeight)
    };
}

// 要素を上に移動すべきかどうかを判定
function shouldMoveElementUp(currentElement, overlappingElement) {
    // 親子関係の場合、親要素を移動
    if (isParentChild(overlappingElement, currentElement)) {
        return true;
    }

    // 兄弟関係の場合、兄要素を移動
    if (areSiblings(currentElement, overlappingElement)) {
        const currentLevel = getElementLevel(currentElement);
        const overlappingLevel = getElementLevel(overlappingElement);
        return overlappingLevel <= currentLevel;
    }

    // 階層レベルが低い（親に近い）要素を移動
    const currentLevel = getElementLevel(currentElement);
    const overlappingLevel = getElementLevel(overlappingElement);
    return overlappingLevel < currentLevel;
}

// 要素のオーバーレイを上に移動
function moveElementUp(element, offset) {
    const overlay = overlayElements.get(element);
    if (overlay) {
        const currentRect = overlayPositions.get(element);
        if (currentRect) {
            const newRect = {
                ...currentRect,
                top: currentRect.top - offset
            };

            // オーバーレイの位置を更新
            overlay.style.top = newRect.top + 'px';
            overlayPositions.set(element, newRect);
        }
    }
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
        const bestPosition = findBestPosition(position, overlayWidth, overlayHeight, element);

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

// マウスオーバー時のオーバーレイ表示
function showMouseOverlay(element, event) {
  if (!isOverlayEnabled || !mouseOverlayElement) return;
  
  // 要素の情報を更新
  const tagName = getElementTagName(element);
  const classes = getElementClasses(element);
  const id = getElementId(element);
  
  // 色分けされたHTMLを作成
  let htmlContent = '';
  
  if (tagName) {
    htmlContent += `<span style="background: rgba(33, 150, 243, 0.9); color: white; padding: 1px 4px; border-radius: 2px; font-weight: bold; margin-right: 2px;">${tagName}</span>`;
  }
  
  if (classes) {
    htmlContent += `<span style="background: rgba(34, 139, 34, 0.9); color: white; padding: 1px 4px; border-radius: 2px; margin-right: 2px;">${classes}</span>`;
  }
  
  if (id) {
    htmlContent += `<span style="background: rgba(156, 39, 176, 0.9); color: white; padding: 1px 4px; border-radius: 2px; font-style: italic;">${id}</span>`;
  }
  
  mouseOverlayElement.innerHTML = htmlContent;
  
  // マウス位置にオーバーレイを配置
  const x = event.clientX + 10;
  const y = event.clientY - 30;
  
  mouseOverlayElement.style.left = x + 'px';
  mouseOverlayElement.style.top = y + 'px';
  mouseOverlayElement.style.display = 'block';
  isMouseOverlayVisible = true;
}

// マウスオーバー時のオーバーレイ非表示
function hideMouseOverlay() {
  if (mouseOverlayElement) {
    mouseOverlayElement.style.display = 'none';
    isMouseOverlayVisible = false;
  }
}

// マウス移動時のオーバーレイ位置更新
function updateMouseOverlayPosition(event) {
  if (!isMouseOverlayVisible || !mouseOverlayElement) return;
  
  const x = event.clientX + 10;
  const y = event.clientY - 30;
  
  mouseOverlayElement.style.left = x + 'px';
  mouseOverlayElement.style.top = y + 'px';
}

// イベントリスナーを追加する関数
function addEventListeners() {
    // マウスオーバー用のオーバーレイ要素を作成
    if (!mouseOverlayElement) {
        mouseOverlayElement = createMouseOverlayElement(document.body);
        document.body.appendChild(mouseOverlayElement);
    }
    
    // マウスイベントリスナー
    document.addEventListener('mouseover', function(event) {
        if (!isOverlayEnabled) return;
        
        // オーバーレイ要素自体はスキップ
        if (event.target.classList.contains('class-name-overlay') || 
            event.target.classList.contains('mouse-overlay')) return;
        
        // 要素の情報を取得
        const tagName = getElementTagName(event.target);
        const classes = getElementClasses(event.target);
        const id = getElementId(event.target);
        
        // タグ名、クラス名、IDがすべてない要素はスキップ
        if (!tagName && !classes && !id) return;
        
        showMouseOverlay(event.target, event);
    });
    
    document.addEventListener('mouseout', function(event) {
        if (!isOverlayEnabled) return;
        hideMouseOverlay();
    });
    
    document.addEventListener('mousemove', function(event) {
        if (!isOverlayEnabled) return;
        updateMouseOverlayPosition(event);
    });
    
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
    
    // マウスオーバーオーバーレイを非表示
    hideMouseOverlay();
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
