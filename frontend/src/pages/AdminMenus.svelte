<script lang="ts">
    import { onMount } from "svelte";
    import type { Menu } from "$lib/types";
    import { ClientDB } from "$lib/client-db/core";
    import MenuBuilder from "$lib/components/MenuBuilder.svelte";

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
        // Auto-select from URL
        const id = new URLSearchParams(window.location.search).get("id");
        if (id) activeMenuId = id;
    });

    async function loadMenus() {
        // We now rely on adminState mostly, but can refresh here if needed
        try {
            const db = await ClientDB.init();
            const stored = await db.getAll("menus");
            if (stored && stored.length > 0) {
                menus = stored;
            } else {
                menus = DEFAULT_MENUS;
            }
        } catch (e) {
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
            const db = await ClientDB.init();
            const tx = db.transaction("menus", "readwrite");
            for (const menu of menus) {
                await tx.store.put($state.snapshot(menu));
            }
            await tx.done;
            alert("Navigation updated!");
        } catch (e) {
            console.error("Save failed", e);
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
        </div>

        <!-- Main Builder -->
        <div class="md:col-span-3">
            {#if activeMenu}
                <div
                    class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div
                        class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between"
                    >
                        <h2 class="font-bold text-slate-800">
                            {activeMenu.name}
                        </h2>
                        <input
                            type="text"
                            bind:value={menus[activeMenuIndex].name}
                            class="text-sm px-3 py-1 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div class="col-span-24 p-6 space-y-8">
                        {#key activeMenuId}
                            <MenuBuilder bind:menu={menus[activeMenuIndex]} />
                        {/key}
                        <div class="mt-8 flex justify-end">
                            <button
                                onclick={saveMenus}
                                class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            {:else}
                <div
                    class="bg-white rounded-2xl p-12 text-center border border-slate-200"
                >
                    <p class="text-slate-400">
                        Click '+ New Menu' in the sidebar to start building.
                    </p>
                </div>
            {/if}
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
