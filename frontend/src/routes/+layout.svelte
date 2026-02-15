<script lang="ts">
    import "../app.css";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import DebugOverlay from "$comp/DebugOverlay.svelte";
    import Nav from "$comp/Nav.svelte";
    import { useAuth } from "$lib/auth.svelte";
    import { SyncEngine } from "$lib/cqrs/sync";
    import { setupCacheInterceptor } from "$lib/fetchInterceptor";
    import FilePicker from "$lib/components/FilePicker.svelte";

    const auth = useAuth();
    let { children } = $props();

    // Check if we are in admin section
    let isAdmin = $derived($page.url.pathname.startsWith("/admin"));

    onMount(() => {
        if (browser) {
            setupCacheInterceptor();
            auth.checkAuth();
            SyncEngine.start();
            return () => SyncEngine.stop();
        }
    });
</script>

<DebugOverlay />

{#if isAdmin}
    <!-- Admin pages control their own layout completely -->
    {@render children()}
{:else}
    <!-- Public Layout -->
    <div
        class="flex flex-col min-h-screen font-sans antialiased text-text bg-background"
    >
        <Nav />

        <main class="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {@render children()}
        </main>

        <footer class="bg-white border-t border-gray-200 mt-auto py-8">
            <p class="text-center text-sm text-gray-500">
                &copy; 2026 My App. All rights reserved.
            </p>
        </footer>
    </div>
{/if}

<FilePicker />

<style>
    /* Bootstrap global styles assumed */
</style>
