<script lang="ts">
    import { useAuth } from "$lib/auth.svelte";

    const auth = useAuth();
    let fullName = $state("");
    let email = $state("");
    let password = $state("");
    let error = $state("");
    let loading = $state(false);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = "";
        loading = true;

        try {
            await auth.register(email, password, fullName);
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
        } catch (err: any) {
            error = "Registration failed. Email may be taken.";
        } finally {
            loading = false;
        }
    }
</script>

<div
    class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
>
    <div class="max-w-md w-full space-y-8 card bg-white p-8 sm:p-10">
        <div class="text-center">
            <h1 class="text-3xl font-bold tracking-tight text-text">
                Create an account
            </h1>
            <p class="mt-2 text-sm text-gray-600">
                Get started with your free account today
            </p>
        </div>

        {#if error}
            <div
                class="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 flex items-center"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="w-5 h-5 mr-2 flex-shrink-0"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                    />
                </svg>
                {error}
            </div>
        {/if}

        <form class="mt-8 space-y-6" onsubmit={handleSubmit}>
            <div class="space-y-4">
                <div>
                    <label
                        for="fullName"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Full Name</label
                    >
                    <input
                        type="text"
                        id="fullName"
                        bind:value={fullName}
                        required
                        class="input"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Email address</label
                    >
                    <input
                        type="email"
                        id="email"
                        bind:value={email}
                        required
                        class="input"
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <label
                        for="password"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Password</label
                    >
                    <input
                        type="password"
                        id="password"
                        bind:value={password}
                        required
                        class="input"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={loading}
                    class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {#if loading}
                        <svg
                            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Creating Account...
                    {:else}
                        Create Account
                    {/if}
                </button>
            </div>
        </form>

        <div class="text-center text-sm">
            <p class="text-gray-600">
                Already have an account?
                <a
                    href="/login"
                    class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                    Login here
                </a>
            </p>
        </div>
    </div>
</div>
