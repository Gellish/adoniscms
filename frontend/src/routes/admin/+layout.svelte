<script>
    import AdminLayout from "$comp/AdminLayout.svelte";
    let { children } = $props();
</script>

<AdminLayout>
    {@render children()}
</AdminLayout>
