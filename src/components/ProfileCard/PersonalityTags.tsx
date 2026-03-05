import type { PersonalityTag } from '../../types'
import './PersonalityTags.css'

interface PersonalityTagsProps {
  tags: PersonalityTag[]
}

export default function PersonalityTags({ tags }: PersonalityTagsProps) {
  if (!tags.length) return null

  return (
    <section className="personality-tags">
      <h2 className="personality-tags__title">
        <span className="personality-tags__icon" aria-hidden="true">🏷</span>
        Tags De Personalidade.
      </h2>
      <div className="personality-tags__list" role="list">
        {tags.map((tag, index) => (
          <span
            key={tag.id}
            className="personality-tags__chip"
            role="listitem"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {tag.emoji && <span className="personality-tags__emoji">{tag.emoji}</span>}
            {tag.label}
          </span>
        ))}
      </div>
    </section>
  )
}
