import type { HttpContext } from '@adonisjs/core/http'
import FileEventStore from '#services/file_event_store'
import Post from '#models/post'

export default class EventsController {
    private eventStore: FileEventStore

    constructor() {
        this.eventStore = new FileEventStore()
    }

    public async index({ response }: HttpContext) {
        const events = await this.eventStore.getAll()
        return response.ok(events)
    }

    public async sync({ request, response }: HttpContext) {
        const { events } = request.body()

        if (!Array.isArray(events)) {
            return response.badRequest({ message: 'Invalid format. Expected "events" array.' })
        }

        console.log(`[EventsController] Received ${events.length} events`)
        const processedIds: string[] = []

        for (const eventData of events) {
            // 1. Persist to File Store (Write Model)
            // FileEventStore handles idempotency internally per segment
            await this.eventStore.save({
                eventId: eventData.eventId,
                type: eventData.type,
                payload: eventData.payload,
                meta: eventData.meta,
                timestamp: eventData.timestamp,
                aggregateId: eventData.aggregateId, // Expecting these from frontend now
                aggregateType: eventData.aggregateType
            })

            // 2. Projections (Read Model / Main DB)
            try {
                await this.projectEvent(eventData)
            } catch (err) {
                console.error(`[EventsController] Projection failed for ${eventData.type}`, err)
            }

            processedIds.push(eventData.eventId)
        }

        return response.ok({ synced: processedIds })
    }

    private async projectEvent(event: any) {
        const { type, payload } = event

        switch (type) {
            case 'PostCreated':
                // Payload has { id, title, content, slug, ... }
                // We map it to our Post model
                await Post.create({
                    title: payload.title,
                    slug: payload.slug,
                    content: payload.content,
                    // If we had an ID in the event that matches DB ID, we might force it, but usually DB auto-increments.
                    // For this demo, we let DB auto-increment ID, but we might store the aggregateId if we were rigorous.
                    // existing Post model has auto-increment ID.
                })
                console.log(`[Projection] Created Post: ${payload.title}`)
                break

            default:
                console.log(`[Projection] No projection for ${type}`)
        }
    }
}