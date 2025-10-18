// DOM要素の取得
const toggleSwitch = document.getElementById('toggleSwitch');
const statusText = document.getElementById('statusText');

// 現在のタブを取得
let currentTab = null;

// タブの状態を取得
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// 拡張機能の状態を取得
async function getExtensionStatus() {
    try {
        const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getStatus' });
        return response.enabled;
    } catch (error) {
        console.error('ステータス取得エラー:', error);
        return false;
    }
}

// 拡張機能の状態を切り替え
async function toggleExtension(enabled) {
    try {
        const response = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'toggleOverlay',
            enabled: enabled
        });

        if (response.success) {
            updateUI(enabled);
            updateStatusText(enabled);
        } else {
            console.error('切り替えに失敗しました');
        }
    } catch (error) {
        console.error('切り替えエラー:', error);
        statusText.textContent = 'エラー: ページを再読み込みしてください';
        statusText.style.color = '#d32f2f';
    }
}

// UIの更新
function updateUI(enabled) {
    if (enabled) {
        toggleSwitch.classList.add('active');
    } else {
        toggleSwitch.classList.remove('active');
    }
}

// ステータステキストの更新
function updateStatusText(enabled) {
    if (enabled) {
        statusText.textContent = 'オーバーレイ表示が有効です';
        statusText.style.color = '#4CAF50';
    } else {
        statusText.textContent = 'オーバーレイ表示が無効です';
        statusText.style.color = '#666';
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
        const isEnabled = await getExtensionStatus();

        // UIを更新
        updateUI(isEnabled);
        updateStatusText(isEnabled);

    } catch (error) {
        console.error('初期化エラー:', error);
        statusText.textContent = 'エラー: ページを再読み込みしてください';
        statusText.style.color = '#d32f2f';
    }
}

// ページ読み込み完了後に初期化を実行
document.addEventListener('DOMContentLoaded', initialize);
