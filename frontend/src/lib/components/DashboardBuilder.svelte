<script lang="ts">
    import { onMount } from "svelte";
    import { DashboardState } from "$lib/dashboardState.svelte";
    import { adminState } from "$lib/adminState.svelte";
    import DashboardGrid from "$lib/components/dashboard/DashboardGrid.svelte";
    import DashboardPalette from "$lib/components/dashboard/DashboardPalette.svelte";
    import DashboardContextMenu from "$lib/components/dashboard/DashboardContextMenu.svelte";

    let { slug = "default" } = $props<{ slug?: string }>();

    // Initialize state properly
    // Using $derived ensures state is recreated when slug changes, fixing the linter warning
    let state = $derived(new DashboardState(slug));

    $effect(() => {
        // Load dashboard config when state instance changes (which happens when slug changes)
        state.load();

        // Ensure shared admin state (like tables) is loaded
        if (adminState.tables.length === 0) {
            adminState.loadAllLocal();
        }
    });
</script>

<DashboardGrid {state} />
<DashboardPalette {state} />
<DashboardContextMenu {state} />
