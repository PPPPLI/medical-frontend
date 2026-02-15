import { Component, computed, signal, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { UserDto } from '../../model/models';
import { UserService } from '../../core/service/userService';
import { Message } from '../../model/constant';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
})
export class LoginComponent implements OnDestroy {

    private sub = new Subscription();

    submitting = signal(false);
    submittedOnce = signal(false);

    serverError = signal<string | null>(null);

    showPassword = signal(false);
    formValid = signal(false);

    form = this.fb.group({
        userEmail: [
            '',
            [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(254),
            ],
        ],
        userPassword: [
            '',
            [
                Validators.required,
                Validators.minLength(6),
                Validators.maxLength(72),
            ],
        ],
        rememberMe: [true],
    });

    constructor(private fb: FormBuilder, private router: Router,private userService:UserService) {

        this.sub.add(
            this.form.statusChanges.subscribe(() => {
                this.formValid.set(this.form.valid);
            })
        );
        this.formValid.set(this.form.valid);

        this.sub.add(
            this.form.valueChanges.subscribe(() => {
                if (this.serverError()) {
                    this.serverError.set(null);
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    private showErr(name: 'userEmail' | 'userPassword') {
        const c = this.form.get(name);
        return !!c && (c.touched || this.submittedOnce()) && c.invalid;
    }

    showEmailError = computed(() => this.showErr('userEmail'));
    showPasswordError = computed(() => this.showErr('userPassword'));

    emailErrorText = computed(() => {
        const c = this.form.get('userEmail');
        if (!c?.errors) return '';
        if (c.errors['required']) return 'Email or username is required.';
        if (c.errors['minlength']) return 'Too short.';
        if (c.errors['maxlength']) return 'Too long.';
        return 'Invalid value.';
    });

    passwordErrorText = computed(() => {
        const c = this.form.get('userPassword');
        if (!c?.errors) return '';
        if (c.errors['required']) return 'Password is required.';
        if (c.errors['minlength']) return 'Password is too short.';
        if (c.errors['maxlength']) return 'Password is too long.';
        return 'Invalid password.';
    });

    canSubmit = computed(() => this.formValid() && !this.submitting());

    send() {

        this.submittedOnce.set(true);
        this.serverError.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);

        const payload = this.form.getRawValue();
        const remember = !!payload.rememberMe;
        
        const user:UserDto = {
            userEmail:payload.userEmail!,
            userPassword:payload.userPassword!
        }

        if (remember) {
            localStorage.setItem('passwd', payload.userPassword!);
        } else {
            localStorage.removeItem('passwd');
        }

        this.userService.login(user)
            .pipe(
                finalize(() => {
                    this.submitting.set(false);
                })
            )
    
            .subscribe({

                next: (response) => {

                    if(response.status === 200){

                        localStorage.setItem('X-User-Token', response.body?.token ?? '');
                        localStorage.setItem('X-User-Role', String(response.body?.userDto.role ?? ''));
                        localStorage.setItem('X-User-Name', response.body?.userDto.userName ?? '');
                        localStorage.setItem('X-User-Email', response.body?.userDto.userEmail ?? '');
                        localStorage.setItem('X-User-Id', String(response.body?.userDto.userId ?? ''));

                        switch(String(response.body?.userDto.role).toUpperCase()){
                            case "ADMIN":
                                this.router.navigateByUrl('/dashboard/admin');
                                break;
                            case "USER":
                                this.router.navigateByUrl('/dashboard/user');
                                break;
                            default:
                                this.router.navigateByUrl('/auth/login');
                        }
                    }
                },

                error: (err) => {
                    
                    if(err.status === 401){
                        this.serverError.set(Message.AUTH_ERROR);
                    }else{

                        this.serverError.set(Message.SERVER_ERROR);
                    }
                }
            });

    }
}
