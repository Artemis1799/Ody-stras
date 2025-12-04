import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { GANTT_GLOBAL_CONFIG, NgxGanttModule, GanttViewType } from '@worktile/gantt';

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
        locale: 'en',
      },
    },
  ],
})
export class GanttPopupComponent {
  GanttViewType = GanttViewType;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
