import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NgxGanttModule, GanttViewType, GANTT_GLOBAL_CONFIG } from '@worktile/gantt';

@Component({
  selector: 'app-gantt-popup',
  standalone: true,
  templateUrl: './gantt-popup.component.html',
  styleUrls: ['./gantt-popup.component.scss'],
  imports: [MatDialogModule, NgxGanttModule],
  providers: [
    {
      provide: GANTT_GLOBAL_CONFIG,
      useValue: {
        theme: 'default',
        locale: 'fr',
      },
    },
  ],
})
export class GanttPopupComponent {
  GanttViewType = GanttViewType;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
