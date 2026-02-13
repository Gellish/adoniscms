<script lang="ts">
    import { onMount } from "svelte";
    import type { Menu } from "$lib/types";
    import { ClientDB } from "$lib/db.js";
    import MenuBuilder from "$lib/components/MenuBuilder.svelte";
    import AdminLayout from "$comp/AdminLayout.svelte";

    let menus = $state<Menu[]>([]);
    let isLoading = $state(true);

    const DEFAULT_MENUS: Menu[] = [
        {
            id: "1",
            name: "Main Navigation",
            items: [
                {
                    id: "1a",
                    label: "Home",
                    url: "/",
                    children: [],
                    isOpen: true,
                },
                {
                    id: "1b",
                    label: "Blog",
                    url: "/blog",
                    isOpen: true,
                    children: [],
                },
                {
                    id: "1c",
                    label: "About",
                    url: "/about",
                    children: [],
                    isOpen: true,
                },
            ],
        },
    ];

    onMount(async () => {
        await loadMenus();
    });

    async function loadMenus() {
        isLoading = true;
        try {
            const stored = await ClientDB.getMenus();
            if (stored && stored.length > 0) {
                menus = stored;
            } else {
                menus = DEFAULT_MENUS;
            }
        } catch (e) {
            console.error("Failed to load menus", e);
            menus = DEFAULT_MENUS;
        } finally {
            isLoading = false;
        }
    }

    let activeMenuId = $state("");
    $effect(() => {
        if (!activeMenuId && menus.length > 0) {
            activeMenuId = menus[0].id;
        }
    });

    let activeMenuIndex = $derived(
        menus.findIndex((m) => m.id === activeMenuId),
    );
    let activeMenu = $derived(menus[activeMenuIndex] || menus[0]);

    async function saveMenus() {
        try {
            for (const menu of menus) {
                await ClientDB.saveMenu($state.snapshot(menu));
            }
            alert("Menus saved to IndexedDB!");
        } catch (e) {
            alert("Failed to save menus");
        }
    }

    async function createNewMenu() {
        const name = prompt("Enter menu name:");
        if (!name) return;
        const newMenu: Menu = {
            id: crypto.randomUUID(),
            name,
            items: [],
        };
        menus.push(newMenu);
        activeMenuId = newMenu.id;
        await ClientDB.saveMenu(newMenu);
    }
</script>

<div class="max-w-6xl mx-auto p-8">
    <header class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-bold text-slate-900 tracking-tight">
                Menu Builder
            </h1>
            <p class="text-slate-500 mt-1">
                Manage your site's navigation structures.
            </p>
        </div>
        <button
            onclick={saveMenus}
            class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all font-semibold flex items-center gap-2"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                />
            </svg>
            Save Changes
        </button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Sidebar Selection -->
        <div class="md:col-span-1 space-y-2">
            <h3
                class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4"
            >
                Your Menus
            </h3>
            {#each menus as menu}
                <button
                    onclick={() => (activeMenuId = menu.id)}
                    class="w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center justify-between group"
                    class:bg-indigo-600={activeMenuId === menu.id}
                    class:text-white={activeMenuId === menu.id}
                    class:bg-white={activeMenuId !== menu.id}
                    class:text-slate-600={activeMenuId !== menu.id}
                    class:hover:bg-slate-100={activeMenuId !== menu.id}
                >
                    <span>{menu.name}</span>
                    <div
                        class="w-2 h-2 rounded-full transition-all"
                        class:bg-white={activeMenuId === menu.id}
                        class:bg-slate-200={activeMenuId !== menu.id}
                        class:group-hover:bg-indigo-400={activeMenuId !==
                            menu.id}
                    ></div>
                </button>
            {/each}

            <button
                onclick={createNewMenu}
                class="w-full text-left px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all font-medium flex items-center gap-2 mt-4"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                New Menu
            </button>
        </div>

        <!-- Main Builder -->
        <div class="md:col-span-3">
            {#if isLoading}
                <div
                    class="bg-white rounded-2xl p-12 text-center border border-slate-200"
                >
                    <p class="text-slate-400 font-bold animate-pulse">
                        Initializing Menu Engine...
                    </p>
                </div>
            {:else if menus.length > 0 && activeMenu}
                <div
                    class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div
                        class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between"
                    >
                        <div class="flex items-center gap-3">
                            <h2 class="font-bold text-slate-800">
                                {activeMenu.name}
                            </h2>
                            <span
                                class="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider"
                                >Active</span
                            >
                        </div>
                        <div class="flex items-center gap-2">
                            <input
                                type="text"
                                bind:value={menus[activeMenuIndex].name}
                                class="text-sm px-3 py-1 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div class="p-6">
                        {#key activeMenuId}
                            <MenuBuilder bind:menu={menus[activeMenuIndex]} />
                        {/key}
                    </div>
                </div>
            {:else}
                <div
                    class="bg-white rounded-2xl p-12 text-center border border-slate-200"
                >
                    <p class="text-slate-400">
                        No menus found. Create one to get started.
                    </p>
                </div>
            {/if}

            <div
                class="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-start"
            >
                <div class="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <div>
                    <h4 class="font-bold text-amber-900">Developer Note</h4>
                    <p class="text-amber-700 text-sm mt-1">
                        This builder uses a recursive state management system.
                        You can move items, nest them, and edit URLs in
                        real-time. Don't forget to push your changes to sync
                        with the backend.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* Custom scrollbar for better look */
    :global(::-webkit-scrollbar) {
        width: 8px;
    }
    :global(::-webkit-scrollbar-track) {
        background: #f1f5f9;
    }
    :global(::-webkit-scrollbar-thumb) {
        background: #cbd5e1;
        border-radius: 4px;
    }
    :global(::-webkit-scrollbar-thumb:hover) {
        background: #94a3b8;
    }
</style>
