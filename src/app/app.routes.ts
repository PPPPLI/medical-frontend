import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { adminGuard, authGuard, userGuard } from './core/guard/auth.guard';
import { MainPageComponent } from './layout/main-page/main-page.component';
import { AdminDashboard } from './feature/dashboard/admin/admin.component';
import { UserDashboard } from './feature/dashboard/user/user.component';

export const routes: Routes = [
    {path:"auth",component:AuthComponent,children:[
        { path: "", redirectTo: "login", pathMatch: "full" },
        {path:"login", component:LoginComponent},
        {path:"register",component:RegisterComponent}
    ]},
    {
        path: 'dashboard',
        component: MainPageComponent,
        children: [
            { path: 'admin', canActivate: [authGuard, adminGuard], component: AdminDashboard },
            {path:"user",canActivate:[authGuard,userGuard],component:UserDashboard},
        ]
    },
    {path:"",redirectTo:"dashboard",pathMatch:"full"}
];
