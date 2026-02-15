import { Component } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { UserState } from "../../state/UserState";


@Component({

    selector:"app-header",
    standalone:true,
    imports: [RouterLink,RouterLinkActive],
    templateUrl:"./header.component.html",
    styleUrl: "./header.component.scss"
})
export class HeaderComponent{

    role:string="";
    name:string ="";

    public constructor(public userState:UserState, private router:Router){

        this.role = localStorage.getItem("X-User-Role")?.toLowerCase() || "";
        this.name = localStorage.getItem("X-User-Name") || "";
    }

    logout(){

        localStorage.removeItem("X-User-Token");
        this.userState.setUserState({role:"",token:"",name:""});
        this.router.navigateByUrl("/auth/login");
    }
}