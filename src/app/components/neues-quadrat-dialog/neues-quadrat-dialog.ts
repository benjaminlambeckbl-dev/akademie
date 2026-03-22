import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { WertequadratService } from '../../services/wertequadrat.service';
import { KiService, KiFeedbackErgebnis } from '../../services/ki.service';
import { VordefinierterWert } from '../../models/wertequadrat.model';

@Component({
  selector: 'app-neues-quadrat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './neues-quadrat-dialog.html',
  styleUrl: './neues-quadrat-dialog.scss',
})
export class NeuesQuadratDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(WertequadratService);
  private ki = inject(KiService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<NeuesQuadratDialogComponent>);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  ausgewaehlterVordefinierter = signal<VordefinierterWert | null>(null);
  modus = signal<'auswahl' | 'vordef' | 'custom' | 'staerke' | 'werte' | 'konflikt' | 'feedback' | 'innerkonflikt' | 'schatz'>('auswahl');
  kiLaedt = signal(false);
  fragenLaden = signal(false);
  kiAusgefuellt = signal(false);
  staerkeBeschreibung = signal('');
  konfliktBeschreibung = signal('');
  innerkonfliktBeschreibung = signal('');
  feedbackBeschreibung = signal('');
  schatzBeschreibung = signal('');
  feedbackErgebnis = signal<KiFeedbackErgebnis | null>(null);
  feedbackKopiert = signal(false);
  aktuelleHinweise = signal<import('../../models/wertequadrat.model').WertequadratHinweise | null>(null);
  werteSchritt = signal<'liste' | 'entscheidung'>('liste');
  ausgewaehlteWerte = signal<string[]>([]);

  readonly werteliste: { wert: string; emoji: string; beschreibung: string }[] = [
    { wert: 'Geduld',           emoji: '⏳', beschreibung: 'Ruhe bewahren, wenn andere hetzen' },
    { wert: 'Mut',              emoji: '🦁', beschreibung: 'Handeln trotz Unsicherheit' },
    { wert: 'Empathie',         emoji: '💛', beschreibung: 'Sich in andere einfühlen' },
    { wert: 'Ehrlichkeit',      emoji: '🎯', beschreibung: 'Die Wahrheit sagen, auch wenn sie unbequem ist' },
    { wert: 'Zuverlässigkeit',  emoji: '⚓', beschreibung: 'Versprechen halten, für andere da sein' },
    { wert: 'Kreativität',      emoji: '✨', beschreibung: 'Neue Wege und Lösungen finden' },
    { wert: 'Beharrlichkeit',   emoji: '🏔️', beschreibung: 'Dranbleiben, auch wenn es schwer wird' },
    { wert: 'Offenheit',        emoji: '🌿', beschreibung: 'Neues willkommen heißen, neugierig bleiben' },
    { wert: 'Fürsorge',         emoji: '🤝', beschreibung: 'Für andere eintreten und sorgen' },
    { wert: 'Selbstständigkeit',emoji: '🧭', beschreibung: 'Eigene Wege gehen, Verantwortung übernehmen' },
    { wert: 'Fairness',         emoji: '⚖️', beschreibung: 'Gerecht handeln, alle gleich behandeln' },
    { wert: 'Bescheidenheit',   emoji: '🌱', beschreibung: 'Stärke zeigen ohne sich in den Vordergrund zu drängen' },
    { wert: 'Loyalität',        emoji: '🤲', beschreibung: 'Treu bleiben – zu Menschen, die einem wichtig sind' },
    { wert: 'Freiheit',         emoji: '🕊️', beschreibung: 'Selbst bestimmen, eigene Wege wählen' },
    { wert: 'Lebensfreude',     emoji: '🌞', beschreibung: 'Das Leben mit Leichtigkeit genießen' },
    { wert: 'Integrität',       emoji: '🏛️', beschreibung: 'Denken, Sagen und Tun in Übereinstimmung bringen' },
    { wert: 'Gelassenheit',     emoji: '🌊', beschreibung: 'Innere Ruhe bewahren – auch in stürmischen Zeiten' },
    { wert: 'Neugier',          emoji: '🔭', beschreibung: 'Staunen und Wissen-Wollen als Grundhaltung' },
    { wert: 'Großzügigkeit',    emoji: '🎁', beschreibung: 'Geben ohne zu rechnen' },
    { wert: 'Vertrauen',        emoji: '🌟', beschreibung: 'Sich selbst und anderen vertrauen können' },
  ];

  form = this.fb.group({
    kernwert: ['', Validators.required],
    schwestertugend: ['', Validators.required],
    uebertreibungKernwert: ['', Validators.required],
    uebertreibungSchwestertugend: ['', Validators.required],
    beschreibung: [''],
  });

  ngOnInit(): void {
    this.form.get('kernwert')!.valueChanges.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(value => {
      if (this.modus() === 'custom' && !this.kiLaedt() && value && value.trim().length >= 2) {
        this.kiVorschlagen();
      }
    });
  }

  get service_ref() { return this.service; }

  get kernwertValue(): string {
    return this.form.get('kernwert')?.value?.trim() ?? '';
  }

  vordefiniertenAuswaehlen(wert: VordefinierterWert): void {
    this.ausgewaehlterVordefinierter.set(wert);
    this.form.patchValue(wert);
    this.modus.set('vordef');
  }

  customModus(): void {
    this.ausgewaehlterVordefinierter.set(null);
    this.form.reset();
    this.kiAusgefuellt.set(false);
    this.aktuelleHinweise.set(null);
    this.modus.set('custom');
  }

  staerkeModus(): void {
    this.ausgewaehlterVordefinierter.set(null);
    this.form.reset();
    this.kiAusgefuellt.set(false);
    this.aktuelleHinweise.set(null);
    this.staerkeBeschreibung.set('');
    this.modus.set('staerke');
  }

  feedbackModus(): void {
    this.feedbackBeschreibung.set('');
    this.feedbackErgebnis.set(null);
    this.feedbackKopiert.set(false);
    this.modus.set('feedback');
  }

  async feedbackAnalysieren(): Promise<void> {
    const beschreibung = this.feedbackBeschreibung();
    if (!beschreibung.trim()) return;
    this.kiLaedt.set(true);
    this.feedbackErgebnis.set(null);
    try {
      const ergebnis = await this.ki.generiereFeedback(beschreibung);
      this.feedbackErgebnis.set(ergebnis);
    } catch {
      this.snackBar.open('Analyse fehlgeschlagen', 'OK', { duration: 5000 });
    } finally {
      this.kiLaedt.set(false);
    }
  }

  async feedbackKopieren(): Promise<void> {
    const ergebnis = this.feedbackErgebnis();
    if (!ergebnis) return;
    await navigator.clipboard.writeText(ergebnis.feedbackFormulierung);
    this.feedbackKopiert.set(true);
    setTimeout(() => this.feedbackKopiert.set(false), 2500);
  }

  konfliktModus(): void {
    this.ausgewaehlterVordefinierter.set(null);
    this.form.reset();
    this.kiAusgefuellt.set(false);
    this.aktuelleHinweise.set(null);
    this.konfliktBeschreibung.set('');
    this.modus.set('konflikt');
  }

  async konfliktAnalysieren(): Promise<void> {
    const beschreibung = this.konfliktBeschreibung();
    if (!beschreibung.trim()) return;
    this.kiLaedt.set(true);
    this.kiAusgefuellt.set(false);
    try {
      const analyse = await this.ki.analysiereKonflikt(beschreibung);
      this.form.patchValue({
        kernwert: analyse.kernwert,
        schwestertugend: analyse.schwestertugend,
        uebertreibungKernwert: analyse.uebertreibungKernwert,
        uebertreibungSchwestertugend: analyse.uebertreibungSchwestertugend,
        beschreibung: '',
      });
      this.aktuelleHinweise.set(analyse.hinweise);
      this.kiAusgefuellt.set(true);
      this.snackBar.open('Wertequadrat aus dem Konflikt entwickelt', '', { duration: 2500 });
    } catch {
      this.snackBar.open('Analyse fehlgeschlagen', 'OK', { duration: 5000 });
    } finally {
      this.kiLaedt.set(false);
    }
  }

  schatzModus(): void {
    this.ausgewaehlterVordefinierter.set(null);
    this.form.reset();
    this.kiAusgefuellt.set(false);
    this.aktuelleHinweise.set(null);
    this.schatzBeschreibung.set('');
    this.modus.set('schatz');
  }

  async schatzAnalysieren(): Promise<void> {
    const beschreibung = this.schatzBeschreibung();
    if (!beschreibung.trim()) return;
    this.kiLaedt.set(true);
    this.kiAusgefuellt.set(false);
    try {
      const analyse = await this.ki.analysiereVerborgeneStaerke(beschreibung);
      this.form.patchValue({
        kernwert: analyse.kernwert,
        schwestertugend: analyse.schwestertugend,
        uebertreibungKernwert: analyse.uebertreibungKernwert,
        uebertreibungSchwestertugend: analyse.uebertreibungSchwestertugend,
        beschreibung: '',
      });
      this.aktuelleHinweise.set(analyse.hinweise);
      this.kiAusgefuellt.set(true);
      this.snackBar.open('Dein verborgener Schatz wurde sichtbar gemacht!', '', { duration: 2500 });
    } catch {
      this.snackBar.open('Analyse fehlgeschlagen', 'OK', { duration: 5000 });
    } finally {
      this.kiLaedt.set(false);
    }
  }

  innerkonfliktModus(): void {
    this.ausgewaehlterVordefinierter.set(null);
    this.form.reset();
    this.kiAusgefuellt.set(false);
    this.aktuelleHinweise.set(null);
    this.innerkonfliktBeschreibung.set('');
    this.modus.set('innerkonflikt');
  }

  async innerkonfliktAnalysieren(): Promise<void> {
    const beschreibung = this.innerkonfliktBeschreibung();
    if (!beschreibung.trim()) return;
    this.kiLaedt.set(true);
    this.kiAusgefuellt.set(false);
    try {
      const analyse = await this.ki.analysiereInnerenKonflikt(beschreibung);
      this.form.patchValue({
        kernwert: analyse.kernwert,
        schwestertugend: analyse.schwestertugend,
        uebertreibungKernwert: analyse.uebertreibungKernwert,
        uebertreibungSchwestertugend: analyse.uebertreibungSchwestertugend,
        beschreibung: '',
      });
      this.aktuelleHinweise.set(analyse.hinweise);
      this.kiAusgefuellt.set(true);
      this.snackBar.open('Dein inneres Wertequadrat wurde entwickelt', '', { duration: 2500 });
    } catch {
      this.snackBar.open('Analyse fehlgeschlagen', 'OK', { duration: 5000 });
    } finally {
      this.kiLaedt.set(false);
    }
  }

  werteModus(): void {
    this.ausgewaehlterVordefinierter.set(null);
    this.form.reset();
    this.kiAusgefuellt.set(false);
    this.aktuelleHinweise.set(null);
    this.ausgewaehlteWerte.set([]);
    this.werteSchritt.set('liste');
    this.modus.set('werte');
  }

  wertToggle(wert: string): void {
    const aktuell = this.ausgewaehlteWerte();
    if (aktuell.includes(wert)) {
      this.ausgewaehlteWerte.set(aktuell.filter(w => w !== wert));
    } else if (aktuell.length < 3) {
      this.ausgewaehlteWerte.set([...aktuell, wert]);
    }
  }

  werteWeiter(): void {
    if (this.ausgewaehlteWerte().length === 1) {
      this.wertFinal(this.ausgewaehlteWerte()[0]);
    } else {
      this.werteSchritt.set('entscheidung');
    }
  }

  async wertFinal(wert: string): Promise<void> {
    this.kiLaedt.set(true);
    this.kiAusgefuellt.set(false);
    try {
      const analyse = await this.ki.analysiereWert(wert);
      this.form.patchValue({
        kernwert: analyse.kernwert,
        schwestertugend: analyse.schwestertugend,
        uebertreibungKernwert: analyse.uebertreibungKernwert,
        uebertreibungSchwestertugend: analyse.uebertreibungSchwestertugend,
        beschreibung: '',
      });
      this.aktuelleHinweise.set(analyse.hinweise);
      this.kiAusgefuellt.set(true);
      this.snackBar.open('Dein Wertequadrat wurde entwickelt!', '', { duration: 2500 });
    } catch {
      this.snackBar.open('Analyse fehlgeschlagen', 'OK', { duration: 5000 });
    } finally {
      this.kiLaedt.set(false);
    }
  }

  zurueck(): void {
    if (this.modus() === 'werte' && this.werteSchritt() === 'entscheidung') {
      this.werteSchritt.set('liste');
      return;
    }
    if (this.modus() === 'werte' && this.kiAusgefuellt()) {
      this.kiAusgefuellt.set(false);
      this.aktuelleHinweise.set(null);
      this.werteSchritt.set('entscheidung');
      return;
    }
    if ((this.modus() === 'konflikt' || this.modus() === 'innerkonflikt' || this.modus() === 'schatz') && this.kiAusgefuellt()) {
      this.kiAusgefuellt.set(false);
      this.aktuelleHinweise.set(null);
      this.form.reset();
      return;
    }
    if (this.modus() === 'feedback' && this.feedbackErgebnis()) {
      this.feedbackErgebnis.set(null);
      return;
    }
    this.modus.set('auswahl');
    this.form.reset();
    this.kiAusgefuellt.set(false);
    this.aktuelleHinweise.set(null);
    this.ausgewaehlterVordefinierter.set(null);
    this.ausgewaehlteWerte.set([]);
  }

  async kiVorschlagen(): Promise<void> {
    const kernwert = this.kernwertValue;
    if (!kernwert) return;
    this.kiLaedt.set(true);
    this.kiAusgefuellt.set(false);
    try {
      const vorschlag = await this.ki.vorschlagen(kernwert);
      this.form.patchValue({
        schwestertugend: vorschlag.schwestertugend,
        uebertreibungKernwert: vorschlag.uebertreibungKernwert,
        uebertreibungSchwestertugend: vorschlag.uebertreibungSchwestertugend,
        beschreibung: vorschlag.beschreibung,
      });
      this.kiAusgefuellt.set(true);
      this.snackBar.open('KI-Vorschlag erfolgreich generiert', '', { duration: 2000 });
    } catch {
      this.snackBar.open('KI-Vorschlag fehlgeschlagen', 'OK', { duration: 5000 });
    } finally {
      this.kiLaedt.set(false);
    }
  }

  async staerkeAnalysieren(): Promise<void> {
    const beschreibung = this.staerkeBeschreibung();
    if (!beschreibung.trim()) return;
    this.kiLaedt.set(true);
    this.kiAusgefuellt.set(false);
    try {
      const analyse = await this.ki.analysiereStaerke(beschreibung);
      this.form.patchValue({
        kernwert: analyse.kernwert,
        schwestertugend: analyse.schwestertugend,
        uebertreibungKernwert: analyse.uebertreibungKernwert,
        uebertreibungSchwestertugend: analyse.uebertreibungSchwestertugend,
        beschreibung: '',
      });
      this.aktuelleHinweise.set(analyse.hinweise);
      this.kiAusgefuellt.set(true);
      this.snackBar.open('Dein Wertequadrat wurde entwickelt!', '', { duration: 2500 });
    } catch {
      this.snackBar.open('Analyse fehlgeschlagen', 'OK', { duration: 5000 });
    } finally {
      this.kiLaedt.set(false);
    }
  }

  private typFuerModus(): 'staerke' | 'wert' | 'konflikt' | 'innerkonflikt' | 'schatz' | undefined {
    if (this.modus() === 'konflikt') return 'konflikt';
    if (this.modus() === 'innerkonflikt') return 'innerkonflikt';
    if (this.modus() === 'schatz') return 'schatz';
    if (this.modus() === 'staerke' || this.modus() === 'werte') return 'staerke';
    return undefined;
  }

  speichern(): void {
    if (this.form.valid) {
      const val = this.form.value;
      this.service.hinzufuegen({
        kernwert: val.kernwert!,
        schwestertugend: val.schwestertugend!,
        uebertreibungKernwert: val.uebertreibungKernwert!,
        uebertreibungSchwestertugend: val.uebertreibungSchwestertugend!,
        beschreibung: val.beschreibung || undefined,
        hinweise: this.aktuelleHinweise() ?? undefined,
        typ: this.typFuerModus(),
      });
      this.dialogRef.close(true);
    }
  }

  speichernUndWeiteres(): void {
    if (this.form.valid) {
      const val = this.form.value;
      this.service.hinzufuegen({
        kernwert: val.kernwert!,
        schwestertugend: val.schwestertugend!,
        uebertreibungKernwert: val.uebertreibungKernwert!,
        uebertreibungSchwestertugend: val.uebertreibungSchwestertugend!,
        beschreibung: val.beschreibung || undefined,
        hinweise: this.aktuelleHinweise() ?? undefined,
        typ: this.typFuerModus(),
      });
      this.dialogRef.close(false);
      this.dialog.open(NeuesQuadratDialogComponent, { width: '680px', maxHeight: '90vh' });
    }
  }

  async fragenNeuGenerieren(): Promise<void> {
    const val = this.form.value;
    if (!val.kernwert || !val.schwestertugend || !val.uebertreibungKernwert || !val.uebertreibungSchwestertugend) return;
    this.fragenLaden.set(true);
    try {
      const hinweise = await this.ki.generiereHinweise(
        val.kernwert, val.schwestertugend, val.uebertreibungKernwert, val.uebertreibungSchwestertugend
      );
      this.aktuelleHinweise.set(hinweise);
      this.snackBar.open('Reflexionsfragen aktualisiert', '', { duration: 2000 });
    } catch {
      this.snackBar.open('Aktualisierung fehlgeschlagen', 'OK', { duration: 5000 });
    } finally {
      this.fragenLaden.set(false);
    }
  }

  abbrechen(): void {
    this.dialogRef.close(false);
  }

  emojiVonWert(wert: string): string {
    return this.werteliste.find(w => w.wert === wert)?.emoji ?? '';
  }

  kategorienWerte(kat: string): VordefinierterWert[] {
    return this.service.vordefinierteWerte.filter((w) => w.kategorie === kat);
  }
}
