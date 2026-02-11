import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class PostsController {
    public async index({ response }: HttpContext) {
        const posts = await Post.query().orderBy('publishedAt', 'desc')

        const formatted = posts.map(p => {
            const data = p.serialize()
            return {
                ...data,
                tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags,
                created_at: p.publishedAt ? p.publishedAt.toISO() : p.createdAt.toISO()
            }
        })

        return response.json(formatted)
    }

    public async show({ params, response }: HttpContext) {
        const post = await Post.findByOrFail('slug', params.slug)

        const data = post.serialize()
        const formatted = {
            ...data,
            tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags,
            created_at: post.publishedAt ? post.publishedAt.toISO() : post.createdAt.toISO()
        }

        return response.json(formatted)
    }

    public async store({ request, response }: HttpContext) {
        const data = request.only(['title', 'slug', 'content', 'description', 'tags', 'publishedAt'])

        if (Array.isArray(data.tags)) {
            data.tags = JSON.stringify(data.tags)
        }

        const post = await Post.create(data)
        return response.created(post)
    }

    public async update({ params, request, response }: HttpContext) {
        const post = await Post.findByOrFail('slug', params.slug)
        const data = request.only(['title', 'content', 'description', 'tags', 'publishedAt'])

        if (Array.isArray(data.tags)) {
            data.tags = JSON.stringify(data.tags)
        }

        post.merge(data)
        await post.save()

        return response.json(post)
    }

    public async destroy({ params, response }: HttpContext) {
        const post = await Post.findByOrFail('slug', params.slug)
        await post.delete()
        return response.noContent()
    }
}