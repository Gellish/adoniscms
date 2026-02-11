/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const PostsController = () => import('#controllers/posts_controller')
const AuthController = () => import('#controllers/auth_controller')
const StatsController = () => import('#controllers/stats_controller')
const EventsController = () => import('#controllers/events_controller')

router.get('/', async () => {
    return { status: 'ok', message: 'AdonisJS Backend is Running. API is at /api' }
})

router.group(() => {
    router.get('/hello', async () => {
        return { message: 'Hello from AdonisJS Enterprise Backend!' }
    })
    router.get('/posts', [PostsController, 'index'])
    router.get('/posts/:slug', [PostsController, 'show'])
    router.post('/posts', [PostsController, 'store'])
    router.put('/posts/:slug', [PostsController, 'update'])
    router.delete('/posts/:slug', [PostsController, 'destroy'])

    // Auth Routes
    router.group(() => {
        router.post('/register', [AuthController, 'register'])
        router.post('/login', [AuthController, 'login'])
        router.post('/logout', [AuthController, 'logout'])
        router.get('/me', [AuthController, 'me'])
    }).prefix('auth')

    // Admin Routes
    router.group(() => {
        router.get('/stats', [StatsController, 'index'])
    }).prefix('admin')

    // Event Routes
    router.get('/events', [EventsController, 'index'])
    router.post('/events/sync', [EventsController, 'sync'])

}).prefix('api')
