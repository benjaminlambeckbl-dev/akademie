export interface WertequadratHinweise {
  bestaerkung: string;
  uebertreibung: string;
  entwicklung: string;
  triggerhinweis: string;
  wahrnehmungsauftrag?: string;
}

export interface Wertequadrat {
  id: string;
  kernwert: string;
  schwestertugend: string;
  uebertreibungKernwert: string;
  uebertreibungSchwestertugend: string;
  beschreibung?: string;
  hinweise?: WertequadratHinweise;
  farbe?: string;
  typ?: 'staerke' | 'wert' | 'konflikt' | 'innerkonflikt' | 'schatz';
}

export interface VordefinierterWert {
  kernwert: string;
  schwestertugend: string;
  uebertreibungKernwert: string;
  uebertreibungSchwestertugend: string;
  beschreibung: string;
  kategorie: string;
}
