<script lang="ts">
    import { useAuth } from "$lib/auth.svelte";

    const auth = useAuth();

    function handleLogout() {
        auth.logout();
    }
</script>

<div
    class="flex items-center justify-between w-full h-[60px] px-8 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all"
>
    <!-- Left: Navigation / Breadcrumbs -->
    <div class="flex items-center gap-4">
        <div
            class="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
        >
            <span class="hover:text-indigo-600 transition-colors cursor-pointer"
                >Dashboard</span
            >
            <span class="text-slate-200">/</span>
            <span class="text-slate-900">Overview</span>
        </div>
    </div>

    <!-- Center: Search Placeholder -->
    <div class="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div class="relative w-full group">
            <div
                class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
            >
                <svg
                    class="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>
            <input
                type="text"
                placeholder="Search anything..."
                class="w-full bg-slate-50 border-none rounded-2xl py-2 pl-11 pr-4 text-xs font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
            />
        </div>
    </div>

    <!-- Right: User Actions -->
    <div class="flex items-center gap-6">
        <!-- Notifications -->
        <button
            class="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group"
        >
            <svg
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>
            <span
                class="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"
            ></span>
        </button>

        <!-- Profile Info -->
        <div class="flex items-center gap-3 pl-6 border-l border-slate-100">
            <div class="flex flex-col items-end">
                <span
                    class="text-[11px] font-bold text-slate-900 leading-tight"
                >
                    {auth.user?.fullName || "Admin User"}
                </span>
                <span
                    class="text-[10px] font-medium text-slate-400 lowercase leading-tight"
                >
                    {auth.user?.email || "admin@devcms.com"}
                </span>
            </div>

            <!-- Avatar -->
            <div
                class="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-[11px] font-black shadow-md ring-2 ring-indigo-50"
            >
                {auth.user?.fullName?.[0] ||
                    auth.user?.email?.[0]?.toUpperCase() ||
                    "A"}
            </div>

            <button
                onclick={handleLogout}
                class="ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Logout"
            >
                <svg
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                </svg>
            </button>
        </div>
    </div>
</div>
