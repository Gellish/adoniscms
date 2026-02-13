<script>
    import AdminLayout from "../../components/AdminLayout.svelte";
    let { children } = $props();
</script>

<AdminLayout>
    {@render children()}
</AdminLayout>
