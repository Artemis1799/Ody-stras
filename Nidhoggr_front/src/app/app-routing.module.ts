import { Routes } from "@angular/router";

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'home',
                //providers: [HomeResolver],
            },
        ]
    }
];

export const routesLang: Routes = [
    {
        path: '', 
        redirectTo: 'en', 
        pathMatch: 'full',
    }, 
    {
        path: 'en', 
        children: [...routes],
    }, 
    {
        path: 'fr', 
        children: [...routes],
    }
];