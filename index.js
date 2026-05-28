import { eventSource, event_types } from '../../../../script.js';

const MODULE_NAME = 'moonlit-sprite-avatar';

function updateAvatars() {
    // 取得當前的立繪圖片元素 (SillyTavern 預設的立繪顯示區域)
    const expressionImage = document.getElementById('expression-image');
    if (!expressionImage) return;

    // 取得立繪圖片網址和對應的角色名稱
    const currentSpriteSrc = expressionImage.getAttribute('src');
    const characterName = expressionImage.getAttribute('data-sprite-folder-name');

    if (!currentSpriteSrc || !characterName) return;

    // 尋找對話框中屬於該角色的所有訊息頭像
    const messages = document.querySelectorAll('.mes[is_user="false"]');
    
    messages.forEach(mes => {
        const nameElement = mes.querySelector('.ch_name');
        
        // 比對名稱，確認是同一個角色的對話框
        if (nameElement && nameElement.textContent.trim() === characterName) {
            const avatarImg = mes.querySelector('.avatar img');
            
            if (avatarImg) {
                // 如果目前頭像還不是最新的立繪，就進行替換
                if (avatarImg.src !== currentSpriteSrc) {
                    avatarImg.src = currentSpriteSrc;
                    
                    // 為了配合 Ripple 主題的圓形遮罩，強制調整圖片顯示方式
                    avatarImg.style.objectFit = 'cover';
                    avatarImg.style.objectPosition = 'top center'; // 讓立繪盡量以臉部為主
                }
            }
        }
    });
}

jQuery(function () {
    console.log(`[${MODULE_NAME}] Extension loaded.`);

    // 使用 MutationObserver 監聽立繪圖片的變化
    // 這樣每當角色切換表情立繪時，頭像也會跟著變
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                updateAvatars();
            }
        });
    });

    // 確保找到立繪元素後再開始監聽
    const checkExist = setInterval(function() {
        const expressionImage = document.getElementById('expression-image');
        if (expressionImage) {
            observer.observe(expressionImage, { attributes: true });
            clearInterval(checkExist);
        }
    }, 1000);

    // 當載入對話或收到新訊息時，也嘗試更新
    eventSource.on(event_types.CHAT_CHANGED, () => setTimeout(updateAvatars, 500));
    eventSource.on(event_types.MESSAGE_RECEIVED, () => setTimeout(updateAvatars, 500));
    eventSource.on(event_types.MESSAGE_UPDATED, () => setTimeout(updateAvatars, 500));
});
