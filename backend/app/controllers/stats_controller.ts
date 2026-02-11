import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
import User from '#models/user'

export default class StatsController {
    public async index({ response }: HttpContext) {
        const totalPosts = await Post.query().count('* as total')
        const totalUsers = await User.query().count('* as total')

        // Recent activity (last 5 posts)
        const recentPosts = await Post.query().orderBy('created_at', 'desc').limit(5)

        return response.json({
            posts: totalPosts[0].$extras.total,
            users: totalUsers[0].$extras.total,
            recentPosts: recentPosts.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                created_at: p.createdAt.toISO()
            })),
            systemState: 'Online'
        })
    }
}