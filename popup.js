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
        // content scriptが読み込まれているかチェック
        const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getStatus' });
        return response.enabled;
    } catch (error) {
        console.error('ステータス取得エラー:', error);
        // content scriptが読み込まれていない場合は、ストレージから状態を取得
        try {
            const result = await chrome.storage.local.get(['overlayEnabled']);
            return result.overlayEnabled || false;
        } catch (storageError) {
            console.error('ストレージ取得エラー:', storageError);
            return false;
        }
    }
}

// 拡張機能の状態を切り替え
async function toggleExtension(enabled) {
    try {
        // content scriptにメッセージを送信
        const response = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'toggleOverlay',
            enabled: enabled
        });

        if (response && response.success) {
            updateUI(enabled);
            updateStatusText(enabled);
        } else {
            console.error('切り替えに失敗しました');
            // フォールバック: ストレージに保存してページを再読み込み
            await chrome.storage.local.set({ overlayEnabled: enabled });
            updateUI(enabled);
            updateStatusText(enabled);
            statusText.textContent = '設定を保存しました。ページを再読み込みしてください。';
            statusText.style.color = '#ff9800';
        }
    } catch (error) {
        console.error('切り替えエラー:', error);
        // フォールバック: ストレージに保存
        try {
            await chrome.storage.local.set({ overlayEnabled: enabled });
            updateUI(enabled);
            updateStatusText(enabled);
            statusText.textContent = '設定を保存しました。ページを再読み込みしてください。';
            statusText.style.color = '#ff9800';
        } catch (storageError) {
            console.error('ストレージ保存エラー:', storageError);
            statusText.textContent = 'エラー: ページを再読み込みしてください';
            statusText.style.color = '#d32f2f';
        }
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

        // content scriptが読み込まれていない場合の警告
        if (isEnabled) {
            try {
                await chrome.tabs.sendMessage(currentTab.id, { action: 'ping' });
            } catch (error) {
                statusText.textContent = '設定は有効ですが、ページを再読み込みしてください';
                statusText.style.color = '#ff9800';
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
