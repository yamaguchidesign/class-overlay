// オーバーレイ表示の状態管理
let isOverlayEnabled = false;
let overlayElements = new Map(); // 要素ごとのオーバーレイを管理

// オーバーレイ要素を作成する関数
function createOverlayElement(element) {
    const overlay = document.createElement('div');
    overlay.className = 'class-name-overlay';
    overlay.style.cssText = `
    position: absolute;
    background: rgba(255, 0, 0, 0.8);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 10px;
    font-weight: bold;
    pointer-events: none;
    z-index: 999999;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    border: 1px solid #ff0000;
    max-width: 200px;
    word-break: break-all;
    line-height: 1.2;
  `;

    return overlay;
}

// 要素のクラス名を取得する関数
function getElementClasses(element) {
    if (!element || !element.classList) {
        return 'クラスなし';
    }

    const classes = Array.from(element.classList);
    if (classes.length === 0) {
        return 'クラスなし';
    }

    return classes.join(' ');
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

// すべての要素にオーバーレイを表示する関数
function showAllOverlays() {
    if (!isOverlayEnabled) return;

    // 既存のオーバーレイをクリア
    clearAllOverlays();

    // ページ内のすべての要素を取得
    const allElements = document.querySelectorAll('*');

    allElements.forEach(element => {
        // 特定の要素をスキップ
        if (shouldSkipElement(element)) return;

        const classes = getElementClasses(element);
        if (classes === 'クラスなし') return; // クラスがない要素はスキップ

        const position = getElementPosition(element);

        // 要素が画面に表示されているかチェック
        if (position.width > 0 && position.height > 0) {
            const overlay = createOverlayElement(element);
            overlay.textContent = classes;

            // オーバーレイを要素の左上に配置
            overlay.style.left = position.left + 'px';
            overlay.style.top = position.top + 'px';

            document.body.appendChild(overlay);
            overlayElements.set(element, overlay);
        }
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

// 拡張機能の状態を初期化
function initializeExtension() {
    // ストレージから設定を読み込み
    chrome.storage.local.get(['overlayEnabled'], function (result) {
        isOverlayEnabled = result.overlayEnabled || false;

        if (isOverlayEnabled) {
            addEventListeners();
            showAllOverlays();
        }
    });
}

// メッセージリスナー（popupからの制御）
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'toggleOverlay') {
        isOverlayEnabled = request.enabled;

        if (isOverlayEnabled) {
            addEventListeners();
            showAllOverlays();
        } else {
            removeEventListeners();
        }

        // 設定を保存
        chrome.storage.local.set({ overlayEnabled: isOverlayEnabled });
        sendResponse({ success: true });
    }

    if (request.action === 'getStatus') {
        sendResponse({ enabled: isOverlayEnabled });
    }
});

// ページ読み込み完了後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}
