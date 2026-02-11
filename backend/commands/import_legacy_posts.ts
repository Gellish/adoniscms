import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import Post from '#models/post'
import { DateTime } from 'luxon'

export default class ImportLegacyPosts extends BaseCommand {
  static commandName = 'import:legacy-posts'
  static description = 'Import legacy markdown posts into the database'

  static options: CommandOptions = {}

  async run() {
    const legacyDir = path.join(process.cwd(), '..', 'resources', 'views', 'contents')

    if (!fs.existsSync(legacyDir)) {
      this.logger.error(`Legacy directory not found: ${legacyDir}`)
      return
    }

    const files = fs.readdirSync(legacyDir).filter(f => f.endsWith('.md'))
    this.logger.info(`Found ${files.length} legacy posts.`)

    for (const file of files) {
      const filePath = path.join(legacyDir, file)
      const rawContent = fs.readFileSync(filePath, 'utf-8')

      // Simple frontmatter parser
      const match = rawContent.match(/^---\r?\n([\s\S]+?)\r?\n---/)
      if (!match) {
        this.logger.warning(`Skipping ${file}: No frontmatter found.`)
        continue
      }

      const frontmatter = yaml.load(match[1]) as any
      const body = rawContent.replace(match[0], '').trim()

      try {
        await Post.updateOrCreate(
          { slug: frontmatter.slug || path.basename(file, '.md') },
          {
            title: frontmatter.title || 'Untitled',
            content: body,
            description: frontmatter.description || null,
            tags: JSON.stringify(frontmatter.tags || []),
            publishedAt: frontmatter.date ? DateTime.fromISO(frontmatter.date) : DateTime.now()
          }
        )
        this.logger.success(`Imported/Updated: ${frontmatter.title}`)
      } catch (error: any) {
        this.logger.error(`Failed to import ${file}: ${error.message}`)
      }
    }

    this.logger.info('Migration complete.')
  }
}