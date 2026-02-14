<script lang="ts">
    import { useAuth } from "$lib/auth.svelte";

    const auth = useAuth();

    function handleLogout() {
        auth.logout();
    }
</script>

<div
    class="flex items-center justify-end w-full h-[60px] px-6 gap-6 bg-white border-b border-gray-200"
>
    <span
        class="text-[12px] font-medium text-slate-500 lowercase tracking-wide"
    >
        {auth.user?.email || "admin@devcms.com"}
    </span>

    <button
        onclick={handleLogout}
        class="px-4 py-1.5 border border-slate-200 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
    >
        Logout
    </button>
</div>
