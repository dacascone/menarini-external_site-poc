/* eslint-disable no-console */
import { jwtDecode } from 'jwt-decode'

const TOKEN_KEYS = Object.freeze(['access_token', 'sf_access_token'])

const COUNTRY_ALIAS_TO_CODE = Object.freeze({
  UK: 'UK',
  GB: 'UK',
  'UNITED KINGDOM': 'UK',
  'GREAT BRITAIN': 'UK',
  ENGLAND: 'UK',
  DE: 'DE',
  GERMANY: 'DE',
  DEUTSCHLAND: 'DE',
  TH: 'TH',
  THAILAND: 'TH',
  VT: 'VT',
  VN: 'VT',
  VIETNAM: 'VT',
  'VIET NAM': 'VT',
  HK: 'HK',
  'HONG KONG': 'HK',
  'HONG KONG SAR CHINA': 'HK'
})

const normalizeCountry = (value) => String(value || '').trim().toUpperCase()
const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

export const getDecodedJwtPayload = () => {
  const decodedAttempts = TOKEN_KEYS
    .map((tokenKey) => ({ tokenKey, token: localStorage.getItem(tokenKey) }))
    .filter(({ token }) => Boolean(token))
    .map(({ tokenKey, token }) => {
      try {
        return { payload: jwtDecode(token), tokenKey }
      } catch (error) {
        console.warn(`[CIAM] Token ${tokenKey} non decodificabile`, error)
        return { payload: null, tokenKey }
      }
    })

  const validPayload = decodedAttempts.find(({ payload }) => Boolean(payload))
  return validPayload ? validPayload.payload : null
}

export const extractCountryFromPayload = (payload) => {
  if (!payload) return ''
  return payload.address?.country || payload.country || payload.countryCode || payload.country_code || ''
}

export const resolveCountryCode = (rawCountry) => {
  const normalized = normalizeCountry(rawCountry)
  if (!normalized) return ''
  return COUNTRY_ALIAS_TO_CODE[normalized] || normalized
}

export const extractEmailFromPayload = (payload) => {
  if (!payload) return ''
  return normalizeEmail(payload.email || payload.preferred_username || payload.upn || '')
}
