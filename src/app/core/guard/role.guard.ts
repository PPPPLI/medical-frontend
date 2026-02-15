import { Injectable } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

@Injectable({
    "providedIn":"root"
})
export class RoleCheck{

    public constructor(private router:Router){}


}

export const roleGuard: CanActivateFn = (route, state) => {
  return true;
};
