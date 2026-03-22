import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuadratViewComponent } from './components/quadrat-view/quadrat-view';
import { NeuesQuadratDialogComponent } from './components/neues-quadrat-dialog/neues-quadrat-dialog';
import { WertequadratService } from './services/wertequadrat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    QuadratViewComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  private dialog = inject(MatDialog);
  service = inject(WertequadratService);

  neuesQuadrat(): void {
    this.dialog.open(NeuesQuadratDialogComponent, {
      width: '680px',
      maxHeight: '90vh',
      panelClass: 'quadrat-dialog',
    });
  }

  loeschen(id: string): void {
    this.service.entfernen(id);
  }
}
