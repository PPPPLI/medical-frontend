import { computed, Injectable, signal } from "@angular/core";

@Injectable({
    providedIn:"root"
})
export class UserState{

  userRole = signal({ role: '', token: '', name: '' });

  role = computed(() => this.userRole().role);
  name = computed(() => this.userRole().name);

  public constructor(){

    const userRole = localStorage.getItem("X-User-Role");
    const userName = localStorage.getItem("X-User-Name");

    if(userName !== null && userRole !== null){
        this.userRole.set({name:userName,role:userRole,token:""})
    }
  }

  setUserState(user:{role:string,token:string,name:string}){
    this.userRole.set(user);
  }
}