import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Login } from '../models/login';
import { IsAuthorized } from '../models/is-authorized';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient) { }

  public login(data: Login): Observable<any> {
    return this.http.post('/api/login', data);
  }

  public isAuthorized(): Observable<boolean> {
    return this.http.get('/api/isAuthorized')
      // In passport we use session, which is same for all tabs,
      // So for distinguish user in different tabs use sessionStorage
      .pipe(map((res: IsAuthorized) => sessionStorage.getItem('username') && !!res.authorized));
  }
}
