<div class="space-y-24 pb-20">
    <!-- Hero Section -->
    <section class="text-center space-y-8 py-16 sm:py-24">
        <div class="max-w-4xl mx-auto px-4">
            <h1
                class="text-5xl sm:text-6xl font-bold tracking-tight text-text mb-6"
            >
                Build Single Page Apps <span class="text-primary-500"
                    >Faster</span
                >
            </h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Powered by SvelteKit, Tailwind CSS, and Svelte 5. The ultimate
                starting point for your next big project.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                <a href="/register" class="btn-primary"> Get Started Now </a>
                <a href="/about" class="btn-secondary"> Learn More </a>
            </div>

            <div class="mt-12 p-4">
                <button
                    class="text-sm text-gray-500 hover:text-primary-600 transition-colors underline"
                    type="button"
                    onclick={() => alert("SvelteKit is working via Tailwind!")}
                >
                    Test Component Interaction
                </button>
            </div>
        </div>
    </section>

    <!-- Features Grid -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="card group cursor-default">
                <div
                    class="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                        />
                    </svg>
                </div>
                <h3 class="text-xl font-bold mb-3">Lightning Fast</h3>
                <p class="text-gray-600">
                    Built on Vite and SvelteKit for instant HMR and optimized
                    production builds.
                </p>
            </div>

            <div class="card group cursor-default">
                <div
                    class="h-12 w-12 bg-secondary-100 rounded-lg flex items-center justify-center text-secondary-600 mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z"
                        />
                    </svg>
                </div>
                <h3 class="text-xl font-bold mb-3">Type Safe</h3>
                <p class="text-gray-600">
                    Full TypeScript support out of the box for robust and
                    maintainable code.
                </p>
            </div>

            <div class="card group cursor-default">
                <div
                    class="h-12 w-12 bg-cta/10 rounded-lg flex items-center justify-center text-cta mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                        />
                    </svg>
                </div>
                <h3 class="text-xl font-bold mb-3">Mobile Ready</h3>
                <p class="text-gray-600">
                    Fully responsive design system that looks great on any
                    device.
                </p>
            </div>
        </div>
    </section>
</div>
