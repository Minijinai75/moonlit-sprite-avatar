const MODULE_NAME = 'moonlit-sprite-avatar';

// 使用注入 CSS 的方式，這是最無敵的，因為即使 Cocktail 或 Moonlit 覆寫了 DOM 結構，
// 瀏覽器原生的 CSS !important 依然會強勢蓋過它們的設定！
function injectSpriteCSS(characterName, spriteUrl) {
    if (!characterName || !spriteUrl) return;

    // 注意：不要使用 CSS.escape，因為這會把中文在屬性選擇器中變為錯誤格式。只需替換雙引號即可。
    const safeName = characterName.replace(/"/g, '\\"');

    const styleId = 'moonlit-sprite-styles-' + characterName.replace(/\W/g, '_');
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }

    // 針對所有可能的佈局模式（Echo/Whisper/Ripple/Tide）以及桌機/手機版，全面覆蓋
    const sel = `.mes[is_user="false"][ch_name="${safeName}"]`;

    styleEl.textContent = `
        /* === 核心：覆寫 CSS 變數 === */
        ${sel} {
            --mes-avatar-url: url('${spriteUrl}') !important;
            --mes-avatar-original-url: url('${spriteUrl}') !important;
            --mes-avatar-thumb-url: url('${spriteUrl}') !important;
        }

        /* === Ripple / Tide 模式：覆寫 .avatar img === */
        ${sel} .avatar img {
            content: url('${spriteUrl}') !important;
            object-fit: cover !important;
            object-position: top center !important;
        }

        /* === Ripple / Tide 模式：覆寫 .avatar 背景 === */
        ${sel} .avatar {
            background-image: url('${spriteUrl}') !important;
            background-size: cover !important;
            background-position: top center !important;
        }

        /* === Echo / Whisper 模式：覆寫偽元素背景 === */
        ${sel} .mes_text::before {
            background: url('${spriteUrl}') center no-repeat !important;
            background-size: cover !important;
            background-attachment: fixed !important;
        }

        /* === 備用：覆寫 .mes_block 上的偽元素 === */
        ${sel} .mes_block::before {
            background-image: url('${spriteUrl}') !important;
            background-size: cover !important;
        }

        /* === 備用：直接 mes 層級偽元素 === */
        ${sel}::before {
            background-image: url('${spriteUrl}') !important;
        }
    `;

    console.log('[' + MODULE_NAME + '] Injected CSS for: ' + characterName + ' -> ' + spriteUrl.substring(spriteUrl.lastIndexOf('/') + 1));
}

function updateAvatars() {
    const expressionImage = document.getElementById('expression-image');
    if (!expressionImage) return;

    const currentSpriteSrc = expressionImage.getAttribute('src');
    if (!currentSpriteSrc) return;

    // 取得最新一則對話的角色名稱，因為通常立繪改變是因為該角色剛發送/更新了訊息
    const messages = document.querySelectorAll('.mes[is_user="false"]');
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const characterName = lastMessage.getAttribute('ch_name');

    if (characterName) {
        injectSpriteCSS(characterName, currentSpriteSrc);
    }
}

jQuery(function () {
    console.log('[' + MODULE_NAME + '] Extension loaded. Using Invincible CSS Injection.');

    // 讀取設定，預設為開啟
    let isEnabled = localStorage.getItem('moonlit_sprite_enable') !== 'false';

    // 初始化 UI 開關狀態
    const initUI = setInterval(function() {
        const checkbox = document.getElementById('moonlit_sprite_enable');
        if (checkbox && !checkbox.hasAttribute('data-initialized')) {
            checkbox.checked = isEnabled;
            checkbox.setAttribute('data-initialized', 'true');
            clearInterval(initUI);
        }
    }, 1000);

    // 監聽開關切換
    jQuery(document).on('change', '#moonlit_sprite_enable', function() {
        isEnabled = jQuery(this).is(':checked');
        localStorage.setItem('moonlit_sprite_enable', isEnabled);

        if (isEnabled) {
            updateAvatars();
        } else {
            // 關閉時，清除所有注入的 CSS 標籤
            document.querySelectorAll('style[id^="moonlit-sprite-styles-"]').forEach(function(el) { el.remove(); });
        }
    });

    // 監聽立繪圖片變化
    const observer = new MutationObserver(function(mutations) {
        if (!isEnabled) return;

        for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].type === 'attributes' && mutations[i].attributeName === 'src') {
                updateAvatars();
                break;
            }
        }
    });

    // 同時也監聽整個聊天區域的 DOM 變化（應對 Cocktail 重新渲染）
    const chatObserver = new MutationObserver(function() {
        if (!isEnabled) return;
        updateAvatars();
    });

    var expressionFound = false;
    var chatObserverStarted = false;

    const checkExist = setInterval(function() {
        // 監聽立繪圖片
        if (!expressionFound) {
            const expressionImage = document.getElementById('expression-image');
            if (expressionImage) {
                observer.observe(expressionImage, { attributes: true });
                expressionFound = true;

                // 找到立繪圖片後，不用等它改變，馬上直接執行一次替換！
                if (isEnabled) {
                    setTimeout(updateAvatars, 100);
                }
            }
        }

        // 監聽聊天容器的 DOM 改變（Cocktail 會頻繁重建 DOM）
        if (!chatObserverStarted) {
            const chatContainer = document.getElementById('chat');
            if (chatContainer) {
                chatObserver.observe(chatContainer, { childList: true, subtree: true });
                chatObserverStarted = true;
            }
        }

        // 兩個都找到就停
        if (expressionFound && chatObserverStarted) {
            clearInterval(checkExist);
        }
    }, 1000);

});
