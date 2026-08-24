export { ROLES, SUBS, SHARED, FAQ_COMMON } from './constants'

import * as brokerAyam        from './broker_ayam'
import * as brokerTelur       from './broker_telur'
import * as brokerSembako     from './broker_sembako'
import * as peternakAyam      from './peternak_ayam'
import * as peternakSapi      from './peternak_sapi'
import * as peternakKambingDomba from './peternak_kambing_domba'
import * as rpa               from './rpa'

// Hero for sapi_perah exists only for the disabled tab placeholder
const sapiPerahHero = {
  eyebrow: 'Solusi Peternak Sapi Perah',
  headline: 'Tingkatkan Produksi Susu Harian & Manajemen Laktasi.',
  sub: 'Pencatatan susu harian, siklus IB, kesehatan sapi laktasi dan histori pedet.',
  cta: 'Mulai Kelola Sapi Perah',
}

export const GROUPS = {
  broker_ayam:        brokerAyam.groups,
  broker_telur:       brokerTelur.groups,
  broker_sembako:     brokerSembako.groups,
  peternak_ayam:      peternakAyam.groups,
  peternak_sapi_potong: peternakSapi.groups,
  peternak_kambing_domba: peternakKambingDomba.groups,
  rpa:                rpa.groups,
}

export const HERO_CONTENT = {
  broker_ayam:        brokerAyam.hero,
  broker_telur:       brokerTelur.hero,
  broker_sembako:     brokerSembako.hero,
  peternak_ayam:      peternakAyam.hero,
  peternak_sapi_potong: peternakSapi.hero,
  peternak_sapi_perah: sapiPerahHero,
  peternak_kambing_domba: peternakKambingDomba.hero,
  rpa:                rpa.hero,
}

export const BEFORE_AFTER = {
  broker_ayam:        brokerAyam.beforeAfter,
  broker_telur:       brokerTelur.beforeAfter,
  broker_sembako:     brokerSembako.beforeAfter,
  peternak_ayam:      peternakAyam.beforeAfter,
  peternak_sapi_potong: peternakSapi.beforeAfter,
  peternak_kambing_domba: peternakKambingDomba.beforeAfter,
  rpa:                rpa.beforeAfter,
}

export const FAQ_ROLE = {
  broker_ayam:        brokerAyam.faq,
  broker_telur:       brokerTelur.faq,
  broker_sembako:     brokerSembako.faq,
  peternak_ayam:      peternakAyam.faq,
  peternak_sapi_potong: peternakSapi.faq,
  peternak_kambing_domba: peternakKambingDomba.faq,
  rpa:                rpa.faq,
}
