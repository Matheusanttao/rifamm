import ExcelJS from 'exceljs'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { formatCpf } from './cpf'
import { formatCurrency, formatDateTime, formatNumbersList, paymentStatusLabel } from './format'
import { paymentMethodLabel } from './orders'

const ROSE = 'A56367'
const ROSE_DEEP = '8F5559'
const CREAM = 'FBF6EF'
const TEXT = '463A34'
const MUTED = '8C7B70'
const WHITE = 'FFFFFF'
const BORDER = 'ECE0D2'
const GREEN = '2F6B4F'
const GREEN_BG = 'E8F5EE'
const AMBER_BG = 'FFF4E5'
const RED_BG = 'FCE8E8'
const GRAY_BG = 'F3F1EE'

function statusFill(status: Order['status_pagamento']): string {
  if (status === 'aprovado') return GREEN_BG
  if (status === 'aguardando') return AMBER_BG
  if (status === 'expirado' || status === 'recusado' || status === 'cancelado') return RED_BG
  return GRAY_BG
}

function statusFont(status: Order['status_pagamento']): string {
  if (status === 'aprovado') return GREEN
  if (status === 'aguardando') return '9A6700'
  if (status === 'expirado' || status === 'recusado' || status === 'cancelado') return 'B42318'
  return MUTED
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: `FF${BORDER}` } }
  return { top: edge, left: edge, bottom: edge, right: edge }
}

export type ExportOrdersOptions = {
  onlyApproved?: boolean
}

export async function downloadOrdersExcel(
  orders: Order[],
  settings: SiteSettings,
  options: ExportOrdersOptions = {},
) {
  const filtered = options.onlyApproved
    ? orders.filter((o) => o.status_pagamento === 'aprovado')
    : [...orders]

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Rifamm'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Participantes', {
    views: [{ state: 'frozen', ySplit: 5 }],
    properties: { defaultRowHeight: 20 },
  })

  sheet.columns = [
    { key: 'codigo', width: 14 },
    { key: 'nome', width: 28 },
    { key: 'email', width: 32 },
    { key: 'telefone', width: 18 },
    { key: 'cpf', width: 16 },
    { key: 'numeros', width: 28 },
    { key: 'qtd', width: 8 },
    { key: 'valor', width: 12 },
    { key: 'metodo', width: 12 },
    { key: 'status', width: 22 },
    { key: 'criado', width: 20 },
    { key: 'pago', width: 20 },
  ]

  // Title row
  sheet.mergeCells('A1:L1')
  const title = sheet.getCell('A1')
  title.value = settings.titulo_site || 'Rifa do Chá de Casa Nova'
  title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: `FF${WHITE}` } }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ROSE_DEEP}` } }
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  sheet.getRow(1).height = 32

  // Subtitle
  sheet.mergeCells('A2:L2')
  const subtitle = sheet.getCell('A2')
  subtitle.value = `${settings.subtitulo_site || 'Matheus & Melissa'}  ·  Exportado em ${formatDateTime(new Date().toISOString())}`
  subtitle.font = { name: 'Calibri', size: 11, color: { argb: `FF${ROSE_DEEP}` } }
  subtitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CREAM}` } }
  subtitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  sheet.getRow(2).height = 22

  // Summary
  const approved = sorted.filter((o) => o.status_pagamento === 'aprovado')
  const totalApprovedValue = approved.reduce((sum, o) => sum + Number(o.valor_total || 0), 0)
  const totalNumbers = approved.reduce((sum, o) => sum + (o.numeros?.length || 0), 0)

  sheet.mergeCells('A3:L3')
  const summary = sheet.getCell('A3')
  summary.value = options.onlyApproved
    ? `Compradores confirmados: ${approved.length}  ·  Números vendidos: ${totalNumbers}  ·  Total arrecadado: ${formatCurrency(totalApprovedValue)}`
    : `Total de pedidos: ${sorted.length}  ·  Aprovados: ${approved.length}  ·  Números vendidos: ${totalNumbers}  ·  Total aprovado: ${formatCurrency(totalApprovedValue)}`
  summary.font = { name: 'Calibri', size: 10, color: { argb: `FF${TEXT}` } }
  summary.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CREAM}` } }
  summary.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  sheet.getRow(3).height = 20

  // Spacer
  sheet.getRow(4).height = 8

  // Headers
  const headers = [
    'Código',
    'Nome',
    'E-mail',
    'Telefone',
    'CPF',
    'Números',
    'Qtd',
    'Valor',
    'Método',
    'Status',
    'Criado em',
    'Pago em',
  ]
  const headerRow = sheet.getRow(5)
  headers.forEach((label, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = label
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: `FF${WHITE}` } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ROSE}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  headerRow.height = 24

  sorted.forEach((order, index) => {
    const row = sheet.getRow(6 + index)
    const values = [
      order.codigo,
      order.participante_nome,
      order.participante_email,
      order.participante_telefone || '—',
      order.participante_cpf ? formatCpf(order.participante_cpf) : '—',
      formatNumbersList(order.numeros || []),
      order.numeros?.length || 0,
      Number(order.valor_total || 0),
      paymentMethodLabel(order.metodo_pagamento),
      paymentStatusLabel(order.status_pagamento),
      formatDateTime(order.created_at),
      order.pago_em ? formatDateTime(order.pago_em) : '—',
    ]

    values.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1)
      cell.value = value
      cell.font = { name: 'Calibri', size: 10, color: { argb: `FF${TEXT}` } }
      cell.border = thinBorder()
      cell.alignment = {
        vertical: 'middle',
        horizontal: colIndex === 6 || colIndex === 7 ? 'center' : 'left',
        wrapText: colIndex === 5,
      }

      if (index % 2 === 1 && colIndex !== 9) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CREAM}` } }
      }

      if (colIndex === 7) {
        cell.numFmt = '"R$" #,##0.00'
      }

      if (colIndex === 9) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: `FF${statusFill(order.status_pagamento)}` },
        }
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: `FF${statusFont(order.status_pagamento)}` },
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
    })

    row.height = Math.max(22, Math.ceil((order.numeros?.length || 1) / 8) * 16)
  })

  // Totals row for approved-only or always show approved total
  const totalRowIndex = 6 + sorted.length
  sheet.mergeCells(`A${totalRowIndex}:F${totalRowIndex}`)
  const totalLabel = sheet.getCell(`A${totalRowIndex}`)
  totalLabel.value = 'TOTAL (pedidos aprovados)'
  totalLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: `FF${WHITE}` } }
  totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ROSE_DEEP}` } }
  totalLabel.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }

  const totalQty = sheet.getCell(`G${totalRowIndex}`)
  totalQty.value = totalNumbers
  totalQty.font = { name: 'Calibri', size: 11, bold: true, color: { argb: `FF${WHITE}` } }
  totalQty.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ROSE_DEEP}` } }
  totalQty.alignment = { vertical: 'middle', horizontal: 'center' }

  const totalValue = sheet.getCell(`H${totalRowIndex}`)
  totalValue.value = totalApprovedValue
  totalValue.numFmt = '"R$" #,##0.00'
  totalValue.font = { name: 'Calibri', size: 11, bold: true, color: { argb: `FF${WHITE}` } }
  totalValue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ROSE_DEEP}` } }
  totalValue.alignment = { vertical: 'middle', horizontal: 'center' }

  for (const col of ['I', 'J', 'K', 'L']) {
    const cell = sheet.getCell(`${col}${totalRowIndex}`)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ROSE_DEEP}` } }
  }

  sheet.getRow(totalRowIndex).height = 24

  // Second sheet: one row per number sold (only approved)
  const numbersSheet = workbook.addWorksheet('Números vendidos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  numbersSheet.columns = [
    { header: 'Número', key: 'numero', width: 10 },
    { header: 'Código do pedido', key: 'codigo', width: 14 },
    { header: 'Nome', key: 'nome', width: 28 },
    { header: 'E-mail', key: 'email', width: 32 },
    { header: 'Telefone', key: 'telefone', width: 18 },
    { header: 'CPF', key: 'cpf', width: 16 },
    { header: 'Valor do pedido', key: 'valor', width: 14 },
    { header: 'Pago em', key: 'pago', width: 20 },
  ]

  const numHeader = numbersSheet.getRow(1)
  numHeader.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: `FF${WHITE}` } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ROSE}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder()
  })
  numHeader.height = 24

  const numberRows = approved
    .flatMap((order) =>
      [...(order.numeros || [])]
        .sort((a, b) => a - b)
        .map((numero) => ({
          numero: String(numero).padStart(3, '0'),
          codigo: order.codigo,
          nome: order.participante_nome,
          email: order.participante_email,
          telefone: order.participante_telefone || '—',
          cpf: order.participante_cpf ? formatCpf(order.participante_cpf) : '—',
          valor: Number(order.valor_total || 0),
          pago: order.pago_em ? formatDateTime(order.pago_em) : '—',
        })),
    )
    .sort((a, b) => Number(a.numero) - Number(b.numero))

  numberRows.forEach((item, index) => {
    const row = numbersSheet.addRow(item)
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: `FF${TEXT}` } }
      cell.border = thinBorder()
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 || colNumber === 7 ? 'center' : 'left' }
      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CREAM}` } }
      }
      if (colNumber === 7) cell.numFmt = '"R$" #,##0.00'
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const stamp = new Date().toISOString().slice(0, 10)
  const suffix = options.onlyApproved ? 'aprovados' : 'todos'
  const filename = `rifa-participantes-${suffix}-${stamp}.xlsx`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
