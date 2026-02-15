import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import { join } from 'node:path'

export default class MediaController {
    private uploadsPath = app.makePath('public/uploads')

    /**
     * List all files in the uploads directory
     */
    public async index({ response }: HttpContext) {
        try {
            // Ensure directory exists
            await fs.mkdir(this.uploadsPath, { recursive: true })

            const files = await fs.readdir(this.uploadsPath)
            const media = await Promise.all(
                files.map(async (filename) => {
                    const stats = await fs.stat(join(this.uploadsPath, filename))
                    return {
                        name: filename,
                        size: stats.size,
                        url: `/uploads/${filename}`,
                        updatedAt: stats.mtime,
                    }
                })
            )

            return response.json(media.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()))
        } catch (error: any) {
            return response.status(500).json({ message: 'Failed to list media', error: error.message })
        }
    }

    /**
     * Upload a new file
     */
    public async store({ request, response }: HttpContext) {
        const file = request.file('file', {
            size: '10mb',
            extnames: ['jpg', 'png', 'jpeg', 'gif', 'svg', 'pdf', 'webp'],
        })

        if (!file) {
            return response.badRequest({ message: 'No file uploaded' })
        }

        if (!file.isValid) {
            return response.badRequest({ message: 'Invalid file', errors: file.errors })
        }

        // Generate unique name to avoid collisions
        const fileName = `${Date.now()}-${file.clientName.replace(/\s+/g, '-')}`

        await file.move(this.uploadsPath, {
            name: fileName,
            overwrite: true,
        })

        return response.created({
            name: fileName,
            url: `/uploads/${fileName}`,
            message: 'File uploaded successfully',
        })
    }

    /**
     * Delete a file
     */
    public async destroy({ params, response }: HttpContext) {
        try {
            const filePath = join(this.uploadsPath, params.name)
            await fs.unlink(filePath)
            return response.noContent()
        } catch (error: any) {
            return response.status(404).json({ message: 'File not found or could not be deleted' })
        }
    }

    /**
     * Serve a file manually (since static serving is disabled)
     */
    public async show({ params, response }: HttpContext) {
        try {
            const filePath = join(this.uploadsPath, params.name)
            return response.download(filePath)
        } catch (error: any) {
            return response.status(404).send('File not found')
        }
    }
}
