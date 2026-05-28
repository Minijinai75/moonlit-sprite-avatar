const MODULE_NAME = 'moonlit-sprite-avatar';

// 使用注入 CSS 的方式，這是最無敵的，因為即使 Cocktail 或 Moonlit 覆寫了 DOM 結構，
// 瀏覽器原生的 CSS !important 依然會強勢蓋過它們的設定！
function injectSpriteCSS(characterName, spriteUrl) {
    if (!characterName || !spriteUrl) return;

    // 注意：不要使用 CSS.escape，因為這會把中文在屬性選擇器中變為錯誤格式。只需替換雙引號即可。
    const safeName = characterName.replace(/"/g, '\\"');

    const styleId = `moonlit-sprite-styles-${safeName.replace(/\W/g, '')}`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
        /* 覆寫 Ripple 主題依賴的 CSS 變數 */
        .mes[is_user="false"][ch_name="${safeName}"] {
            --mes-avatar-url: url('${spriteUrl}') !important;
            --mes-avatar-original-url: url('${spriteUrl}') !important;
            --mes-avatar-thumb-url: url('${spriteUrl}') !important;
        }
        
        /* 1. 直接覆寫圖片元素 (防禦常規酒館設定) */
        .mes[is_user="false"][ch_name="${safeName}"] .avatar img {
            content: url('${spriteUrl}') !important;
            object-fit: cover !important;
            object-position: top center !important;
        }

        /* 2. 防禦 Cocktail 或某些主題把圖片設為 .avatar 背景的情況 */
        .mes[is_user="false"][ch_name="${safeName}"] .avatar {
            background-image: url('${spriteUrl}') !important;
            background-size: cover !important;
            background-position: top center !important;
        }

        /* 3. 防禦 Ripple 主題可能直接把背景畫在偽元素上的情況 */
        .mes[is_user="false"][ch_name="${safeName}"] .mes_text::before,
        .mes[is_user="false"][ch_name="${safeName}"]::before {
            background-image: url('${spriteUrl}') !important;
        }
    `;
}

function updateAvatars() {
    const expressionImage = document.getElementById('expression-image');
    if (!expressionImage) return;

    const currentSpriteSrc = expressionImage.getAttribute('src');
    if (!currentSpriteSrc) return;

    // 取得最新一則對話的角色名稱，因為通常立繪改變是因為該角色剛發送/更新了訊息
    const messages = Array.from(document.querySelectorAll('.mes[is_user="false"]'));
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const characterName = lastMessage.getAttribute('ch_name');

    if (characterName) {
        injectSpriteCSS(characterName, currentSpriteSrc);
    }
}

jQuery(function () {
    console.log(`[${MODULE_NAME}] Extension loaded. Using Invincible CSS Injection.`);

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
            document.querySelectorAll('style[id^="moonlit-sprite-styles-"]').forEach(el => el.remove());
        }
    });

    const observer = new MutationObserver((mutations) => {
        if (!isEnabled) return;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                updateAvatars();
            }
        });
    });

    const checkExist = setInterval(function() {
        const expressionImage = document.getElementById('expression-image');
        if (expressionImage) {
            observer.observe(expressionImage, { attributes: true });
            clearInterval(checkExist);
            
            // 找到立繪圖片後，不用等它改變，馬上直接執行一次替換！
            if (isEnabled) {
                setTimeout(updateAvatars, 100);
            }
        }
    }, 1000);

});
