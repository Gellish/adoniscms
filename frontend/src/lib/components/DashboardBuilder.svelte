<script lang="ts">
    import { onMount } from "svelte";
    import { DashboardState } from "$lib/dashboardState.svelte";
    import { adminState } from "$lib/adminState.svelte";
    import DashboardGrid from "$lib/components/dashboard/DashboardGrid.svelte";
    import DashboardPalette from "$lib/components/dashboard/DashboardPalette.svelte";
    import DashboardContextMenu from "$lib/components/dashboard/DashboardContextMenu.svelte";

    let { slug = "default" } = $props<{ slug?: string }>();

    // Initialize state properly
    let state = $state(new DashboardState(slug));

    import { untrack } from "svelte";

    $effect(() => {
        // We only want to track 'slug' prop changes here
        const currentSlug = slug;

        const shouldLoad = untrack(() => {
            return (
                state.slug !== currentSlug ||
                (state.widgets.length === 0 &&
                    !state.isLoading &&
                    !state.hasLoaded)
            );
        });

        if (shouldLoad) {
            state.slug = currentSlug;
            state.load();
        }
    });
</script>

<DashboardGrid {state} />
<DashboardPalette {state} />
<DashboardContextMenu {state} />
