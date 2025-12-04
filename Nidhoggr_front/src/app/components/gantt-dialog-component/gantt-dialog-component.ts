import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxGanttModule } from '@worktile/gantt';

@Component({
  selector: 'app-gantt-dialog',
  templateUrl: './gantt-dialog.component.html',
  styleUrls: ['./gantt-dialog.component.scss'],
  imports: [NgxGanttModule],
})
export class GanttDialogComponent {
  items: any[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public points: any[]) {
    this.items = points.map((p) => ({
      id: p.uuid,
      title: `${p.nom} (${p.equipement})`,
      start: new Date(p.datePose),
      end: new Date(p.dateRecuperation),
    }));
  }
}
