<script lang="ts">
    import { useAuth } from "$lib/auth.svelte";

    const auth = useAuth();
</script>

<div class="row justify-content-center">
    <div class="col-md-6">
        <div class="card shadow-sm border-0">
            <div class="card-body p-4">
                <h2 class="text-center mb-4">Your Profile</h2>

                {#if auth.user}
                    <div class="profile-info">
                        <div class="field">
                            <span class="label">Full Name</span>
                            <p>{auth.user.fullName}</p>
                        </div>
                        <div class="field">
                            <span class="label">Email Address</span>
                            <p>{auth.user.email}</p>
                        </div>
                    </div>

                    <div class="d-grid gap-2 mt-4">
                        <button
                            onclick={() => auth.logout()}
                            class="btn btn-danger py-2 fw-bold"
                        >
                            Logout
                        </button>
                    </div>
                {:else}
                    <p class="text-center">
                        Please <a href="/login">login</a> to view your profile.
                    </p>
                {/if}
            </div>
        </div>

        <div class="mt-4 text-center">
            <a href="/" class="text-decoration-none text-muted small"
                >← Back to Home</a
            >
        </div>
    </div>
</div>

<style>
    .row {
        display: flex;
        justify-content: center;
    }
    .col-md-6 {
        flex: 0 0 50%;
        max-width: 50%;
    }
    .card {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .profile-info {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .field .label {
        display: block;
        font-weight: bold;
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }
    .field p {
        font-size: 1.1rem;
        margin: 0;
        color: #333;
    }
    .btn-danger {
        width: 100%;
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.75rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }
    .mt-4 {
        margin-top: 2rem;
    }
    .text-center {
        text-align: center;
    }
    .text-muted {
        color: #6c757d;
    }
    .small {
        font-size: 0.875rem;
    }
</style>
