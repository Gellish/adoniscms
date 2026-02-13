<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { ClientDB, type TableMeta } from '../client-db/core';

    const dispatch = createEventDispatcher();

    let name = $state('');
    let keyPath = $state('id');
    let isEncrypted = $state(false);
    let creating = $state(false);

    async function handleCreate() {
        if (!name) return;
        creating = true;
        try {
            const meta: TableMeta = {
                name: name.toLowerCase(),
                keyPath,
                indices: [],
                isEncrypted,
                createdAt: Date.now()
            };
            await ClientDB.createTable(meta);
            name = '';
            dispatch('created');
        } catch (e) {
            console.error('Failed to create table', e);
        } finally {
            creating = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto w-full">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1 class="text-3xl font-black tracking-tighter uppercase leading-none">Entity Designer</h1>
            <p class="text-gray-400 mt-2 text-sm">Define the schema for your offline-first application components.</p>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Creation Card -->
        <div class="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">New Object Store</h2>
            <div class="space-y-6">
                <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase mb-1.5" for="name">Internal Name</label>
                    <input 
                        bind:value={name}
                        id="name"
                        type="text" 
                        placeholder="e.g. blog_posts"
                        class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-500 uppercase mb-1.5" for="key">Primary Key Path</label>
                    <input 
                        bind:value={keyPath}
                        id="key"
                        type="text" 
                        class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold opacity-50 cursor-not-allowed"
                        disabled
                    />
                </div>
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                        <p class="text-xs font-black text-gray-700 uppercase leading-none">AES-GCM Encryption</p>
                        <p class="text-[9px] text-gray-400 mt-1">Protect sensitive local data</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" bind:checked={isEncrypted} class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                </div>

                <button 
                    onclick={handleCreate}
                    disabled={!name || creating}
                    class="w-full bg-gray-900 text-white font-black uppercase text-xs py-3 rounded-lg hover:bg-primary-600 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    {creating ? 'Committing Schema...' : 'Create Table'}
                </button>
            </div>
        </div>

        <!-- Documentation Card -->
        <div class="md:col-span-2 space-y-6">
            <div class="bg-gray-900 text-white p-8 rounded-2xl shadow-xl border border-gray-800 relative overflow-hidden">
                <div class="relative z-10">
                    <h2 class="text-xl font-black uppercase tracking-tighter mb-4">Production-Ready Architecture</h2>
                    <p class="text-gray-400 text-sm leading-relaxed mb-6">You are using a state-of-the-art ClientDB engine. Every table you create is automatically versioned and tracked in the <span class="text-primary-400 font-mono">_meta</span> store.</p>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                            <p class="text-[9px] font-black text-primary-400 uppercase mb-1">Conflict Strategy</p>
                            <p class="text-xs font-bold font-mono">LWW (Last Write Wins)</p>
                        </div>
                        <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                            <p class="text-[9px] font-black text-primary-400 uppercase mb-1">Key Generation</p>
                            <p class="text-xs font-bold font-mono">UUID v4 (Web Crypto)</p>
                        </div>
                    </div>
                </div>
                <!-- Background decoration -->
                <div class="absolute -bottom-10 -right-10 w-48 h-48 bg-primary-600/10 rounded-full blur-3xl"></div>
            </div>

            <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <div class="text-amber-800 text-xs leading-relaxed font-bold">
                    <p>SUPERADMIN NOTE: Store names must be unique and lowercase. Once created, a store's primary key path cannot be changed without data migration.</p>
                </div>
            </div>
        </div>
    </div>
</div>
