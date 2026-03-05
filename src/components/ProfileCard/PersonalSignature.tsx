import './PersonalSignature.css'

interface PersonalSignatureProps {
  text: string
}

export default function PersonalSignature({ text }: PersonalSignatureProps) {
  return (
    <section className="personal-signature">
      <h2 className="personal-signature__title">
        <span className="personal-signature__icon" aria-hidden="true">✏️</span>
        Assinatura Pessoal
      </h2>
      <p className="personal-signature__text">{text}</p>
    </section>
  )
}
