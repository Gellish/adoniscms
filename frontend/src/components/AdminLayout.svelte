<script lang="ts">
    import { onMount } from "svelte";
    import { fade, scale } from "svelte/transition";
    import { page } from "$app/state";
    import { useAuth } from "$lib/auth.svelte";
    import { goto } from "$app/navigation";
    import { adminState } from "$lib/adminState.svelte";
    import { browser } from "$app/environment";

    let { children } = $props<{ children: any }>();
    const auth = useAuth();

    // Trigger fast local load as early as possible
    if (browser) {
        adminState.loadAllLocal();
    }

    onMount(async () => {
        // Background API refresh
        adminState.refreshFromAPI();
        // Start real-time polling
        adminState.startPolling();
    });

    let showNewMenuModal = $state(false);
    let newMenuName = $state("");
    let newMenuRoute = $state("");
    let isRouteManuallyEdited = $state(false);

    // Auto-generate route from name while typing
    $effect(() => {
        if (!isRouteManuallyEdited && showNewMenuModal) {
            newMenuRoute = newMenuName
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]/g, "");
        }
    });

    async function handleCreateMenu() {
        if (!newMenuName.trim()) return;

        // If they provided a route, we can seed it or handle it
        await adminState.createMenu(newMenuName, newMenuRoute);

        // Show success signal!
        adminState.showToast(`Menu "${newMenuName}" created!`, "success");

        newMenuName = "";
        newMenuRoute = "";
        isRouteManuallyEdited = false;
        showNewMenuModal = false;
    }

    // Context Menu Logic
    let contextMenu = $state<{ x: number; y: number; menuId: string } | null>(
        null,
    );
    let showEditMenuModal = $state(false);
    let editMenuId = $state("");
    let editMenuName = $state("");
    let editMenuRoute = $state("");

    function handleContextMenu(e: MouseEvent, menu: any) {
        e.preventDefault();
        contextMenu = {
            x: e.clientX,
            y: e.clientY,
            menuId: menu.id,
        };
    }

    function closeContextMenu() {
        contextMenu = null;
    }

    function openEditModal() {
        if (contextMenu) {
            const menu = adminState.menus.find(
                (m) => m.id === contextMenu!.menuId,
            );
            if (menu) {
                editMenuId = menu.id;
                editMenuName = menu.name;
                // Assuming single item menu for now for route editing
                editMenuRoute = menu.items[0]?.url || "";
                showEditMenuModal = true;
            }
            closeContextMenu();
        }
    }

    async function handleUpdateMenu() {
        if (!editMenuName.trim()) return;
        const menu = adminState.menus.find((m) => m.id === editMenuId);
        if (menu) {
            // Simple update for now, preserving children structure but updating label/url of first item
            const updatedItems = [...menu.items];
            if (updatedItems.length > 0) {
                updatedItems[0].label = editMenuName;
                updatedItems[0].url = editMenuRoute;
            }
            await adminState.updateMenu(editMenuId, editMenuName, updatedItems);
            showEditMenuModal = false;
        }
    }

    // Delete Confirmation Logic
    let showDeleteMenuModal = $state(false);
    let deleteMenuId = $state("");

    function handleDeleteMenu() {
        if (contextMenu) {
            deleteMenuId = contextMenu.menuId;
            showDeleteMenuModal = true;
            closeContextMenu();
        }
    }

    async function confirmDeleteMenu() {
        if (deleteMenuId) {
            await adminState.deleteMenu(deleteMenuId);
            showDeleteMenuModal = false;
            deleteMenuId = "";
        }
    }

    // Layout expansion logic
    let isDashboard = $derived(
        page.url.pathname.includes("/admin/dashboard") ||
            page.url.pathname === "/admin" ||
            page.url.pathname === "/admin/" ||
            (page.url.pathname.startsWith("/admin/") &&
                ![
                    "posts",
                    "users",
                    "editor",
                    "menus",
                    "database",
                    "post",
                    "activity",
                ].some((p) => page.url.pathname.startsWith(`/admin/${p}`))),
    );

    // Drag and Drop Logic
    let draggingItem = $state<any>(null);
    let dragOverItem = $state<any>(null);

    function handleDragStart(e: DragEvent, menu: any) {
        draggingItem = menu;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", menu.id);
            // Hide the default drag image slightly
            e.dataTransfer.setDragImage(e.target as Element, 0, 0);
        }
    }

    function handleDragOver(e: DragEvent, menu: any) {
        e.preventDefault();
        if (draggingItem === menu) return;
        dragOverItem = menu;
    }

    function handleDragEnd() {
        draggingItem = null;
        dragOverItem = null;
    }

    async function handleDrop(e: DragEvent, targetMenu: any) {
        e.preventDefault();
        if (!draggingItem || draggingItem === targetMenu) return;

        const newOrder = [...adminState.menus];
        const draggedIdx = newOrder.findIndex((m) => m.id === draggingItem.id);
        const targetIdx = newOrder.findIndex((m) => m.id === targetMenu.id);

        if (draggedIdx > -1 && targetIdx > -1) {
            // Remove dragged item
            const [removed] = newOrder.splice(draggedIdx, 1);
            // Insert at new position
            newOrder.splice(targetIdx, 0, removed);

            // Clear styles immediately for snappy feel
            handleDragEnd();

            // Persist (and update local state via reorderMenu)
            await adminState.reorderMenu(newOrder);
            return;
        }

        handleDragEnd();
    }

    // Close context menu on global click
    function onGlobalClick() {
        closeContextMenu();
    }
</script>

<div class="admin-layout">
    <aside class="sidebar">
        <div class="brand">
            <span class="logo">🚀</span>
            <span class="name">Admin Panel</span>
        </div>

        <nav class="nav-scroll py-4">
            <!-- 100% Dynamic Sections Only -->
            {#each adminState.menus as menu (menu.id)}
                <div
                    draggable="true"
                    ondragstart={(e) => handleDragStart(e, menu)}
                    ondragover={(e) => handleDragOver(e, menu)}
                    ondragend={handleDragEnd}
                    ondrop={(e) => handleDrop(e, menu)}
                    class="menu-wrapper"
                    class:dragging={draggingItem === menu}
                    class:drag-over={dragOverItem === menu}
                    role="listitem"
                >
                    {#if menu.items.length === 1 && menu.items[0].label.toLowerCase() === menu.name.toLowerCase()}
                        <a
                            href={menu.items[0].url}
                            class="nav-item"
                            class:active={page.url.pathname ===
                                menu.items[0].url}
                            oncontextmenu={(e) => handleContextMenu(e, menu)}
                        >
                            <span class="font-semibold"
                                >{menu.items[0].label}</span
                            >
                        </a>
                    {:else if menu.items.length > 0}
                        <div class="nav-group mb-2">
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                class="nav-item section-header group pointer-events-none"
                                oncontextmenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <span
                                    class="flex-1 font-bold text-slate-500 text-[0.65rem] uppercase tracking-widest"
                                    >{menu.name}</span
                                >
                            </div>
                            <div class="sub-items">
                                {#each menu.items as item}
                                    <a
                                        href={item.url}
                                        class="nav-item sub"
                                        class:active={page.url.pathname ===
                                            item.url}
                                        oncontextmenu={(e) =>
                                            handleContextMenu(e, menu)}
                                    >
                                        <span>{item.label}</span>
                                    </a>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}

            <!-- THE RED CIRCLE BUTTON -->
            <div class="px-4">
                <button
                    onclick={() => (showNewMenuModal = true)}
                    class="add-nav-btn"
                >
                    + New Menu
                </button>
            </div>
        </nav>
    </aside>

    <div class="main-content">
        <main class="page-body" class:is-dashboard={isDashboard}>
            {@render children()}
        </main>
    </div>

    {#if showNewMenuModal}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="modal-overlay"
            onclick={() => {
                showNewMenuModal = false;
                isRouteManuallyEdited = false;
            }}
        >
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <div class="modal-header">
                    <div class="header-content">
                        <div class="icon-badge">
                            <span class="plus-icon">+</span>
                        </div>
                        <div class="title-group">
                            <h3>Create New Menu</h3>
                            <p>Build a new navigation structure</p>
                        </div>
                    </div>
                    <button
                        class="close-btn"
                        onclick={() => (showNewMenuModal = false)}
                        aria-label="Close modal"
                        ><svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><line x1="18" y1="6" x2="6" y2="18"></line><line
                                x1="6"
                                y1="6"
                                x2="18"
                                y2="18"
                            ></line></svg
                        ></button
                    >
                </div>
                <div class="modal-body">
                    <div class="input-container mb-6">
                        <label for="menu-name">MENU NAME</label>
                        <!-- svelte-ignore a11y_autofocus -->
                        <input
                            id="menu-name"
                            type="text"
                            bind:value={newMenuName}
                            placeholder="e.g. Collections, Shop, Support..."
                            onkeydown={(e) =>
                                e.key === "Enter" && handleCreateMenu()}
                            autofocus
                        />
                    </div>
                    <div class="input-container">
                        <label for="menu-route">ROUTE</label>
                        <input
                            id="menu-route"
                            type="text"
                            bind:value={newMenuRoute}
                            placeholder="route"
                            oninput={() => (isRouteManuallyEdited = true)}
                            onkeydown={(e) =>
                                e.key === "Enter" && handleCreateMenu()}
                        />
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        class="btn-cancel"
                        onclick={() => (showNewMenuModal = false)}
                        >Cancel</button
                    >
                    <button
                        class="btn-create"
                        onclick={handleCreateMenu}
                        disabled={!newMenuName.trim()}
                    >
                        <span>Create Menu</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><polyline points="9 18 15 12 9 6"></polyline></svg
                        >
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Edit Menu Modal -->
    {#if showEditMenuModal}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="modal-overlay"
            onclick={() => (showEditMenuModal = false)}
            role="presentation"
        >
            <div
                class="modal-content"
                onclick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                tabindex="-1"
            >
                <div class="modal-header">
                    <div class="header-content">
                        <div class="icon-badge">
                            <span class="plus-icon">✎</span>
                        </div>
                        <div class="title-group">
                            <h3>Edit Menu</h3>
                            <p>Update menu details</p>
                        </div>
                    </div>
                    <button
                        class="close-btn"
                        onclick={() => (showEditMenuModal = false)}
                        aria-label="Close modal"
                        ><svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><line x1="18" y1="6" x2="6" y2="18"></line><line
                                x1="6"
                                y1="6"
                                x2="18"
                                y2="18"
                            ></line></svg
                        ></button
                    >
                </div>
                <div class="modal-body">
                    <div class="input-container mb-6">
                        <label for="edit-menu-name">MENU NAME</label>
                        <input
                            id="edit-menu-name"
                            type="text"
                            bind:value={editMenuName}
                            onkeydown={(e) =>
                                e.key === "Enter" && handleUpdateMenu()}
                        />
                    </div>
                    <div class="input-container">
                        <label for="edit-menu-route">ROUTE</label>
                        <input
                            id="edit-menu-route"
                            type="text"
                            bind:value={editMenuRoute}
                            onkeydown={(e) =>
                                e.key === "Enter" && handleUpdateMenu()}
                        />
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        class="btn-cancel"
                        onclick={() => (showEditMenuModal = false)}
                        >Cancel</button
                    >
                    <button
                        class="btn-create"
                        onclick={handleUpdateMenu}
                        disabled={!editMenuName.trim()}
                    >
                        <span>Save Changes</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><polyline points="9 18 15 12 9 6"></polyline></svg
                        >
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Delete Menu Modal -->
    {#if showDeleteMenuModal}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="modal-overlay"
            onclick={() => (showDeleteMenuModal = false)}
            role="presentation"
        >
            <div
                class="modal-content"
                onclick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                tabindex="-1"
            >
                <div class="modal-header">
                    <div class="header-content">
                        <div
                            class="icon-badge"
                            style="background-color: #fff1f2; color: #e11d48;"
                        >
                            <span class="plus-icon" style="color: #e11d48;"
                                >🗑️</span
                            >
                        </div>
                        <div class="title-group">
                            <h3 style="color: #881337;">Delete Menu?</h3>
                            <p style="color: #e11d48;">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <button
                        class="close-btn"
                        onclick={() => (showDeleteMenuModal = false)}
                        aria-label="Close modal"
                        style="color: #e11d48; background-color: #fff1f2;"
                        ><svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><line x1="18" y1="6" x2="6" y2="18"></line><line
                                x1="6"
                                y1="6"
                                x2="18"
                                y2="18"
                            ></line></svg
                        ></button
                    >
                </div>
                <div class="modal-body" style="padding-bottom: 0;">
                    <p
                        style="color: #475569; font-size: 0.95rem; line-height: 1.6;"
                    >
                        Are you sure you want to delete this menu? All items
                        within it will be removed permanently.
                    </p>
                </div>
                <div
                    class="modal-footer"
                    style="background-color: #fff1f2; border-top-color: #ffe4e6; margin-top: 1.5rem;"
                >
                    <button
                        class="btn-cancel hover:bg-rose-50"
                        onclick={() => (showDeleteMenuModal = false)}
                        style="color: #e11d48; border-color: #ffe4e6; background: white;"
                        >Cancel</button
                    >
                    <button
                        class="btn-create"
                        onclick={confirmDeleteMenu}
                        style="background-color: #e11d48; box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.3);"
                    >
                        <span>Delete Menu</span>
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- API Context Menu -->
    {#if contextMenu}
        <div
            class="context-menu"
            style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
            role="menu"
            tabindex="-1"
        >
            <button class="context-item" onclick={openEditModal}>
                <span class="icon">✎</span>
                Edit Menu
            </button>
            <div class="divider"></div>
            <button class="context-item delete" onclick={handleDeleteMenu}>
                <span class="icon">🗑️</span>
                Delete Menu
            </button>
        </div>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 z-[9998]"
            onclick={closeContextMenu}
            role="presentation"
        ></div>
    {/if}

    <!-- Centered Global Success Toast -->
    {#if adminState.toast.visible}
        <div
            class="fixed inset-0 pointer-events-none flex items-center justify-center z-[10000]"
            transition:fade={{ duration: 200 }}
        >
            <div
                class="bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 transform -translate-y-12"
                transition:scale={{ start: 0.9, duration: 300 }}
            >
                <div class="bg-white/20 p-2 rounded-xl">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><polyline points="20 6 9 17 4 12"></polyline></svg
                    >
                </div>
                <span class="text-lg font-black uppercase tracking-tighter"
                    >{adminState.toast.message}</span
                >
            </div>
        </div>
    {/if}
</div>

<style>
    .admin-layout {
        display: flex;
        min-height: 100vh;
        background: #f4f7f6;
    }
    .sidebar {
        width: 250px;
        background: #2d3436;
        color: white;
        display: flex;
        flex-direction: column;
    }
    .brand {
        padding: 2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.2rem;
        font-weight: bold;
        border-bottom: 1px solid #3d4648;
    }
    nav {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        overflow-y: auto;
    }
    .nav-scroll::-webkit-scrollbar {
        width: 4px;
    }
    .nav-scroll::-webkit-scrollbar-thumb {
        background: #4a5568;
        border-radius: 10px;
    }
    .nav-item {
        background: none;
        border: none;
        color: #dfe6e9;
        text-align: left;
        padding: 0.75rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background 0.2s;
        text-decoration: none;
        display: block;
    }
    .nav-item:hover,
    .nav-item.active {
        background: #6c5ce7;
        color: white;
    }
    .add-nav-btn {
        width: 100%;
        padding: 0.75rem;
        border: 2px dashed #6c5ce7;
        color: #a29bfe;
        font-weight: 700;
        font-size: 0.8rem;
        border-radius: 8px;
        transition: all 0.2s;
        margin: 1rem 0;
        background: transparent;
    }
    .add-nav-btn:hover {
        background: rgba(108, 92, 231, 0.1);
        color: white;
    }
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: white;
    }
    .page-body {
        padding: 2rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }
    .page-body.is-dashboard {
        padding: 0 !important;
    }

    /* Beautiful Modal Styles - Refined to match screenshot */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
    }
    .modal-content {
        background: white;
        width: 100%;
        max-width: 480px;
        border-radius: 32px;
        box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-header {
        padding: 2rem 2rem 1.5rem;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
    }
    .header-content {
        display: flex;
        gap: 1.25rem;
    }
    .icon-badge {
        width: 48px;
        height: 48px;
        background: #f5f3ff;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .plus-icon {
        color: #6c5ce7;
        font-size: 1.5rem;
        font-weight: 800;
        line-height: 1;
    }
    .title-group h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
        color: #1e293b;
        letter-spacing: -0.025em;
        line-height: 1.2;
    }
    .title-group p {
        margin: 0.25rem 0 0;
        color: #64748b;
        font-size: 0.875rem;
    }
    .close-btn {
        background: #f1f5f9;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s;
    }
    .close-btn:hover {
        background: #e2e8f0;
        color: #475569;
        transform: rotate(90deg);
    }
    .modal-body {
        padding: 0 2rem 2rem;
    }
    .input-container {
        position: relative;
    }
    .input-container label {
        display: block;
        font-size: 0.7rem;
        font-weight: 800;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.75rem;
    }
    .input-container input {
        width: 100%;
        padding: 1.25rem 1.25rem;
        background: #f8fafc;
        border: 2px solid #f1f5f9;
        border-radius: 16px;
        font-size: 1rem;
        font-weight: 500;
        color: #1e293b;
        outline: none;
        transition: all 0.2s;
        position: relative;
        z-index: 1;
    }
    .input-container input::placeholder {
        color: #94a3b8;
        opacity: 0.7;
    }
    .input-container input:focus {
        background: white;
        border-color: #6c5ce7;
        box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.1);
    }
    .modal-footer {
        padding: 1.5rem 2rem;
        background: #f8fafc;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
        padding: 0.875rem 2rem;
        border-radius: 16px;
        font-weight: 700;
        color: #475569;
        background: white;
        border: 2px solid #f1f5f9;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-cancel:hover {
        background: #f1f5f9;
        border-color: #e2e8f0;
    }
    .btn-create {
        padding: 0.875rem 2rem;
        border-radius: 16px;
        font-weight: 800;
        color: white;
        background: #10b981; /* Emerald 500 */
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-transform: uppercase;
        letter-spacing: -0.01em;
        font-size: 0.75rem;
    }
    .btn-create:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.02);
        background: #059669; /* Emerald 600 */
        box-shadow: 0 12px 20px -3px rgba(16, 185, 129, 0.3);
    }
    .btn-create:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
    }
    .btn-create:disabled {
        background: #d1d5db;
        color: #9ca3af;
        cursor: not-allowed;
        box-shadow: none;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .context-menu {
        position: fixed;
        background: white;
        border-radius: 12px;
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        padding: 6px;
        min-width: 180px;
        z-index: 9999;
        animation: fadeIn 0.1s ease-out;
    }
    .context-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: #1e293b;
        font-size: 0.85rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s;
    }
    .context-item:hover {
        background: #f1f5f9;
        color: #0f172a;
    }
    .context-item.delete {
        color: #ef4444;
    }
    .context-item.delete:hover {
        background: #fef2f2;
        color: #dc2626;
    }
    .context-item .icon {
        font-size: 1rem;
        opacity: 0.7;
    }
    .divider {
        height: 1px;
        background: #f1f5f9;
        margin: 4px 0;
    }

    /* Drag and Drop Styles */
    .menu-wrapper {
        transition: all 0.2s;
        border-radius: 4px;
        margin-bottom: 2px;
    }
    .menu-wrapper.dragging {
        opacity: 0.5;
        background: #3d4648;
    }
    .menu-wrapper.drag-over {
        border-top: 2px solid #6c5ce7;
        padding-top: 2px;
    }
</style>
