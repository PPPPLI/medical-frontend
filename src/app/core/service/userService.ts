import { Injectable } from "@angular/core";
import { environment } from "../../../environement/environement";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { UserDto, AuthUserResponse } from "../../model/models";
import { Observable} from "rxjs";

@Injectable({
    providedIn:"root"
})
export class UserService{

    baseUrl:string = environment.apiUrl;
    serviceUrl:string = "/usr";
    header:HttpHeaders = new HttpHeaders({
        "Content-Type":"application/json"
    })

    public constructor(private httpclient:HttpClient){}

    login(user:UserDto):Observable<HttpResponse<AuthUserResponse>>{

        return this.httpclient.post<AuthUserResponse>(this.baseUrl+this.serviceUrl+"/login",user,{observe:"response",headers:this.header});
    }

    register(user:UserDto):Observable<HttpResponse<void>>{

        return this.httpclient.post<void>(this.baseUrl+this.serviceUrl+"/register",user,{observe:"response",headers:this.header});
    }

    getAllUsers():Observable<HttpResponse<UserDto[]>>{

        return this.httpclient.get<UserDto[]>(this.baseUrl+this.serviceUrl+"/get/all",{observe:"response",headers:this.header});
    }

    freezeUser(userId:string):Observable<HttpResponse<void>>{

        return this.httpclient.delete<void>(this.baseUrl+this.serviceUrl+"/delete/"+userId, {observe:"response",headers:this.header});
    }

    activateUser(userId:string):Observable<HttpResponse<void>>{

        const user:UserDto = {
            userId:userId
        }

        return this.httpclient.patch<void>(this.baseUrl+this.serviceUrl+"/update",JSON.stringify(user), {observe:"response",headers:this.header});
    }
}