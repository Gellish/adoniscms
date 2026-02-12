<script lang="ts">
    import { page } from "$app/stores";
    import { useAuth } from "../lib/auth.svelte";
    import { linkPrefetch } from "../lib/prefetch";

    const auth = useAuth();
    let isMobileMenuOpen = $state(false);
    let isProfileDropdownOpen = $state(false);

    function toggleMobileMenu() {
        isMobileMenuOpen = !isMobileMenuOpen;
    }

    function toggleProfileDropdown() {
        isProfileDropdownOpen = !isProfileDropdownOpen;
    }

    function closeMenus() {
        isMobileMenuOpen = false;
        isProfileDropdownOpen = false;
    }

    // Helper for active class
    function isActive(path: string) {
        return $page.url.pathname === path
            ? "text-primary-600 bg-primary-50 rounded-md px-3 py-2 text-sm font-semibold"
            : "text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-md px-3 py-2 text-sm font-medium transition-colors";
    }

    function isMobileActive(path: string) {
        return $page.url.pathname === path
            ? "bg-primary-50 text-primary-600 block rounded-md px-3 py-2 text-base font-semibold"
            : "text-gray-600 hover:bg-gray-50 hover:text-primary-600 block rounded-md px-3 py-2 text-base font-medium";
    }
</script>

<nav class="bg-white border-b border-gray-200 mb-8 sticky top-0 z-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="relative flex h-16 items-center justify-between">
            <!-- Mobile menu button -->
            <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <button
                    type="button"
                    class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                    onclick={toggleMobileMenu}
                >
                    <span class="absolute -inset-0.5"></span>
                    <span class="sr-only">Open main menu</span>
                    <!-- Icon when menu is closed -->
                    <svg
                        class="{isMobileMenuOpen ? 'hidden' : 'block'} size-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                    </svg>
                    <!-- Icon when menu is open -->
                    <svg
                        class="{isMobileMenuOpen ? 'block' : 'hidden'} size-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <!-- Logo and Desktop Links -->
            <div
                class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start"
            >
                <div class="flex flex-shrink-0 items-center">
                    <a
                        href="/"
                        class="text-primary-600 font-heading font-bold text-xl tracking-tight"
                        >DevCMS</a
                    >
                </div>
                <div class="hidden sm:ml-6 sm:block">
                    <div class="flex space-x-4">
                        <a href="/" class={isActive("/")} use:linkPrefetch
                            >Home</a
                        >
                        <a
                            href="/blog"
                            class={isActive("/blog")}
                            use:linkPrefetch>Blog</a
                        >
                        <a
                            href="/about"
                            class={isActive("/about")}
                            use:linkPrefetch>About</a
                        >
                        <a
                            href="/contact"
                            class={isActive("/contact")}
                            use:linkPrefetch>Contact</a
                        >
                    </div>
                </div>
            </div>

            <!-- Auth Navigation -->
            <div
                class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
            >
                {#if !auth.user}
                    <div class="hidden sm:flex sm:gap-3 items-center">
                        <a
                            href="/login"
                            class="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                            >Login</a
                        >
                        <a
                            href="/register"
                            class="btn-primary text-sm !py-2 !px-4">Sign Up</a
                        >
                    </div>
                {:else}
                    <!-- Profile dropdown -->
                    <div class="relative ml-3">
                        <div>
                            <button
                                type="button"
                                class="relative flex items-center gap-2 py-2 px-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                id="user-menu-button"
                                aria-expanded={isProfileDropdownOpen}
                                aria-haspopup="true"
                                onclick={toggleProfileDropdown}
                            >
                                <span class="sr-only">Open user menu</span>
                                <span class="text-sm font-medium"
                                    >{auth.user.fullName}</span
                                >
                                <div
                                    class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200"
                                >
                                    {auth.user.fullName.charAt(0)}
                                </div>
                            </button>
                        </div>

                        {#if isProfileDropdownOpen}
                            <div
                                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none transition ease-out duration-100 transform opacity-100 scale-100"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="user-menu-button"
                                tabindex="-1"
                            >
                                <a
                                    href="/profile"
                                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                    role="menuitem"
                                    onclick={closeMenus}>Your Profile</a
                                >
                                {#if auth.user.role === "admin"}
                                    <a
                                        href="/admin"
                                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                        role="menuitem"
                                        onclick={closeMenus}>Dashboard</a
                                    >
                                    <a
                                        href="/admin/menus"
                                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                        role="menuitem"
                                        onclick={closeMenus}>Menus</a
                                    >
                                {/if}
                                <div
                                    class="border-t border-gray-100 my-1"
                                ></div>
                                <button
                                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                                    role="menuitem"
                                    onclick={() => {
                                        closeMenus();
                                        auth.logout();
                                    }}
                                >
                                    Sign out
                                </button>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Mobile menu -->
    {#if isMobileMenuOpen}
        <div class="sm:hidden border-t border-gray-200" id="mobile-menu">
            <div class="space-y-1 px-2 pb-3 pt-2">
                <a
                    href="/"
                    class={isMobileActive("/")}
                    aria-current="page"
                    onclick={closeMenus}>Home</a
                >
                <a
                    href="/blog"
                    class={isMobileActive("/blog")}
                    onclick={closeMenus}>Blog</a
                >
                <a
                    href="/about"
                    class={isMobileActive("/about")}
                    onclick={closeMenus}>About</a
                >
                <a
                    href="/contact"
                    class={isMobileActive("/contact")}
                    onclick={closeMenus}>Contact</a
                >

                {#if !auth.user}
                    <div
                        class="border-t border-gray-200 pt-4 mt-4 space-y-2 px-3"
                    >
                        <a
                            href="/login"
                            class="block w-full text-center rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 border border-gray-300"
                            onclick={closeMenus}>Login</a
                        >
                        <a
                            href="/register"
                            class="block w-full text-center rounded-lg px-3 py-2 text-base font-medium bg-cta text-white hover:opacity-90 shadow-sm"
                            onclick={closeMenus}>Sign Up</a
                        >
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</nav>
