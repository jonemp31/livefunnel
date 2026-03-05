import './ProfileHero.css'

interface ProfileHeroProps {
  imageUrl: string
  name: string
}

export default function ProfileHero({ imageUrl, name }: ProfileHeroProps) {
  return (
    <div className="profile-hero">
      <img
        className="profile-hero__image"
        src={imageUrl}
        alt={`Foto de perfil de ${name}`}
        loading="eager"
        decoding="async"
      />
      <div className="profile-hero__gradient" aria-hidden="true" />
    </div>
  )
}
