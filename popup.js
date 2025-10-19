// DOM要素の取得
const toggleSwitch = document.getElementById('toggleSwitch');
const statusText = document.getElementById('statusText');
const modeAllAndMouse = document.getElementById('modeAllAndMouse');
const modeMouseOnly = document.getElementById('modeMouseOnly');

// 現在のタブを取得
let currentTab = null;

// タブの状態を取得
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// 拡張機能の状態を取得
async function getExtensionStatus() {
    // まずサイトごとの設定から状態を取得（フォールバック）
    try {
        const result = await chrome.storage.local.get(['siteSettings', 'displayMode']);
        const siteSettings = result.siteSettings || {};
        const currentUrl = currentTab.url;
        const siteKey = getSiteKey(currentUrl);
        const fallbackStatus = siteSettings[siteKey] || false;
        const fallbackMode = result.displayMode || 'all_and_mouse';

        // content scriptが読み込まれているかチェック
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getStatus' });
            return {
                enabled: response.enabled,
                mode: response.mode || fallbackMode
            };
        } catch (error) {
            console.log('content scriptが読み込まれていません。フォールバック設定を使用します。');
            return {
                enabled: fallbackStatus,
                mode: fallbackMode
            };
        }
    } catch (storageError) {
        console.error('ストレージ取得エラー:', storageError);
        return {
            enabled: false,
            mode: 'all_and_mouse'
        };
    }
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

// 拡張機能の状態を切り替え
async function toggleExtension(enabled) {
    // まずサイトごとの設定に保存
    try {
        await saveSiteSettings(enabled);
        updateUI(enabled);

        // content scriptが読み込まれているかチェック
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                action: 'toggleOverlay',
                enabled: enabled
            });

            if (response && response.success) {
                statusText.textContent = enabled ? 'オーバーレイ表示が有効です' : 'オーバーレイ表示が無効です';
                statusText.style.color = enabled ? '#4CAF50' : '#666';
            } else {
                statusText.textContent = '設定を保存しました。ページを再読み込みしてください。';
                statusText.style.color = '#ff9800';
            }
        } catch (error) {
            console.log('content scriptが読み込まれていません。設定のみ保存しました。');
            statusText.textContent = '設定を保存しました。ページを再読み込みしてください。';
            statusText.style.color = '#ff9800';
        }
    } catch (storageError) {
        console.error('ストレージ保存エラー:', storageError);
        statusText.textContent = 'エラー: 設定の保存に失敗しました';
        statusText.style.color = '#d32f2f';
    }
}

// サイトごとの設定を保存
async function saveSiteSettings(enabled) {
    const result = await chrome.storage.local.get(['siteSettings']);
    const siteSettings = result.siteSettings || {};
    const currentUrl = currentTab.url;
    const siteKey = getSiteKey(currentUrl);
    siteSettings[siteKey] = enabled;
    await chrome.storage.local.set({ siteSettings: siteSettings });
}

// UIの更新
function updateUI(enabled) {
    if (enabled) {
        toggleSwitch.classList.add('active');
    } else {
        toggleSwitch.classList.remove('active');
    }
}

// モードUIの更新
function updateModeUI(mode) {
    if (mode === 'all_and_mouse') {
        modeAllAndMouse.checked = true;
    } else if (mode === 'mouse_only') {
        modeMouseOnly.checked = true;
    }
}

// ステータステキストの更新
function updateStatusText(enabled) {
    // この関数は初期化時にのみ使用され、詳細なステータス表示はinitialize()で行う
    statusText.textContent = '読み込み中...';
    statusText.style.color = '#666';
}

// モード変更のイベントリスナー
modeAllAndMouse.addEventListener('change', async function () {
    if (this.checked) {
        await changeMode('all_and_mouse');
    }
});

modeMouseOnly.addEventListener('change', async function () {
    if (this.checked) {
        await changeMode('mouse_only');
    }
});

// モード変更
async function changeMode(mode) {
    try {
        const response = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'changeMode',
            mode: mode
        });

        if (response && response.success) {
            const modeText = mode === 'all_and_mouse' ? '全表示 + マウスオーバー' : 'マウスオーバーのみ';
            statusText.textContent = `モードを変更しました (${modeText})`;
            statusText.style.color = '#4CAF50';
        } else {
            statusText.textContent = 'モード変更に失敗しました';
            statusText.style.color = '#d32f2f';
        }
    } catch (error) {
        console.error('モード変更エラー:', error);
        statusText.textContent = 'エラー: ページを再読み込みしてください';
        statusText.style.color = '#d32f2f';
    }
}

// トグルスイッチのクリックイベント
toggleSwitch.addEventListener('click', async function () {
    const isCurrentlyActive = toggleSwitch.classList.contains('active');
    const newState = !isCurrentlyActive;

    await toggleExtension(newState);
});

// 初期化
async function initialize() {
    try {
        // 現在のタブを取得
        currentTab = await getCurrentTab();

        if (!currentTab) {
            statusText.textContent = 'タブが見つかりません';
            statusText.style.color = '#d32f2f';
            return;
        }

        // 拡張機能の状態を取得
        const status = await getExtensionStatus();

        // UIを更新
        updateUI(status.enabled);
        updateModeUI(status.mode);
        updateStatusText(status.enabled);

        // content scriptの状態をチェック
        try {
            await chrome.tabs.sendMessage(currentTab.id, { action: 'ping' });
            // content scriptが正常に動作している場合
            if (status.enabled) {
                const modeText = status.mode === 'all_and_mouse' ? '全表示 + マウスオーバー' : 'マウスオーバーのみ';
                statusText.textContent = `オーバーレイ表示が有効です (${modeText})`;
                statusText.style.color = '#4CAF50';
            } else {
                statusText.textContent = 'オーバーレイ表示が無効です';
                statusText.style.color = '#666';
            }
        } catch (error) {
            // content scriptが読み込まれていない場合
            if (status.enabled) {
                statusText.textContent = '設定は有効ですが、ページを再読み込みしてください';
                statusText.style.color = '#ff9800';
            } else {
                statusText.textContent = 'オーバーレイ表示が無効です';
                statusText.style.color = '#666';
            }
        }

    } catch (error) {
        console.error('初期化エラー:', error);
        statusText.textContent = 'エラー: ページを再読み込みしてください';
        statusText.style.color = '#d32f2f';
    }
}

// ページ読み込み完了後に初期化を実行
document.addEventListener('DOMContentLoaded', initialize);
