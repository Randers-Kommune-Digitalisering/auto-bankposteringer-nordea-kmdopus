import { defineEventHandler } from 'h3'
import env from '~/lib/env/env'

export default defineEventHandler(() => {
  return {
    allowIndividualGroupedProcessing: env.OPEN_ITEMS_ALLOW_GROUP_MEMBER_PROCESSING,
  }
})
