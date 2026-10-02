import { describe, expect, it } from 'vitest'
import { redactSensitiveXml } from '../../app/lib/text/redactSensitiveXml'

describe('redactSensitiveXml', () => {
  it('masks CPR and person name elements while preserving XML structure', () => {
    const xml = '<LINE><SERV_REC_NO>0101901234</SERV_REC_NO><PERSON_NAME>Test Person</PERSON_NAME><GL_ACCOUNT>1234</GL_ACCOUNT></LINE>'

    expect(redactSensitiveXml(xml)).toBe(
      '<LINE><SERV_REC_NO>[REDACTED]</SERV_REC_NO><PERSON_NAME>[REDACTED]</PERSON_NAME><GL_ACCOUNT>1234</GL_ACCOUNT></LINE>',
    )
  })

  it('masks namespace-prefixed and alternate sensitive element names', () => {
    const xml = '<n:RESPONSE><n:CPR_NO>0101901234</n:CPR_NO><NAME>Test Person</NAME></n:RESPONSE>'

    expect(redactSensitiveXml(xml)).toBe(
      '<n:RESPONSE><n:CPR_NO>[REDACTED]</n:CPR_NO><NAME>[REDACTED]</NAME></n:RESPONSE>',
    )
  })
})