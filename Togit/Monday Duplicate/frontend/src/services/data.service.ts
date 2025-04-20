import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DataService {
    public sharedText: string = '';
    public interview: string = '';
    public job: string = '';
    public summary: string = '';
}
