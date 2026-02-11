import fs from 'node:fs'
import path from 'node:path'
import app from '@adonisjs/core/services/app'

interface QueueEvent {
    eventId: string
    type: string
    payload: any
    meta?: any
    timestamp?: string
    aggregateId?: string
    aggregateType?: string
}

export default class FileEventStore {
    private storageDir: string
    private maxSegmentSize = 100

    constructor() {
        this.storageDir = app.makePath('storage/events')
    }

    /**
     * Save an event to the file system using segmented storage
     */
    public async save(event: QueueEvent): Promise<void> {
        // Ensure we have aggregate info. If not provided in root, try payload.
        // In a real CQRS system, these should be top-level.
        // We'll fallback to defaults or payload inspection if missing.
        const aggregateType = event.aggregateType || (event.payload as any).resource || 'system'
        const aggregateId = event.aggregateId || (event.payload as any).id || 'global'

        const typeSafe = this.sanitize(aggregateType)
        const idSafe = this.sanitize(aggregateId)

        // Directory structure: storage/events/{type}/{slug--id}/
        // We'll use just ID for simplicity if slug not available, or simple ID grouping
        const typeDir = path.join(this.storageDir, 'aggregates', typeSafe)
        const aggregateDir = path.join(typeDir, idSafe)

        if (!fs.existsSync(aggregateDir)) {
            fs.mkdirSync(aggregateDir, { recursive: true })
        }

        // Find current segment
        const segments = fs.readdirSync(aggregateDir)
            .filter(f => f.startsWith('segment-') && f.endsWith('.json'))
            .sort()

        let currentSegmentFile = segments.length > 0 ? segments[segments.length - 1] : 'segment-001.json'
        let currentSegmentPath = path.join(aggregateDir, currentSegmentFile)
        let segmentData: QueueEvent[] = []

        if (fs.existsSync(currentSegmentPath)) {
            try {
                segmentData = JSON.parse(fs.readFileSync(currentSegmentPath, 'utf-8'))
            } catch (e) {
                segmentData = []
            }
        }

        // Rotation Check
        if (segmentData.length >= this.maxSegmentSize) {
            const nextNum = parseInt(currentSegmentFile.replace('segment-', '').replace('.json', '')) + 1
            currentSegmentFile = `segment-${String(nextNum).padStart(3, '0')}.json`
            currentSegmentPath = path.join(aggregateDir, currentSegmentFile)
            segmentData = []
        }

        // Idempotency Check (within current segment - comprehensive check would need index)
        if (!segmentData.find(e => e.eventId === event.eventId)) {
            segmentData.push(event)
            // Sort by timestamp
            segmentData.sort((a, b) => {
                const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0
                const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0
                return tA - tB
            })

            fs.writeFileSync(currentSegmentPath, JSON.stringify(segmentData, null, 2))
            console.log(`[FileEventStore] Saved event ${event.eventId} to ${currentSegmentFile}`)
        }
    }

    /**
     * Read all events (Legacy / Debug helper)
     */
    public async getAll(): Promise<QueueEvent[]> {
        const allEvents: QueueEvent[] = []
        const aggregatesRoot = path.join(this.storageDir, 'aggregates')

        if (!fs.existsSync(aggregatesRoot)) return []

        const types = fs.readdirSync(aggregatesRoot)
        for (const type of types) {
            const typePath = path.join(aggregatesRoot, type)
            if (!fs.statSync(typePath).isDirectory()) continue

            const ids = fs.readdirSync(typePath)
            for (const id of ids) {
                const aggPath = path.join(typePath, id)
                if (!fs.statSync(aggPath).isDirectory()) continue

                const files = fs.readdirSync(aggPath).filter(f => f.endsWith('.json'))
                for (const file of files) {
                    try {
                        const data = JSON.parse(fs.readFileSync(path.join(aggPath, file), 'utf-8'))
                        if (Array.isArray(data)) {
                            allEvents.push(...data)
                        }
                    } catch (e) { }
                }
            }
        }

        return allEvents.sort((a, b) => {
            const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0
            const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0
            return tA - tB
        })
    }

    private sanitize(str: string): string {
        return str.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50)
    }
}
