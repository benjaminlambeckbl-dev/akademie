import { Injectable, signal } from '@angular/core';
import { Wertequadrat, VordefinierterWert } from '../models/wertequadrat.model';

@Injectable({ providedIn: 'root' })
export class WertequadratService {
  private readonly STORAGE_KEY = 'wertequadrate';

  quadrate = signal<Wertequadrat[]>(this.laden());

  readonly vordefinierteWerte: VordefinierterWert[] = [
    {
      kernwert: 'Sparsamkeit',
      schwestertugend: 'Großzügigkeit',
      uebertreibungKernwert: 'Geiz',
      uebertreibungSchwestertugend: 'Verschwendung',
      beschreibung: 'Das Gleichgewicht zwischen Sparen und Geben',
      kategorie: 'Umgang mit Ressourcen',
    },
    {
      kernwert: 'Mut',
      schwestertugend: 'Besonnenheit',
      uebertreibungKernwert: 'Leichtsinn',
      uebertreibungSchwestertugend: 'Feigheit',
      beschreibung: 'Zwischen Wagen und Überlegen',
      kategorie: 'Handlungsorientierung',
    },
    {
      kernwert: 'Direktheit',
      schwestertugend: 'Taktgefühl',
      uebertreibungKernwert: 'Rücksichtslosigkeit',
      uebertreibungSchwestertugend: 'Ausweichen',
      beschreibung: 'Ehrlichkeit mit Feingefühl verbinden',
      kategorie: 'Kommunikation',
    },
    {
      kernwert: 'Selbstvertrauen',
      schwestertugend: 'Bescheidenheit',
      uebertreibungKernwert: 'Arroganz',
      uebertreibungSchwestertugend: 'Selbstzweifel',
      beschreibung: 'Stärke und Demut in Balance',
      kategorie: 'Persönlichkeit',
    },
    {
      kernwert: 'Ordnung',
      schwestertugend: 'Flexibilität',
      uebertreibungKernwert: 'Pedanterie',
      uebertreibungSchwestertugend: 'Chaos',
      beschreibung: 'Struktur ohne Starrheit',
      kategorie: 'Arbeitsweise',
    },
    {
      kernwert: 'Sorgfalt',
      schwestertugend: 'Spontaneität',
      uebertreibungKernwert: 'Perfektionismus',
      uebertreibungSchwestertugend: 'Nachlässigkeit',
      beschreibung: 'Gründlichkeit und Leichtigkeit vereinen',
      kategorie: 'Arbeitsweise',
    },
    {
      kernwert: 'Empathie',
      schwestertugend: 'Abgrenzung',
      uebertreibungKernwert: 'Selbstaufopferung',
      uebertreibungSchwestertugend: 'Kälte',
      beschreibung: 'Mitgefühl mit gesunden Grenzen',
      kategorie: 'Soziales',
    },
    {
      kernwert: 'Durchsetzungsvermögen',
      schwestertugend: 'Kooperationsbereitschaft',
      uebertreibungKernwert: 'Dominanz',
      uebertreibungSchwestertugend: 'Unterwürfigkeit',
      beschreibung: 'Stärke und Teamgeist verbinden',
      kategorie: 'Führung',
    },
    {
      kernwert: 'Eigenverantwortung',
      schwestertugend: 'Teamgeist',
      uebertreibungKernwert: 'Eigensinn',
      uebertreibungSchwestertugend: 'Abhängigkeit',
      beschreibung: 'Selbstständigkeit im Miteinander',
      kategorie: 'Soziales',
    },
    {
      kernwert: 'Kritikfähigkeit',
      schwestertugend: 'Wohlwollen',
      uebertreibungKernwert: 'Nörgelei',
      uebertreibungSchwestertugend: 'Schönreden',
      beschreibung: 'Ehrliche Rückmeldung mit Wertschätzung',
      kategorie: 'Kommunikation',
    },
    {
      kernwert: 'Ausdauer',
      schwestertugend: 'Loslassen',
      uebertreibungKernwert: 'Sturheit',
      uebertreibungSchwestertugend: 'Aufgeben',
      beschreibung: 'Beharrlichkeit ohne Verbissenheit',
      kategorie: 'Handlungsorientierung',
    },
    {
      kernwert: 'Fürsorge',
      schwestertugend: 'Eigenständigkeit fördern',
      uebertreibungKernwert: 'Bevormundung',
      uebertreibungSchwestertugend: 'Gleichgültigkeit',
      beschreibung: 'Helfen ohne zu kontrollieren',
      kategorie: 'Führung',
    },
  ];

  get kategorien(): string[] {
    return [...new Set(this.vordefinierteWerte.map((w) => w.kategorie))];
  }

  hinzufuegen(quadrat: Omit<Wertequadrat, 'id'>): void {
    const neu: Wertequadrat = {
      ...quadrat,
      id: crypto.randomUUID(),
      farbe: this.zufallsFarbe(),
    };
    this.quadrate.update((q) => [neu, ...q]);
    this.speichern();
  }

  entfernen(id: string): void {
    this.quadrate.update((q) => q.filter((item) => item.id !== id));
    this.speichern();
  }

  hinweisAktualisieren(id: string, hinweise: Wertequadrat['hinweise']): void {
    this.quadrate.update((q) => q.map((item) => item.id === id ? { ...item, hinweise } : item));
    this.speichern();
  }

  private zufallsFarbe(): string {
    const farben = ['#1976d2', '#388e3c', '#7b1fa2', '#f57c00', '#c62828', '#00796b'];
    return farben[Math.floor(Math.random() * farben.length)];
  }

  private speichern(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.quadrate()));
  }

  private laden(): Wertequadrat[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
