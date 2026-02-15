import { adminState } from "$lib/adminState.svelte";

export interface MediaFile {
    name: string;
    size: number;
    url: string;
    updatedAt: string;
}

class MediaState {
    files = $state<MediaFile[]>([]);
    isLoading = $state(false);
    uploading = $state(false);

    // For FilePicker usage
    showPicker = $state(false);
    onSelect: ((file: MediaFile) => void) | null = null;

    async refresh() {
        this.isLoading = true;
        try {
            const response = await fetch('/api/media');
            if (response.ok) {
                this.files = await response.json();
            }
        } catch (e) {
            console.error('Failed to fetch media', e);
        } finally {
            this.isLoading = false;
        }
    }

    async upload(file: File) {
        this.uploading = true;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/media', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                await this.refresh();
                return await response.json();
            }
        } catch (e) {
            console.error('Upload failed', e);
        } finally {
            this.uploading = false;
        }
    }

    async delete(name: string) {
        try {
            const response = await fetch(`/api/media/${name}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await this.refresh();
            }
        } catch (e) {
            console.error('Delete failed', e);
        }
    }

    openPicker(callback: (file: MediaFile) => void) {
        this.onSelect = callback;
        this.showPicker = true;
        this.refresh();
    }

    select(file: MediaFile) {
        if (this.onSelect) {
            this.onSelect(file);
        }
        this.showPicker = false;
    }
}

export const mediaState = new MediaState();
