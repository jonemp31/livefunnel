import './SalesText.css'

interface SalesTextProps {
  name?: string
  age?: number
}

export default function SalesText({ name = 'Julia', age = 22 }: SalesTextProps) {
  return (
    <section className="sales-text sales-text--visible">
      <p className="sales-text__paragraph">
        Sou a loirinha safada que você sempre quis. Aqui tem <strong className="sales-text__highlight">putaria explícita, sem censura</strong>, com
        vídeos quentes sozinha e com convidados… Muito sexo, muitas gozadas e zero enrolação.{' '}
        <strong className="sales-text__bold">Entra se tiver coragem</strong> <span className="sales-text__heart">😈🔥</span>{' '}
        {age} anos, <span className="sales-text__city-white">Campinas/SP</span>
      </p>
    </section>
  )
}
