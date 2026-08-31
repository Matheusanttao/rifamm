import { jsPDF } from 'jspdf'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumbersList,
  paymentStatusLabel,
} from './format'
import { formatCpf } from './cpf'
import { paymentMethodLabel } from './orders'

const COLORS = {
  cream: [251, 246, 239] as [number, number, number],
  white: [255, 253, 251] as [number, number, number],
  rose: [165, 99, 103] as [number, number, number],
  roseDeep: [143, 85, 89] as [number, number, number],
  text: [70, 58, 52] as [number, number, number],
  muted: [140, 123, 112] as [number, number, number],
  border: [236, 224, 210] as [number, number, number],
  gold: [188, 152, 95] as [number, number, number],
}

function setFill(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}

function setStroke(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
}

function setText(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

export function downloadOrderPdf(order: Order, settings: SiteSettings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16

  setFill(doc, COLORS.cream)
  doc.rect(0, 0, pageW, 297, 'F')

  setFill(doc, COLORS.roseDeep)
  doc.roundedRect(margin, 14, pageW - margin * 2, 28, 4, 4, 'F')
  setText(doc, [255, 255, 255])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(settings.titulo_site || 'Rifa do Chá de Panela', pageW / 2, 26, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(settings.subtitulo_site || 'Matheus & Melissa', pageW / 2, 34, { align: 'center' })

  let y = 54
  setFill(doc, COLORS.white)
  setStroke(doc, COLORS.border)
  doc.roundedRect(margin, y, pageW - margin * 2, 38, 3, 3, 'FD')

  setText(doc, COLORS.rose)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('COMPROVANTE DO PEDIDO', margin + 8, y + 10)

  setText(doc, COLORS.text)
  doc.setFontSize(18)
  doc.text(order.codigo, margin + 8, y + 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setText(doc, COLORS.muted)
  doc.text(paymentStatusLabel(order.status_pagamento), margin + 8, y + 28)
  doc.text(`Gerado em ${formatDateTime(new Date().toISOString())}`, margin + 8, y + 34)

  y = 102
  const rows: Array<[string, string]> = [
    ['Participante', order.participante_nome],
    ['E-mail', order.participante_email],
    ['CPF', order.participante_cpf ? formatCpf(order.participante_cpf) : '—'],
    ['Telefone', order.participante_telefone || '—'],
    ['Método', paymentMethodLabel(order.metodo_pagamento)],
    ['Números', formatNumbersList(order.numeros)],
    ['Quantidade', String(order.numeros.length)],
    ['Valor total', formatCurrency(order.valor_total)],
    ['Criado em', formatDateTime(order.created_at)],
  ]

  if (order.pago_em) rows.push(['Pago em', formatDateTime(order.pago_em)])
  if (settings.data_sorteio) rows.push(['Sorteio', formatDate(settings.data_sorteio)])

  setFill(doc, COLORS.white)
  setStroke(doc, COLORS.border)
  const boxH = 12 + rows.length * 9
  doc.roundedRect(margin, y, pageW - margin * 2, boxH, 3, 3, 'FD')

  let rowY = y + 10
  rows.forEach(([label, value], index) => {
    setText(doc, COLORS.muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(label.toUpperCase(), margin + 8, rowY)

    setText(doc, COLORS.text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(value, pageW - margin * 2 - 16)
    doc.text(lines, margin + 8, rowY + 5)
    rowY += Math.max(9, lines.length * 5 + 4)

    if (index < rows.length - 1) {
      setStroke(doc, COLORS.border)
      doc.setLineWidth(0.2)
      doc.line(margin + 8, rowY - 3, pageW - margin - 8, rowY - 3)
    }
  })

  y = rowY + 10
  setFill(doc, COLORS.rose)
  doc.roundedRect(margin, y, pageW - margin * 2, 24, 3, 3, 'F')
  setText(doc, [255, 255, 255])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Obrigado por apoiar nosso chá!', pageW / 2, y + 10, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(settings.assinatura_casal?.replace(/♡/g, '').trim() || 'Matheus & Melissa', pageW / 2, y + 18, {
    align: 'center',
  })

  doc.save(`pedido-${order.codigo}.pdf`)
}
