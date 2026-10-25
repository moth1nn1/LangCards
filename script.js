// ==========================================
// 1. البيانات الأولية
// ==========================================
const DEFAULT_DATA = {
    activeList: null,
    theme: 'dark',
    lists: {}
};

let appData = JSON.parse(localStorage.getItem('langcards_app_data')) || DEFAULT_DATA;

let editingCardId = null;
let isEditingListMode = false;
let pendingAction = null;

// ==========================================
// 2. عناصر DOM
// ==========================================
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const openDrawerBtn = document.getElementById('open-drawer-btn');
const closeDrawerBtn = document.getElementById('close-drawer-btn');

// عناصر الليست
const listDropdownBtn = document.getElementById('list-dropdown-btn');
const listDropdownMenu = document.getElementById('list-dropdown-menu');
const listDropdownItems = document.getElementById('list-dropdown-items');
const currentListTitle = document.getElementById('current-list-title');

const addListBtn = document.getElementById('add-list-btn');
const editListBtn = document.getElementById('edit-list-btn');
const deleteListBtn = document.getElementById('delete-list-btn');

const cardsContainer = document.getElementById('cards-container');
const emptyState = document.getElementById('empty-state');
const addCardFab = document.getElementById('add-card-fab');

const cardModal = document.getElementById('card-modal');
const cardModalTitle = document.getElementById('card-modal-title');
const cardFrontInput = document.getElementById('card-front-input');
const cardBackInput = document.getElementById('card-back-input');
const closeCardModal = document.getElementById('close-card-modal');
const saveCardBtn = document.getElementById('save-card-btn');

const listModal = document.getElementById('list-modal');
const listModalTitle = document.getElementById('list-modal-title');
const listNameInput = document.getElementById('list-name-input');
const closeListModal = document.getElementById('close-list-modal');
const saveListBtn = document.getElementById('save-list-btn');

const toast = document.getElementById('toast');

const confirmModal = document.getElementById('confirm-modal');
const confirmModalContent = document.getElementById('confirm-modal-content');
const confirmMessage = document.getElementById('confirm-message');
const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
const okConfirmBtn = document.getElementById('ok-confirm-btn');

// ==========================================
// 3. الوظائف الأساسية
// ==========================================
function saveData() {
    localStorage.setItem('langcards_app_data', JSON.stringify(appData));
}

function showToast(message) {
    toast.innerText = message;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
    }, 2000);
}

function applyTheme(theme, persist = true) {
    if (persist) {
        appData.theme = theme;
        saveData();
    }

    const html = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let shouldBeDark = false;
    if (theme === 'dark') shouldBeDark = true;
    else if (theme === 'light') shouldBeDark = false;
    else if (theme === 'system') shouldBeDark = prefersDark;

    html.classList.toggle('dark', shouldBeDark);
    html.style.colorScheme = shouldBeDark ? 'dark' : 'light';
    void html.offsetHeight;

    document.querySelectorAll('input[name="theme-option"]').forEach(radio => {
        radio.checked = radio.value === theme;
    });
}

function showConfirm(message, actionCallback) {
    confirmMessage.innerText = message;
    pendingAction = actionCallback;

    confirmModal.classList.remove('hidden');
    setTimeout(() => {
        confirmModalContent.classList.remove('scale-95', 'opacity-0');
        confirmModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeConfirm() {
    confirmModalContent.classList.remove('scale-100', 'opacity-100');
    confirmModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        confirmModal.classList.add('hidden');
        pendingAction = null;
    }, 200);
}

function setListTitles(text) {
    if (currentListTitle) currentListTitle.innerText = text;
}

// ==========================================
// 4. مستمعو الأحداث العامة
// ==========================================
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (appData.theme === 'system') {
        applyTheme('system', false);
    }
});

document.querySelectorAll('input[name="theme-option"]').forEach(radio => {
    radio.addEventListener('change', (e) => applyTheme(e.target.value));
});

function toggleDrawer(open) {
    if (open) {
        drawerOverlay.classList.remove('hidden');
        setTimeout(() => {
            drawerOverlay.classList.remove('opacity-0');
            drawer.classList.remove('-translate-x-full');
        }, 10);
    } else {
        drawer.classList.add('-translate-x-full');
        drawerOverlay.classList.add('opacity-0');
        setTimeout(() => drawerOverlay.classList.add('hidden'), 300);
    }
}

openDrawerBtn.addEventListener('click', () => toggleDrawer(true));
closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
drawerOverlay.addEventListener('click', () => toggleDrawer(false));

listDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    listDropdownMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
    if(listDropdownMenu) listDropdownMenu.classList.add('hidden');
});

cancelConfirmBtn.addEventListener('click', closeConfirm);

okConfirmBtn.addEventListener('click', () => {
    if (pendingAction) pendingAction();
    closeConfirm();
});

confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeConfirm();
});

// ==========================================
// 5. عمليات الليستات
// ==========================================
function renderDropdown() {
    listDropdownItems.innerHTML = '';

    if (Object.keys(appData.lists).length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center';
        emptyMsg.innerText = 'No lists available';
        listDropdownItems.appendChild(emptyMsg);
        return;
    }

    Object.keys(appData.lists).forEach(listName => {
        const isSelected = listName === appData.activeList;

        const btn = document.createElement('button');
        btn.className = `w-full text-left px-4 py-2.5 text-base transition flex items-center justify-between ${
            isSelected
                ? 'bg-btnGreen/20 text-btnGreen font-bold'
                : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
        }`;
        btn.innerText = listName;
        btn.addEventListener('click', () => {
            appData.activeList = listName;
            saveData();
            renderUI();
            listDropdownMenu.classList.add('hidden');
        });
        listDropdownItems.appendChild(btn);
    });
}

addListBtn.addEventListener('click', () => {
    isEditingListMode = false;
    listModalTitle.innerText = "Add New List";
    listNameInput.value = "";
    listModal.classList.remove('hidden');
    listNameInput.focus();
});

editListBtn.addEventListener('click', () => {
    if (!appData.activeList || !appData.lists[appData.activeList]) {
        showToast("No list selected to edit!");
        return;
    }
    isEditingListMode = true;
    listModalTitle.innerText = "Edit List Name";
    listNameInput.value = appData.activeList;
    listModal.classList.remove('hidden');
    listNameInput.focus();
});

deleteListBtn.addEventListener('click', () => {
    const listKeys = Object.keys(appData.lists);

    if (listKeys.length === 0) {
        showToast("No lists to delete!");
        return;
    }

    const currentList = appData.activeList;
    const cardCount = appData.lists[currentList].length;

    let message = `Are you sure you want to delete the list "${currentList}"?`;
    if (cardCount > 0) {
        message += ` This list contains ${cardCount} card(s).`;
    }
    message += " This action cannot be undone.";

    showConfirm(message, () => {
        delete appData.lists[currentList];
        const remainingKeys = Object.keys(appData.lists);
        appData.activeList = remainingKeys.length > 0 ? remainingKeys[0] : null;
        saveData();
        renderUI();
        showToast("List deleted!");
    });
});

closeListModal.addEventListener('click', () => listModal.classList.add('hidden'));

saveListBtn.addEventListener('click', () => {
    const name = listNameInput.value.trim();
    if (!name) return;

    if (isEditingListMode) {
        if (name !== appData.activeList) {
            if (appData.lists[name]) {
                alert("A list with this name already exists!");
                return;
            }
            appData.lists[name] = appData.lists[appData.activeList];
            delete appData.lists[appData.activeList];
            appData.activeList = name;
        }
    } else {
        if (!appData.lists[name]) appData.lists[name] = [];
        appData.activeList = name;
    }

    saveData();
    listModal.classList.add('hidden');
    renderUI();
    showToast("List saved!");
});

// ==========================================
// 6. وظائف مساعدة
// ==========================================
function copyText(text) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
            showToast("Text copied to clipboard!");
        } else {
            showToast("Failed to copy text.");
        }
    } catch (err) {
        showToast("Text copied to clipboard!");
    }
}

function attachDragScroll(container) {
    let isDown = false;
    let startY;
    let scrollTop;
    let dragged = false;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        dragged = false;
        startY = e.pageY - container.offsetTop;
        scrollTop = container.scrollTop;
    });

    container.addEventListener('mouseleave', () => { isDown = false; });
    container.addEventListener('mouseup', () => { isDown = false; });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const y = e.pageY - container.offsetTop;
        const walk = (y - startY) * 1.5;
        if (Math.abs(walk) > 5) { dragged = true; }
        container.scrollTop = scrollTop - walk;
    });

    return () => dragged;
}

// ==========================================
// 7. عرض الكروت
// ==========================================
function renderCards() {
    cardsContainer.innerHTML = '';

    if (!appData.activeList || !appData.lists[appData.activeList]) {
        emptyState.classList.add('hidden');
        return;
    }

    const cards = appData.lists[appData.activeList] || [];

    if (cards.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'perspective-1000 w-full h-[210px] cursor-pointer';

        cardEl.innerHTML = `
            <div class="card-inner relative w-full h-full transform-style-3d transition-transform duration-500 rounded-[28px] shadow-lg">

                <div class="card-front absolute inset-0 w-full h-full bg-[#e2decb] text-gray-900 rounded-[28px] p-5 flex flex-col justify-between backface-hidden border border-black/5 z-10">
                    <div class="flex justify-between items-center relative z-20">
                        <span class="w-7 h-7 bg-black/10 rounded-full flex items-center justify-center font-bold text-sm text-gray-800">
                            ${index + 1}
                        </span>
                        <div class="flex items-center gap-4 text-gray-800 text-lg">
                            <button class="card-action-btn front-copy-btn hover:opacity-70 transition p-1" title="Copy Text">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button class="card-action-btn front-edit-btn hover:opacity-70 transition p-1" title="Edit Card">
                                <i class="fa-solid fa-pen text-base"></i>
                            </button>
                            <button class="card-action-btn front-delete-btn hover:text-red-600 transition p-1" title="Delete Card">
                                <i class="fa-solid fa-trash-can text-base"></i>
                            </button>
                        </div>
                    </div>

                    <div class="front-content overflow-y-auto max-h-[125px] my-auto px-2 text-center text-xl font-medium tracking-wide leading-relaxed no-select">
                        ${escapeHtml(card.front)}
                    </div>
                </div>

                <div class="card-back absolute inset-0 w-full h-full bg-[#b0be9f] text-gray-900 rounded-[28px] p-5 flex flex-col justify-between backface-hidden rotate-y-180 border border-black/5 z-20">
                    <div class="flex justify-between items-center relative z-30">
                        <span class="w-7 h-7 bg-black/10 rounded-full flex items-center justify-center font-bold text-sm text-gray-800">
                            ${index + 1}
                        </span>
                        <div class="flex items-center gap-4 text-gray-800 text-lg relative z-40">
                            <button type="button" class="card-action-btn back-copy-btn hover:opacity-70 transition p-1" title="Copy Translation">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button type="button" class="card-action-btn back-edit-btn hover:opacity-70 transition p-1" title="Edit Card">
                                <i class="fa-solid fa-pen text-base"></i>
                            </button>
                            <button type="button" class="card-action-btn back-delete-btn hover:text-red-600 transition p-1" title="Delete Card">
                                <i class="fa-solid fa-trash-can text-base"></i>
                            </button>
                        </div>
                    </div>

                    <div class="back-content overflow-y-auto max-h-[125px] my-auto px-2 text-center text-xl font-medium tracking-wide leading-relaxed no-select">
                        ${escapeHtml(card.back)}
                    </div>
                </div>

            </div>
        `;

        const inner = cardEl.querySelector('.card-inner');
        const frontContent = cardEl.querySelector('.front-content');
        const backContent = cardEl.querySelector('.back-content');

        const wasFrontDragged = attachDragScroll(frontContent);
        const wasBackDragged = attachDragScroll(backContent);

        cardEl.addEventListener('click', (e) => {
            if (e.target.closest('.card-action-btn')) return;
            if (wasFrontDragged() || wasBackDragged()) return;
            inner.classList.toggle('rotate-y-180');
        });

        cardEl.querySelector('.front-copy-btn').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            copyText(card.front);
        });
        cardEl.querySelector('.front-edit-btn').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            openCardModal(card.id);
        });
        cardEl.querySelector('.front-delete-btn').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            deleteCard(card.id);
        });

        cardEl.querySelector('.back-copy-btn').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            copyText(card.back);
        });
        cardEl.querySelector('.back-edit-btn').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            openCardModal(card.id);
        });
        cardEl.querySelector('.back-delete-btn').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            deleteCard(card.id);
        });

        cardsContainer.appendChild(cardEl);
    });
}

// ==========================================
// 8. عمليات الكروت
// ==========================================
addCardFab.addEventListener('click', () => {
    if (!appData.activeList || !appData.lists[appData.activeList]) {
        showToast("Please create a list first!");
        return;
    }
    openCardModal();
});

function openCardModal(cardId = null) {
    editingCardId = cardId;
    if (cardId) {
        const card = appData.lists[appData.activeList].find(c => c.id === cardId);
        if (card) {
            cardFrontInput.value = card.front;
            cardBackInput.value = card.back;
            cardModalTitle.innerText = "Edit Flashcard";
            saveCardBtn.innerText = "Save";
        }
    } else {
        cardFrontInput.value = '';
        cardBackInput.value = '';
        cardModalTitle.innerText = "Add Flashcard";
        saveCardBtn.innerText = "Add";
    }
    cardModal.classList.remove('hidden');
    cardFrontInput.focus();
}

closeCardModal.addEventListener('click', () => cardModal.classList.add('hidden'));

saveCardBtn.addEventListener('click', () => {
    const front = cardFrontInput.value.trim();
    const back = cardBackInput.value.trim();

    if (!front || !back) {
        alert("Please fill in both front and back text!");
        return;
    }

    const activeListCards = appData.lists[appData.activeList];

    if (editingCardId) {
        const card = activeListCards.find(c => c.id === editingCardId);
        if (card) {
            card.front = front;
            card.back = back;
        }
    } else {
        activeListCards.push({
            id: Date.now(),
            front,
            back
        });
    }

    saveData();
    cardModal.classList.add('hidden');
    renderCards();
    showToast(editingCardId ? "Card updated!" : "Card added!");
});

function deleteCard(cardId) {
    const card = appData.lists[appData.activeList].find(c => c.id === cardId);
    if (!card) return;

    showConfirm(`Are you sure you want to delete this card: "${card.front}"?`, () => {
        appData.lists[appData.activeList] = appData.lists[appData.activeList].filter(c => c.id !== cardId);
        saveData();
        renderCards();
        showToast("Card removed!");
    });
}

// ==========================================
// 9. دوال مساعدة إضافية
// ==========================================
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// ==========================================
// 10. عرض الواجهة الرئيسية
// ==========================================
function renderUI() {
    if (!appData.activeList || !appData.lists[appData.activeList]) {
        setListTitles("No List Selected");
        cardsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
            <i class="fa-regular fa-folder-open text-6xl mb-4 opacity-40"></i>
            <p class="text-lg font-medium mb-4">No lists yet.</p>
            <button onclick="document.getElementById('add-list-btn').click()" class="bg-btnGreen text-white px-5 py-2.5 rounded-xl hover:bg-[#7b8d69] transition font-medium shadow-lg">
                <i class="fa-solid fa-plus mr-2"></i> Create your first list
            </button>
        `;
        renderDropdown();
        return;
    }

    setListTitles(appData.activeList);
    emptyState.innerHTML = `
        <i class="fa-regular fa-clone text-6xl mb-4 opacity-40"></i>
        <p class="text-lg font-medium">No flashcards yet. Add one!</p>
    `;
    renderDropdown();
    renderCards();
}

// ==========================================
// 11. تشغيل التطبيق
// ==========================================
applyTheme(appData.theme || 'dark');
renderUI();