import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate({ email: 'admin@devcms.com' }, {
      fullName: 'Admin User',
      email: 'admin@devcms.com',
      password: 'password', // Hooks will hash this
      role: 'admin'
    })
  }
}