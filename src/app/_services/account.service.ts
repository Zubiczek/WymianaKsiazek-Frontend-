import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Account } from '../_models/account';
import { Router } from '@angular/router';

const baseUrl = environment.apiUrl + "/auth";

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private accountSubject: BehaviorSubject<Account>;
  public account: Observable<Account>;

  constructor(private http: HttpClient, private router: Router) {
    this.accountSubject = new BehaviorSubject<Account>(JSON.parse(localStorage.getItem('user')));
    this.account = this.accountSubject.asObservable();
   }

   public get accountValue(): Account {
     return this.accountSubject.value;
   }

   private refreshTokenTimeout;

   private startRefreshTokenTimer() {

       // set a timeout to refresh the token a minute before it expires
       const timeout = this.accountValue.expires.getDate() - Date.now() - (60 * 1000);
       this.refreshTokenTimeout = setTimeout(() => this.refreshToken(this.accountValue.refreshToken).subscribe(), timeout);
   }

   refreshToken(token: string) {
    return this.http.post<any>(`${baseUrl}/refresh-token`, {token})
        .pipe(map((account) => {
            this.accountSubject.next(account);
            this.startRefreshTokenTimer();
            return account;
        }));
}

   login(email: string, password:string) {
     return this.http.post<any>(`${baseUrl}/login`, {email, password})
     .pipe(map(account => {
        this.accountSubject.next(account);
        localStorage.setItem('user', JSON.stringify(account));
        this.startRefreshTokenTimer();
        return account;
     }));
   }

   register(account: Account) {
    return this.http.post<any>(`${baseUrl}/register`, account);
   }

   facebookLogin(accessToken: string) {
    return this.http.post<any>(`${baseUrl}/login/facebook`, {accessToken})
     .pipe(map(account => {
        this.accountSubject.next(account);
        localStorage.setItem('user', JSON.stringify(account));
        this.startRefreshTokenTimer();
        return account;
     }));
   }

   googleLogin(token: string) {
     return this.http.post<any>(`${baseUrl}/login/google`, {token})
     .pipe(map(account => {
      this.accountSubject.next(account);
      localStorage.setItem('user', JSON.stringify(account));
      this.startRefreshTokenTimer();
      return account;
    }));
   }

   verifyEmail(token: string) {
    return this.http.post(`${baseUrl}/verify-email`, { token });
}

   forgotPassword(email: string) {
    return this.http.post(`${baseUrl}/forgot-password`, { email });
   }

   resetPassword(password: string, token: string) {
    return this.http.post(`${baseUrl}/reset-password`, {token, password});
   }
}
