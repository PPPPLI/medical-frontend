import { Component } from "@angular/core";
import { UserService } from "../core/service/userService";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";


@Component({

    selector:"auth-page",
    standalone:true,
    templateUrl:"./auth.component.html",
    styleUrl:"./auth.component.scss",
    imports: [RouterLink,RouterLinkActive,RouterOutlet],
    providers: [UserService]
})
export class AuthComponent{

}