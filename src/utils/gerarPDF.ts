import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DadosRelatorio } from '@/services/relatorioService'
import { urlParaDataURL } from '@/services/relatorioService'
import { STATUS_CARGA_LABELS } from '@/constants/status'
import { TIPOS_AVARIA_LABELS } from '@/constants/tipos-avaria'
import { formatarDataHora } from './formatters'

export async function gerarRelatorioPDF(dados: DadosRelatorio) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const { carga, checklist, avarias, fotos, historico } = dados
  const larguraPagina = doc.internal.pageSize.getWidth()
  const margem = 15
  let y = 15

  // Detectar tipo de operação
  const ehCarregamento = carga.tipo_carga === 'carregamento'
  const tipoOperacao = ehCarregamento ? 'Carregamento' : 'Descarregamento'

  // ===== CABEÇALHO =====
  doc.setFillColor(30, 58, 138) // Azul escuro
  doc.rect(0, 0, larguraPagina, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`RELATÓRIO DE ${tipoOperacao.toUpperCase()}`, margem, 15)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Controle de Cargas Portuárias', margem, 22)

  doc.setFontSize(9)
  doc.text(`Gerado em: ${formatarDataHora(new Date().toISOString())}`, margem, 28)

  y = 45

  // ===== DADOS DA OPERAÇÃO =====
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('1. DADOS DA OPERAÇÃO', margem, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Label dinâmico para a data conforme tipo de operação
  const labelData = ehCarregamento ? 'Data de Início:' : 'Data de Recebimento:'

  // ✅ APENAS os campos pertinentes ao formulário simplificado
  const dadosCarga = [
  ['Número da Carga:', carga.numero_carga],
  ['Tipo de Operação:', tipoOperacao],
  ['Status:', STATUS_CARGA_LABELS[carga.status] || carga.status],
  ['Cliente:', carga.cliente_nome || '—'],
  ['Número do Processo:', carga.nota_fiscal || '—'],
  ['Rua / Local:', carga.destino || '—'],
  ['Quantidade de Itens:', String(carga.quantidade_volumes)],
  [labelData, formatarDataHora(carga.data_hora_recebimento)]
]

  autoTable(doc, {
    startY: y,
    head: [],
    body: dadosCarga,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margem, right: margem }
  })

  y = (doc as any).lastAutoTable.finalY + 10

  if (carga.observacoes) {
    doc.setFont('helvetica', 'bold')
    doc.text('Observações:', margem, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    const obsLines = doc.splitTextToSize(carga.observacoes, larguraPagina - 2 * margem)
    doc.text(obsLines, margem, y)
    y += obsLines.length * 5 + 8
  }

  // ===== CHECKLIST =====
  if (checklist.length > 0) {
    if (y > 230) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('2. CHECKLIST DE CONFERÊNCIA', margem, y)
    y += 8

    // ✅ Filtrar "Lacre conferido" se for carregamento (não há lacre em carregamentos)
    const checklistFiltrado = ehCarregamento
      ? checklist.filter(item => item.item !== 'Lacre conferido')
      : checklist

    const checklistData = checklistFiltrado.map(item => {
  const label =
    item.resposta === 'ok' ? '✓ SIM' :
    item.resposta === 'nao_ok' ? '✗ NÃO' : '— Não verificado'
  return [item.item, label, item.observacao || '—']
})

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Resposta', 'Observação']],
      body: checklistData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 'auto' }
      },
      margin: { left: margem, right: margem }
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ===== AVARIAS =====
  if (avarias.length > 0) {
    if (y > 200) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(185, 28, 28) // Vermelho
    doc.text('3. AVARIAS REGISTRADAS', margem, y)
    doc.setTextColor(0, 0, 0)
    y += 8

    avarias.forEach((avaria, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${TIPOS_AVARIA_LABELS[avaria.tipo as keyof typeof TIPOS_AVARIA_LABELS] || avaria.tipo}`, margem, y)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Data: ${formatarDataHora(avaria.data_hora)}`, margem, y)
      y += 4
      doc.text(`Descrição: ${avaria.descricao}`, margem, y)
      y += 4

      if (avaria.observacao) {
        doc.text(`Observação: ${avaria.observacao}`, margem, y)
        y += 4
      }
      y += 3
    })

    y += 5
  }

  // ===== FOTOS =====
  if (fotos.length > 0) {
    if (y > 180) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('4. REGISTRO FOTOGRÁFICO', margem, y)
    y += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de fotos: ${fotos.length}`, margem, y)
    y += 6

    // Agrupar fotos por etapa
    const fotosPorEtapa: Record<string, any[]> = {}
    fotos.forEach(foto => {
      const etapa = foto.etapa || 'outros'
      if (!fotosPorEtapa[etapa]) fotosPorEtapa[etapa] = []
      fotosPorEtapa[etapa].push(foto)
    })

    for (const [etapa, fotosEtapa] of Object.entries(fotosPorEtapa)) {
      if (y > 240) {
        doc.addPage()
        y = 20
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`Etapa: ${etapa.toUpperCase()}`, margem, y)
      y += 6

      // Mostrar até 6 fotos por etapa (2 linhas x 3 colunas)
      const fotosParaMostrar = fotosEtapa.slice(0, 6)
      let col = 0
      let row = 0
      const larguraFoto = 50
      const alturaFoto = 50
      const espacamento = 5

      for (const foto of fotosParaMostrar) {
        if (col >= 3) {
          col = 0
          row++
        }

        if (y + row * (alturaFoto + espacamento) > 270) {
          doc.addPage()
          y = 20
          row = 0
        }

        try {
          const dataURL = await urlParaDataURL(foto.url || '')
          if (dataURL) {
            const xPos = margem + col * (larguraFoto + espacamento)
            const yPos = y + row * (alturaFoto + espacamento)

            doc.addImage(dataURL, 'JPEG', xPos, yPos, larguraFoto, alturaFoto)

            // Legenda
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.text((foto.tipo || 'geral').replace('_', ' '), xPos, yPos + alturaFoto + 4)
          }
        } catch (err) {
          console.warn('Erro ao carregar foto:', err)
        }

        col++
      }

      y += row * (alturaFoto + espacamento) + alturaFoto + 12
    }
  }

  // ===== HISTÓRICO / TIMELINE =====
  if (historico.length > 0) {
    if (y > 220) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('5. TIMELINE / HISTÓRICO', margem, y)
    y += 8

    const historicoData = historico.map(h => [
      formatarDataHora(h.data_hora),
      h.descricao
    ])

    autoTable(doc, {
      startY: y,
      head: [['Data/Hora', 'Evento']],
      body: historicoData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: margem, right: margem }
    })
  }

  // ===== RODAPÉ =====
  const numPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= numPaginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Página ${i} de ${numPaginas} | Relatório gerado automaticamente pelo Sistema de Controle de Cargas`,
      margem,
      290
    )
  }

  // ===== SALVAR =====
  const nomeArquivo = `relatorio_${ehCarregamento ? 'carregamento' : 'descarregamento'}_${carga.numero_carga.replace(/\s+/g, '_')}.pdf`
  doc.save(nomeArquivo)
}