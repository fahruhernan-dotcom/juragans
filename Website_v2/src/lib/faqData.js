/**
 * faqData.js — thin wrapper that aggregates FAQ modules.
 * Actual FAQ content lives in src/lib/faq/*.js for maintainability.
 *
 * Categories:
 *   umum               — Umum & Branding (25)
 *   broker_ayam        — Solusi Broker Ayam (40)
 *   broker_telur       — Solusi Broker Telur (20)
 *   sembako            — Solusi Agen Sembako (40)
 *   peternak_ayam      — Peternak Ayam Broiler (20)
 *   peternak_ruminansia— Peternak Sapi, Kambing & Domba (30)
 *   teknis             — Teknis, Keamanan & Langganan (55)
 */

import { umum } from './faq/umum.js'
import { broker_ayam } from './faq/broker_ayam.js'
import { broker_telur } from './faq/broker_telur.js'
import { sembako } from './faq/sembako.js'
import { peternak_ayam } from './faq/peternak_ayam.js'
import { peternak_ruminansia } from './faq/peternak_ruminansia.js'
import { teknis } from './faq/teknis.js'

export const FAQ_CATEGORIES = [
  { id: 'umum',                label: 'Umum & Branding',                  icon: '/logo.png',                                       count: umum.length },
  { id: 'broker_ayam',         label: 'Solusi Broker Ayam',               icon: '/assets/icons/models/role_broker.png',            count: broker_ayam.length },
  { id: 'broker_telur',        label: 'Solusi Broker Telur',              icon: '/assets/icons/models/broker_telur.png',           count: broker_telur.length },
  { id: 'sembako',             label: 'Solusi Agen Sembako',              icon: '/assets/icons/models/distributor_sembako.png',    count: sembako.length },
  { id: 'peternak_ayam',       label: 'Peternak Ayam Broiler',            icon: '/assets/icons/models/role_peternak.png',          count: peternak_ayam.length },
  { id: 'peternak_ruminansia', label: 'Peternak Sapi, Kambing & Domba',   icon: '/assets/icons/models/role_peternak.png',          count: peternak_ruminansia.length },
  { id: 'teknis',              label: 'Teknis, Keamanan & Langganan',     icon: '/logo.png',                                       count: teknis.length },
]

export const FAQ_DATA = {
  umum,
  broker_ayam,
  broker_telur,
  sembako,
  peternak_ayam,
  peternak_ruminansia,
  teknis,
}

/**
 * Returns flat array of all FAQ items for a given category,
 * formatted for JSON-LD schema injection.
 */
export function getFAQForSchema(categoryId) {
  const items = FAQ_DATA[categoryId] ?? []
  return items.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  }))
}

/**
 * Returns all FAQs across all categories as flat array for full-page schema.
 */
export function getAllFAQForSchema() {
  return Object.values(FAQ_DATA).flat().map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  }))
}
