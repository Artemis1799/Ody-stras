import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Team } from '../../models/teamModel';
import { Member } from '../../models/memberModel';

export interface TeamFormData {
  team: Partial<Team>;
  selectedMembers: Member[];
}

@Component({
  selector: 'app-team-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-popup.html',
  styleUrl: './team-popup.scss'
})
export class TeamPopupComponent {
  @Input() isEditing = false;
  @Input() team: Partial<Team> = {};
  @Input() allMembers: Member[] = [];
  @Input() selectedMembers: Member[] = [];
  
  get sortedMembers(): Member[] {
    return [...this.allMembers].sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, 'fr');
      return firstNameCompare !== 0 ? firstNameCompare : a.name.localeCompare(b.name, 'fr');
    });
  }
  
  @Output() selectedMembersChange = new EventEmitter<Member[]>();
  @Output() save = new EventEmitter<TeamFormData>();
  @Output() close = new EventEmitter<void>();

  isMemberSelected(member: Member): boolean {
    return this.selectedMembers.some(m => m.uuid === member.uuid);
  }

  toggleMember(member: Member): void {
    if (this.isMemberSelected(member)) {
      this.selectedMembers = this.selectedMembers.filter(m => m.uuid !== member.uuid);
    } else {
      this.selectedMembers = [...this.selectedMembers, member];
    }
    this.selectedMembersChange.emit(this.selectedMembers);
  }

  onSave(): void {
    if (this.team.teamName?.trim()) {
      this.save.emit({
        team: { ...this.team },
        selectedMembers: [...this.selectedMembers]
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
