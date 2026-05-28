import { eventSource, event_types } from '../../../script.js';

const MODULE_NAME = 'moonlit-sprite-avatar';

// 使用注入 CSS 的方式，這是最無敵的，因為即使 Cocktail 或 Moonlit 覆寫了 DOM 結構，
// 瀏覽器原生的 CSS !important 依然會強勢蓋過它們的設定！
function injectSpriteCSS(characterName, spriteUrl) {
    if (!characterName || !spriteUrl) return;

    let styleEl = document.getElementById('moonlit-sprite-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'moonlit-sprite-styles';
        document.head.appendChild(styleEl);
    }

    // 針對特定的角色名稱，強制替換它的所有頭像變數與 img 內容
    // 注意：使用 CSS.escape 來避免名稱中有特殊字元導致 CSS 破壞
    const safeName = CSS.escape(characterName);
    
    styleEl.innerHTML = `
        /* 覆寫 Ripple 主題依賴的 CSS 變數 */
        .mes[is_user="false"][ch_name="${safeName}"] {
            --mes-avatar-url: url('${spriteUrl}') !important;
            --mes-avatar-original-url: url('${spriteUrl}') !important;
            --mes-avatar-thumb-url: url('${spriteUrl}') !important;
        }
        
        /* 直接覆寫圖片元素 (防禦 Cocktail 或其他腳本) */
        .mes[is_user="false"][ch_name="${safeName}"] .avatar img {
            content: url('${spriteUrl}') !important;
            object-fit: cover !important;
            object-position: top center !important;
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

    const observer = new MutationObserver((mutations) => {
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
        }
    }, 1000);

    eventSource.on(event_types.CHAT_CHANGED, () => setTimeout(updateAvatars, 500));
    eventSource.on(event_types.MESSAGE_RECEIVED, () => setTimeout(updateAvatars, 500));
    eventSource.on(event_types.MESSAGE_UPDATED, () => setTimeout(updateAvatars, 500));
});
