<script lang="ts">
    import DynamicForm from "$lib/components/DynamicForm.svelte";
    import type { FieldSchema } from "$lib/types";

    let demoData = $state({
        firstName: "John",
        lastName: "Doe",
        bio: "Just a demo user...",
        role: "admin",
        active: true,
        markdown: "# Hello World\nThis is a dynamic field test.",
    });

    const demoSchema: FieldSchema[] = [
        {
            field: "firstName",
            label: "First Name",
            type: "input",
            placeholder: "Enter first name",
        },
        {
            field: "lastName",
            label: "Last Name",
            type: "input",
            placeholder: "Enter last name",
        },
        {
            field: "bio",
            label: "Biography",
            type: "textarea",
            placeholder: "Tell us about yourself",
        },
        {
            field: "role",
            label: "Role",
            type: "select",
            options: [
                { label: "Admin", value: "admin" },
                { label: "Editor", value: "editor" },
                { label: "Viewer", value: "viewer" },
            ],
        },
        { field: "active", label: "Active Status", type: "boolean" },
        {
            field: "markdown",
            label: "Detailed Content",
            type: "richtext",
            meta: { note: "Supports markdown" },
        },
    ];
</script>

<div class="p-8 max-w-4xl mx-auto">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 font-fira">
            Universal Component Demo
        </h1>
        <p class="text-slate-500 mt-2">
            Testing the data-driven form system inspired by Directus.
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Form Section -->
        <div class="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
            <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                </svg>
                Dynamic Form
            </h2>
            <DynamicForm schema={demoSchema} bind:data={demoData} />
        </div>

        <!-- State Preview Section -->
        <div class="space-y-6">
            <div
                class="bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-xl font-mono text-sm overflow-hidden"
            >
                <h2
                    class="text-indigo-400 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                    </svg>
                    Live Schema Data
                </h2>
                <pre class="overflow-auto max-h-[500px]"><code
                        >{JSON.stringify(demoData, null, 2)}</code
                    ></pre>
            </div>

            <div class="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <h3 class="text-indigo-900 font-semibold mb-2">How it works</h3>
                <p class="text-indigo-700 text-sm leading-relaxed">
                    This form is entirely generated from a JSON schema. Adding a
                    new field is as simple as adding an object to the schema
                    array. No manual input binding required.
                </p>
            </div>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #f8fafc;
    }
</style>
