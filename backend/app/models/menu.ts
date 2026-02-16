import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Menu extends BaseModel {
    @column({ isPrimary: true })
    declare id: string

    @column()
    declare name: string

    @column()
    declare order: number

    @column()
    declare items: string // JSON storage

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
