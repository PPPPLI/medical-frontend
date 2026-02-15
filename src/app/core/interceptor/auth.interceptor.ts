import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export function tokenAddInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {

    const token = localStorage.getItem("X-User-Token")
    if(token != null){

        const newReq = req.clone({

            headers:req.headers.set('Authorization', `Bearer ${token.replaceAll('"',"")}`)
        })

        return next(newReq)
    }

    return next(req)

}