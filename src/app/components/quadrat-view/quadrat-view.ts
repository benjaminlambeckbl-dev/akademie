import { Component, Input, Output, EventEmitter, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Wertequadrat, WertequadratHinweise } from '../../models/wertequadrat.model';
import { PdfExportService } from '../../services/pdf-export.service';
import { KiService } from '../../services/ki.service';
import { WertequadratService } from '../../services/wertequadrat.service';

@Component({
  selector: 'app-quadrat-view',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './quadrat-view.html',
  styleUrl: './quadrat-view.scss',
})
export class QuadratViewComponent {
  @Input({ required: true }) quadrat!: Wertequadrat;
  @Input() showDeleteButton = true;
  @Output() loeschen = new EventEmitter<string>();

  private el = inject(ElementRef);
  private pdfExport = inject(PdfExportService);
  private ki = inject(KiService);
  private wertequadratService = inject(WertequadratService);
  private snackBar = inject(MatSnackBar);

  exportLaedt = signal(false);
  kartenLaden = signal<Record<string, boolean>>({});

  async exportAlsPdf(): Promise<void> {
    this.exportLaedt.set(true);
    try {
      const wrapper = (this.el.nativeElement.querySelector('.quadrat-wrapper') ?? this.el.nativeElement) as HTMLElement;
      await this.pdfExport.exportQuadrat(wrapper, this.quadrat);
    } catch (err) {
      console.error('PDF Export fehlgeschlagen:', err);
      alert('PDF-Export fehlgeschlagen: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      this.exportLaedt.set(false);
    }
  }

  async karteNeuGenerieren(karte: 'bestaerkung' | 'uebertreibung' | 'entwicklung' | 'triggerhinweis'): Promise<void> {
    const q = this.quadrat;
    this.kartenLaden.update(m => ({ ...m, [karte]: true }));
    try {
      const neu = await this.ki.generiereHinweise(
        q.kernwert, q.schwestertugend, q.uebertreibungKernwert, q.uebertreibungSchwestertugend
      );
      const aktuell: WertequadratHinweise = {
        ...(q.hinweise ?? { bestaerkung: '', uebertreibung: '', entwicklung: '', triggerhinweis: '' }),
        [karte]: neu[karte],
      };
      this.wertequadratService.hinweisAktualisieren(q.id, aktuell);
    } catch {
      this.snackBar.open('Karte konnte nicht neu generiert werden', 'OK', { duration: 3000 });
    } finally {
      this.kartenLaden.update(m => ({ ...m, [karte]: false }));
    }
  }
}
