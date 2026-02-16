import type { HttpContext } from '@adonisjs/core/http'
import Menu from '#models/menu'

export default class MenusController {
    /**
     * List all menus
     */
    async index({ response }: HttpContext) {
        const menus = await Menu.query().orderBy('order', 'asc')

        // Parse the JSON items before sending to frontend
        const parsedMenus = menus.map(menu => ({
            ...menu.toJSON(),
            items: JSON.parse(menu.items)
        }))

        return response.ok(parsedMenus)
    }

    /**
     * Create a new menu
     */
    async store({ request, response }: HttpContext) {
        const data = request.only(['id', 'name', 'order', 'items'])

        const menu = await Menu.create({
            id: data.id || crypto.randomUUID(),
            name: data.name,
            order: data.order || 0,
            items: JSON.stringify(data.items || [])
        })

        return response.created({
            ...menu.toJSON(),
            items: JSON.parse(menu.items)
        })
    }

    /**
     * Update an existing menu
     */
    async update({ params, request, response }: HttpContext) {
        const menu = await Menu.find(params.id)
        if (!menu) {
            return response.notFound({ message: 'Menu not found' })
        }

        const data = request.only(['name', 'order', 'items'])

        if (data.name) menu.name = data.name
        if (data.order !== undefined) menu.order = data.order
        if (data.items) menu.items = JSON.stringify(data.items)

        await menu.save()

        return response.ok({
            ...menu.toJSON(),
            items: JSON.parse(menu.items)
        })
    }

    /**
     * Delete a menu
     */
    async destroy({ params, response }: HttpContext) {
        const menu = await Menu.find(params.id)
        if (!menu) {
            return response.notFound({ message: 'Menu not found' })
        }

        await menu.delete()
        return response.noContent()
    }

    /**
     * Reorder menus (Batch update)
     */
    async reorder({ request, response }: HttpContext) {
        const { menus } = request.only(['menus']) as { menus: any[] }

        if (!menus || !Array.isArray(menus)) {
            return response.badRequest({ message: 'Invalid payload' })
        }

        // Use a loop to update each menu's order
        for (let i = 0; i < menus.length; i++) {
            const menuData = menus[i]
            await Menu.query()
                .where('id', menuData.id)
                .update({ order: i })
        }

        return response.ok({ message: 'Order updated successfully' })
    }
}