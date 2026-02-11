import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {

    /**
     * Register a new user
     */
    public async register({ request, response, auth }: HttpContext) {
        const data = request.only(['fullName', 'email', 'password'])

        // Simple validation (can be enhanced with validators later)
        if (!data.email || !data.password) {
            return response.badRequest({ message: 'Email and password are required' })
        }

        // Check if user exists
        const existing = await User.findBy('email', data.email)
        if (existing) {
            return response.conflict({ message: 'User already exists' })
        }

        const user = await User.create(data)
        await auth.use('web').login(user)

        return response.created({ user, message: 'Registered successfully' })
    }

    /**
     * Login user
     */
    public async login({ request, response, auth }: HttpContext) {
        const { email, password } = request.only(['email', 'password'])

        try {
            const user = await User.verifyCredentials(email, password)
            await auth.use('web').login(user)
            return response.ok({ user, message: 'Logged in successfully' })
        } catch {
            return response.unauthorized({ message: 'Invalid credentials' })
        }
    }

    /**
     * Logout user
     */
    public async logout({ auth, response }: HttpContext) {
        await auth.use('web').logout()
        return response.ok({ message: 'Logged out successfully' })
    }

    /**
     * Get current user
     */
    public async me({ auth, response }: HttpContext) {
        try {
            await auth.use('web').authenticate()
            return response.ok(auth.use('web').user)
        } catch {
            return response.unauthorized({ message: 'Not authenticated' })
        }
    }
}