import { Component, computed, signal, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UserDto } from '../../model/models';
import { UserService } from '../../core/service/userService';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
})
export class RegisterComponent implements OnDestroy {

    private sub = new Subscription();

    submitting = signal(false);
    submittedOnce = signal(false);
    serverError = signal<string | null>(null);
    showPassword = signal(false);

    passwordValue = signal('');
    formValid = signal(false);

    form = this.fb.group({
        userName: [
            '',
            [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(20),
                Validators.pattern(/^[a-zA-Z0-9_]+$/),
            ],
        ],
        userEmail: [
            '',
            [
                Validators.required,
                Validators.email,
                Validators.maxLength(254),
            ],
        ],
        userPassword: [
            '',
            [
                Validators.required,
                Validators.minLength(8),
                Validators.maxLength(72),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
            ],
        ],
    });

    constructor(private fb: FormBuilder, private router: Router,private userService:UserService) {

        this.sub.add(
            this.form.statusChanges.subscribe(() => {
                this.formValid.set(this.form.valid);
            })
        );

        this.formValid.set(this.form.valid);

        const pwdCtrl = this.form.get('userPassword');
        if (pwdCtrl) {
            this.sub.add(
                pwdCtrl.valueChanges.subscribe(v => this.passwordValue.set(v ?? ''))
            );
            this.passwordValue.set(pwdCtrl.value ?? '');
        }

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

    private showErr(name: 'userName' | 'userEmail' | 'userPassword') {
        const c = this.form.get(name);
        return !!c && (c.touched || this.submittedOnce()) && c.invalid;
    }

    showUserNameError = computed(() => this.showErr('userName'));
    showEmailError = computed(() => this.showErr('userEmail'));
    showPasswordError = computed(() => this.showErr('userPassword'));

    userNameErrorText = computed(() => {
        const c = this.form.get('userName');
        if (!c?.errors) return '';
        if (c.errors['required']) return 'Username is required.';
        if (c.errors['minlength']) return 'Min 3 characters.';
        if (c.errors['maxlength']) return 'Max 20 characters.';
        if (c.errors['pattern']) return 'Letters/numbers/_ only.';
        return 'Invalid username.';
    });

    emailErrorText = computed(() => {
        const c = this.form.get('userEmail');
        if (!c?.errors) return '';
        if (c.errors['required']) return 'Email is required.';
        if (c.errors['email']) return 'Invalid email format.';
        if (c.errors['maxlength']) return 'Email is too long.';
        return 'Invalid email.';
    });

    passwordErrorText = computed(() => {
        const c = this.form.get('userPassword');
        if (!c?.errors) return '';
        if (c.errors['required']) return 'Password is required.';
        if (c.errors['minlength']) return 'Min 8 characters.';
        if (c.errors['maxlength']) return 'Too long.';
        if (c.errors['pattern']) return 'Need uppercase, lowercase, number.';
        return 'Invalid password.';
    });

    passwordStrengthLabel = computed(() => {
        const p = this.passwordValue();
        let score = 0;

        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[a-z]/.test(p)) score++;
        if (/\d/.test(p)) score++;
        if (p.length >= 12) score++;

        if (score <= 1) return 'Weak';
        if (score === 2) return 'Fair';
        if (score === 3) return 'Good';
        if (score === 4) return 'Strong';
        return 'Very strong';
    });

    strengthValue = computed(() => {
        const s = this.passwordStrengthLabel();
        if (s === 'Weak') return 20;
        if (s === 'Fair') return 40;
        if (s === 'Good') return 60;
        if (s === 'Strong') return 80;
        return 100;
    });

    strengthClass = computed(() => {
        const s = this.passwordStrengthLabel();
        if (s === 'Weak') return 'progress-error';
        if (s === 'Fair') return 'progress-warning';
        if (s === 'Good') return 'progress-info';
        return 'progress-success';
    });

    strengthTextClass = computed(() => {
        const s = this.passwordStrengthLabel();
        if (s === 'Weak') return 'text-error';
        if (s === 'Fair') return 'text-warning';
        if (s === 'Good') return 'text-info';
        return 'text-success';
    });

    canSubmit = computed(() => this.formValid() && !this.submitting());

    send() {

        this.submittedOnce.set(true);
        this.serverError.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const payload = this.form.getRawValue();

        this.submitting.set(true);

        const user: UserDto = {
            userName: payload.userName!,
            userEmail: payload.userEmail!,
            userPassword: payload.userPassword!,
        }

        this.userService.register(user)
            .pipe(
                finalize(() => {
                    this.submitting.set(false);
                })
            )
            .subscribe({
                next: (response) => {
                    if (response.status === 204) {

                        console.log(response.body+" Registration successful");
                        this.router.navigateByUrl('/auth/login');
                    }
                },
                error: (err) => {
                    if (err.status === 400) {
                        this.serverError.set('Email or username already in use.');
                    } else {
                        this.serverError.set('Register failed. Please try again.');
                    }
                }
            });
    }
}
