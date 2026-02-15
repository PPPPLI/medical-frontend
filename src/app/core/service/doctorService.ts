import { Injectable } from "@angular/core";
import { environment } from "../../../environement/environement";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { AppointmentDto, DoctorDto } from "../../model/models";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class DoctorService {

    baseUrl:string = environment.apiUrl;
    serviceUrl:string = "/doc";
    appServiceUrl:string = "/ap";
    header:HttpHeaders = new HttpHeaders({
        "Content-Type":"application/json"
    })

    public constructor(private httpclient:HttpClient){}

    getAllDoctors():Observable<HttpResponse<DoctorDto>>{

        return this.httpclient.get<DoctorDto>(this.baseUrl+this.serviceUrl+"/get/all",{observe:"response",headers:this.header});
    }

    getAppointmentSlots(startDate:string,endDate:string):Observable<HttpResponse<AppointmentDto[]>>{

        const params = new HttpParams()
        .set("startAt", startDate)
        .set("endAt", endDate)

        return this.httpclient.get<AppointmentDto[]>(this.baseUrl+this.appServiceUrl+"/get/date",{
            observe:"response",
            headers:this.header,
            params:params
        });
    }

    getAppointmentByPatient(patientId:string):Observable<HttpResponse<AppointmentDto[]>>{

        return this.httpclient.get<AppointmentDto[]>(this.baseUrl+this.appServiceUrl+"/get/"+patientId,{
            observe:"response",
            headers:this.header
        });
    }

    addAppointment(appointment:AppointmentDto):Observable<HttpResponse<AppointmentDto>>{

        return this.httpclient.post<AppointmentDto>(this.baseUrl+this.appServiceUrl+"/add",appointment,{
            observe:"response",
            headers:this.header
        });
    }

    cancelAppointment(appointmentId:string):Observable<HttpResponse<void>>{

        return this.httpclient.delete<void>(this.baseUrl+this.appServiceUrl+"/delete/"+appointmentId,{
            observe:"response",
            headers:this.header
        });
    }

}