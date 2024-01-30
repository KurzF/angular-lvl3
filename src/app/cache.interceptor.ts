import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { MonoTypeOperatorFunction, Observable, of} from "rxjs";
import { tap } from "rxjs/operators";

interface Cache<T> {
    expire: Date,
    data: HttpResponse<T>,
}

export const HTTP_CACHE_DURATION_TOKEN = new InjectionToken<number>('Duration of the cache in seconds');

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
    static CACHE_KEY = "HTTP_CACHE";
    cache = new Map<string, Cache<any>>();

    // Duration of the cache in seconds, default is 2 hours
    duration = inject(HTTP_CACHE_DURATION_TOKEN) || 7200;

    constructor() {
        let localCache = localStorage.getItem(CacheInterceptor.CACHE_KEY);
        if(localCache != null) {
            this.cache = new Map(Object.entries(JSON.parse(localCache)));
        }
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Cache only get
        if(req.method !== "GET") {
            return next.handle(req);
        }
        let cached = this.cache.get(JSON.stringify(req));

        if(cached !== undefined && cached!.expire > new Date()) {
            console.log(`Cache hit ${req.url}`);
            return of(cached!.data).pipe();
        } else {
            return next.handle(req).pipe(this.cacheResponse(req));
        }
    }

    cacheResponse<T>(req: HttpRequest<any>): MonoTypeOperatorFunction<HttpEvent<any>> {
        return tap(event => {
            if(event instanceof HttpResponse) {
                // Ignore response with browser cache support
                if(event.headers.get('Cache-Control')) { return; }

                let expire = new Date();
                expire.setSeconds(expire.getSeconds() + this.duration);
                this.cache.set(JSON.stringify(req), {
                    expire,
                    data: event
                });
                console.log(`cache ${req.url}`);
                localStorage.setItem(CacheInterceptor.CACHE_KEY, JSON.stringify(this.cache))
            }
        })
    }
}


