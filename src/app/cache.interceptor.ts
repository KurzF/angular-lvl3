import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { MonoTypeOperatorFunction, Observable, of} from "rxjs";
import { take, tap } from "rxjs/operators";

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
            let entries: [string, any][] = JSON.parse(localCache);
            let typedEntries = entries.map(([url, cache]) => [url, {
                expire: cache.expire,
                data: new HttpResponse<any>(cache.data)
            }] as [string, Cache<any>]);
            this.cache = new Map(typedEntries);
        }
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // Cache only get
        if(req.method !== "GET") {
            return next.handle(req);
        }
        let cached = this.cache.get(req.url);

        if(cached !== undefined && new Date(cached!.expire) > new Date()) {
            return of(cached.data);
        } else {
            return next.handle(req).pipe(this.cacheResponse(req));
        }
    }

    cacheResponse<T>(req: HttpRequest<any>): MonoTypeOperatorFunction<HttpEvent<any>> {
        return tap(event => {
            if(event instanceof HttpResponse) {
                // Ignore response with browser cache support
                if(event.headers.get('Cache-Control')) { return; }
                
                // Don't cache error
                if(!event.ok) { return; }
                
                let expire = new Date();
                expire.setSeconds(expire.getSeconds() + this.duration);
                this.cache.set(req.url, {
                    expire,
                    data: event
                });

                localStorage.setItem(CacheInterceptor.CACHE_KEY, JSON.stringify(Array.from(this.cache.entries())))
            }
        })
    }
}


