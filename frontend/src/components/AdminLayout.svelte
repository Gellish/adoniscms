<script lang="ts">
    import { onMount } from "svelte";
    import { useAuth } from "../lib/auth.svelte";
    import { goto } from "$app/navigation";
    import { adminState } from "../lib/adminState.svelte";
    import { browser } from "$app/environment";

    let { children } = $props<{ children: any }>();
    const auth = useAuth();

    // Trigger fast local load as early as possible
    if (browser) {
        adminState.loadAllLocal();
    }

    onMount(async () => {
        // Fast local load (safeguard)
        await adminState.loadAllLocal();
        // Background API refresh
        adminState.refreshFromAPI();
        // Start real-time polling
        adminState.startPolling();
    });

    function navigateTo(path: string) {
        goto(path);
    }

    function handleLogout() {
        auth.logout();
    }
</script>

<div class="admin-layout">
    <aside class="sidebar">
        <div class="brand">
            <span class="logo">🚀</span>
            <span class="name">Admin Panel</span>
        </div>

        <nav>
            <button onclick={() => navigateTo("/admin")} class="nav-item">
                <span>Dashboard</span>
            </button>
            <button onclick={() => navigateTo("/admin/posts")} class="nav-item">
                <span>Posts</span>
            </button>
            <button onclick={() => navigateTo("/admin/users")} class="nav-item">
                <span>Users</span>
            </button>
            <button onclick={() => navigateTo("/admin/menus")} class="nav-item">
                <span>Menus</span>
            </button>
            <button
                onclick={() => navigateTo("/admin/database")}
                class="nav-item"
            >
                <span>Database Builder</span>
            </button>
            <div class="divider"></div>
            <button onclick={() => navigateTo("/")} class="nav-item secondary">
                <span>Public Site</span>
            </button>
        </nav>
    </aside>

    <div class="main-content">
        <header class="top-nav">
            <div class="user-info">
                {#if adminState.isSyncing}
                    <div
                        class="flex items-center gap-2 text-xs text-gray-400 animate-pulse mr-4"
                    >
                        <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                        Syncing...
                    </div>
                {/if}
                <span>{auth.user?.fullName}</span>
                <button onclick={handleLogout} class="logout-btn">Logout</button
                >
            </div>
        </header>

        <main class="page-body">
            {@render children()}
        </main>
    </div>
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
        gap: 0.5rem;
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
    }
    .nav-item:hover {
        background: #3d4648;
        color: white;
    }
    .nav-item.secondary {
        margin-top: auto;
        color: #b2bec3;
    }
    .divider {
        height: 1px;
        background: #3d4648;
        margin: 1rem 0;
    }
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .top-nav {
        height: 60px;
        background: white;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0 2rem;
    }
    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .logout-btn {
        background: none;
        border: 1px solid #ddd;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
    }
    .page-body {
        padding: 2rem;
        overflow-y: auto;
    }
</style>
