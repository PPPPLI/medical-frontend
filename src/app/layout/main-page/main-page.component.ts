import { Component } from "@angular/core";
import { HeaderComponent } from "../header/header.component";
import { Router, RouterOutlet } from "@angular/router";

@Component({
    selector:"app-main-page",
    standalone:true,
    imports: [HeaderComponent,RouterOutlet],
    templateUrl: "./main-page.component.html",
    styleUrl:"./main-page.component.scss"
})
export class MainPageComponent{

    public constructor(private router:Router){

        const role = localStorage.getItem("X-User-Role")?.toLowerCase();
        
        if(role !== undefined){
            
            this.router.navigateByUrl("/dashboard/"+role);
        }else{

            this.clearTokenAndRedirect();
        }

    }

    clearTokenAndRedirect(){

        localStorage.removeItem("X-User-Token");
        localStorage.removeItem("X-User-Role");
        localStorage.removeItem("X-User-Name");
        this.router.navigateByUrl("login");
    }

}