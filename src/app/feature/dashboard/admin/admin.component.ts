import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { finalize} from 'rxjs';
import { UserService } from '../../../core/service/userService';
import { UserDto } from '../../../model/models';

type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT' | string;


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
})
export class AdminDashboard {

  loading = signal(false);
  errorMsg = signal<string>('');

  users = signal<UserDto[]>([]);

  query = signal('');
  showFrozenOnly = signal(false);

  private toggling = signal<Record<string, boolean>>({});

  filteredUsers = computed(() => {
    const q = this.query().trim().toLowerCase();
    const frozenOnly = this.showFrozenOnly();

    return this.users()
      .filter(u => (frozenOnly ? u.enabled : true))
      .filter(u => {
        if (!q) return true;
        return (
          u.userName!.toLowerCase().includes(q) ||
          u.userEmail!.toLowerCase().includes(q)
        );
      });
  });

  constructor(private userService: UserService) {
    void this.reload();
  }

  reload() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.userService.getAllUsers()
    .pipe(finalize(() => this.loading.set(false)))
    
    .subscribe({

         next: res => {

            if(res.status === 200){

                this.users.set(res.body ?? []);
            }
         },

         error: err => {

            this.errorMsg.set('Failed to load users.');
            this.users.set([]);
         }
    });
  }

  isToggling(userId: string): boolean {
    return !!this.toggling()[userId];
  }

  private setToggling(userId: string, v: boolean) {
    this.toggling.set({ ...this.toggling(), [userId]: v });
  }

  toggleFreeze(u: UserDto) {
    this.setToggling(u.userId!, true);
    this.errorMsg.set('');
    if(u.enabled) {

        this.freezeActionText(u.userId!);
    }else{

        this.activateActionText(u.userId!);
    }
  }

  activateActionText(id:string){

    this.userService.activateUser(id)
      .pipe(finalize(() => this.setToggling(id, false)))
      .subscribe({
            next: res => {
                if(res.status === 204){
                    this.reload();
                }
            },

            error: err => {
                this.errorMsg.set('Failed to update user status.');
            }
      });
  }

  freezeActionText(id:string){

    this.userService.freezeUser(id)
      .pipe(finalize(() => this.setToggling(id, false)))
      .subscribe({

            next: res => {

                if(res.status === 204){

                    this.reload();
                }
            },

            error: err => {

                this.errorMsg.set('Failed to update user status.');
            }

      });

  }

  initials(username: string): string {
    const s = (username ?? '').trim();
    if (!s) return 'U';
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
