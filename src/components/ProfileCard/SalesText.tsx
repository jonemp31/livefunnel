import { useState, useEffect } from 'react'
import './SalesText.css'

interface SalesTextProps {
  name?: string
  age?: number
}

async function fetchCity(): Promise<string> {
  // 1) Cloudflare trace — works on any CF-proxied domain
  try {
    const res = await fetch('/cdn-cgi/trace')
    if (res.ok) {
      const text = await res.text()
      const ip = text.match(/ip=(.+)/)?.[1]
      if (ip) {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`)
        if (geoRes.ok) {
          const data = await geoRes.json()
          if (data.city && data.region_code) {
            const stateAbbr = getStateAbbr(data.region) || data.region_code
            return `${data.city}/${stateAbbr}`
          }
        }
      }
    }
  } catch {
    // Fallback silently
  }

  // 2) ipapi.co direct
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const data = await res.json()
      if (data.city && data.region_code) {
        const stateAbbr = getStateAbbr(data.region) || data.region_code
        return `${data.city}/${stateAbbr}`
      }
    }
  } catch {
    // Fallback silently
  }

  // 3) ip-api.com (HTTP, localhost only)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=city,regionName')
    if (res.ok) {
      const data = await res.json()
      if (data.city && data.regionName) {
        const stateAbbr = getStateAbbr(data.regionName) || data.regionName
        return `${data.city}/${stateAbbr}`
      }
    }
  } catch {
    // Final fallback
  }

  return 'Campinas/SP'
}

function getStateAbbr(stateName: string): string | null {
  const states: Record<string, string> = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF',
    'Espírito Santo': 'ES', 'Goiás': 'GO', 'Maranhão': 'MA',
    'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
    'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE',
    'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR',
    'Santa Catarina': 'SC', 'São Paulo': 'SP', 'Sergipe': 'SE',
    'Tocantins': 'TO',
    // English variants
    'Sao Paulo': 'SP', 'Espirito Santo': 'ES', 'Goias': 'GO',
    'Maranhao': 'MA', 'Ceara': 'CE', 'Amapa': 'AP', 'Piaui': 'PI',
    'Paraiba': 'PB', 'Rondonia': 'RO', 'Para': 'PA',
  }
  return states[stateName] || null
}

export default function SalesText({ name = 'Julia', age = 22 }: SalesTextProps) {
  const [city, setCity] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchCity().then((c) => {
      setCity(c)
      setLoaded(true)
    })
  }, [])

  return (
    <section className={`sales-text ${loaded ? 'sales-text--visible' : ''}`}>
      <p className="sales-text__paragraph">
        Sou a loirinha safada que você sempre quis. Aqui tem <strong className="sales-text__highlight">putaria explícita, sem censura</strong>, com
        vídeos quentes sozinha e com convidados… Muito sexo, muitas gozadas e zero enrolação.{' '}
        <strong className="sales-text__bold">Entra se tiver coragem</strong> <span className="sales-text__heart">😈🔥</span>{' '}
        {age} anos, <span className="sales-text__city-white">{city || '...'}</span>
      </p>
    </section>
  )
}
