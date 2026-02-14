<script lang="ts">
    import { useAuth } from "$lib/auth.svelte";

    const auth = useAuth();

    function handleLogout() {
        auth.logout();
    }
</script>

<div
    class="flex items-center justify-between gap-4 w-full h-full bg-slate-50 p-4 rounded-xl"
>
    <div class="flex items-center gap-3 overflow-hidden">
        <div
            class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform"
        >
            👤
        </div>
        <div class="flex flex-col min-w-0">
            <span
                class="text-xs font-black text-slate-900 uppercase tracking-tighter truncate"
            >
                {auth.user?.fullName || "Guest User"}
            </span>
            <span
                class="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate"
            >
                {auth.user?.email || "admin@devcms.com"}
            </span>
        </div>
    </div>

    <button
        onclick={handleLogout}
        class="px-3 py-1.5 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shrink-0 shadow-sm"
    >
        Logout
    </button>
</div>
