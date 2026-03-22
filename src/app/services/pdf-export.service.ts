import { Injectable } from '@angular/core';
import { Wertequadrat } from '../models/wertequadrat.model';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  async exportQuadrat(element: HTMLElement, quadrat: Wertequadrat): Promise<void> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (_clonedDoc, clonedElement) => {
        // Angular Material v21 uses oklch()/color() functions that html2canvas 1.4 can't parse.
        // Remove only those <style> blocks from the cloned document.
        const root = clonedElement.ownerDocument;
        Array.from(root.querySelectorAll('style')).forEach(style => {
          if (style.textContent?.match(/oklch\(|color\(display-p3/)) {
            style.remove();
          }
        });
      },
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 16;
    const contentW = pageW - margin * 2;

    // Header-Balken
    pdf.setFillColor(42, 98, 143); // #2a628f
    pdf.rect(0, 0, pageW, 18, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Werte- und Entwicklungsquadrat', margin, 12);

    // Typ-Badge
    if (quadrat.typ) {
      const typLabels: Record<string, string> = {
        staerke: 'Stärke',
        wert: 'Wert',
        konflikt: 'Konfliktberatung',
        innerkonflikt: 'Innerer Konflikt',
        schatz: 'Verborgene Stärke',
      };
      const label = typLabels[quadrat.typ] ?? quadrat.typ;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(label, pageW - margin, 12, { align: 'right' });
    }

    // Datum
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const datum = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    pdf.text(datum, pageW - margin, 26, { align: 'right' });

    // Titel (Kernwert)
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(quadrat.kernwert, margin, 28);

    // Beschreibung
    let y = 34;
    if (quadrat.beschreibung) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text(quadrat.beschreibung, margin, y, { maxWidth: contentW });
      y += 7;
    }

    // Quadrat-Grid als Bild
    const imgData = canvas.toDataURL('image/png');
    const imgAspect = canvas.height / canvas.width;
    const imgW = contentW;
    const imgH = imgW * imgAspect;
    pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH);
    y += imgH + 8;

    // Reflexionsfragen
    if (quadrat.hinweise) {
      const h = quadrat.hinweise;
      const isKonflikt = quadrat.typ === 'konflikt';
      const isInner = quadrat.typ === 'innerkonflikt';

      // Abschnittstitel
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, y, contentW, 7, 'F');
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reflexionsfragen', margin + 3, y + 5);
      y += 10;

      const fragen: { icon: string; titel: string; text: string; r: number; g: number; b: number }[] = [
        {
          icon: '💚',
          titel: isKonflikt ? 'Positiver Kern im Verhalten' : isInner ? 'Beide Seiten sind berechtigt' : 'Was hat dir das schon gebracht?',
          text: h.bestaerkung,
          r: 46, g: 125, b: 50,
        },
        {
          icon: '⚠️',
          titel: isKonflikt ? 'Was verrät meine Reaktion über mich?' : isInner ? 'Wenn eine Seite die Überhand gewinnt' : 'Dein Frühwarnsystem',
          text: h.uebertreibung,
          r: 230, g: 81, b: 0,
        },
        {
          icon: '🌱',
          titel: isKonflikt ? 'Meine eigene Entwicklungschance' : isInner ? 'Die Spannung halten statt auflösen' : `Mehr ${quadrat.schwestertugend} zulassen`,
          text: h.entwicklung,
          r: 21, g: 101, b: 192,
        },
        {
          icon: '🔄',
          titel: isKonflikt ? 'Meine eigene Beteiligung' : isInner ? 'Wann kippt das Gleichgewicht?' : 'Mit dem Gegenextrem umgehen',
          text: h.triggerhinweis,
          r: 136, g: 14, b: 79,
        },
      ];

      pdf.setFontSize(8.5);
      for (const frage of fragen) {
        if (y > pageH - 30) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(frage.r, frage.g, frage.b);
        pdf.text(frage.titel, margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(frage.text, contentW - 4);
        pdf.text(lines, margin + 2, y);
        y += lines.length * 4.5 + 4;
      }

      // Wahrnehmungsauftrag
      if (h.wahrnehmungsauftrag) {
        if (y > pageH - 40) { pdf.addPage(); y = 20; }
        pdf.setFillColor(232, 245, 233);
        const wahrLines = pdf.splitTextToSize(h.wahrnehmungsauftrag, contentW - 10);
        const boxH = wahrLines.length * 4.5 + 12;
        pdf.roundedRect(margin, y, contentW, boxH, 3, 3, 'F');
        pdf.setTextColor(46, 125, 50);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text('🔭  Wahrnehmungsauftrag für die nächste Woche', margin + 4, y + 6);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        pdf.text(wahrLines, margin + 4, y + 11);
        y += boxH + 6;
      }
    }

    // Footer
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, pageH - 10, pageW, 10, 'F');
    pdf.setTextColor(160, 160, 160);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Wertequadrat-App · nach Schulz von Thun', margin, pageH - 4);
    pdf.text(`Seite 1`, pageW - margin, pageH - 4, { align: 'right' });

    const dateiname = `wertequadrat-${quadrat.kernwert.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    pdf.save(dateiname);
  }
}
