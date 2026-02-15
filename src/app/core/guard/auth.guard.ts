import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PermissionService {

    role:string = "";
    constructor(private router: Router) {}

    checkToken(): true | UrlTree {
        const token = localStorage.getItem('X-User-Token');
        if (!token) return this.router.parseUrl('/auth/login');
        return true;
    }

    checkRole(checkRole:string){

        this.role = (localStorage.getItem('X-User-Role') || '').toUpperCase();
        
        if (this.role === checkRole) {
            return true;
        }else{
            this.router.navigateByUrl("/dashboard");
            return false;
        }
    }

}

export const authGuard: CanActivateFn = () => {
      return inject(PermissionService).checkToken();
};

export const adminGuard: CanActivateFn = () => {
     return inject(PermissionService).checkRole("ADMIN");
};

export const userGuard: CanActivateFn = () => {
     return inject(PermissionService).checkRole("USER");
};


