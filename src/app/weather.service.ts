import {Injectable, OnDestroy, OnInit, Signal, inject, signal} from '@angular/core';
import {Observable, forkJoin, zip} from 'rxjs';

import {HttpClient} from '@angular/common/http';
import {CurrentConditions} from './current-conditions/current-conditions.type';
import {ConditionsAndZip} from './conditions-and-zip.type';
import {Forecast} from './forecasts-list/forecast.type';
import { LocationService } from './location.service';
import { map, publish } from 'rxjs/operators';

@Injectable()
export class WeatherService  implements OnDestroy {

  static URL = 'http://api.openweathermap.org/data/2.5';
  static APPID = '5a4b2d457ecbef9eb2a71e480b947604';
  static ICON_URL = 'https://raw.githubusercontent.com/udacity/Sunshine-Version-2/sunshine_master/app/src/main/res/drawable-hdpi/';
  currentConditions = signal<ConditionsAndZip[]>([]);

  locationService = inject(LocationService);
  locationSubscription = this.locationService.locations()
      .subscribe(ls => this.updateConditions(ls));

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.locationSubscription.unsubscribe();
  }

  getCurrentConditions(): Signal<ConditionsAndZip[]> {
    console.log(this.currentConditions);
    return this.currentConditions.asReadonly();
  }

  getCurrentCondition(zipcode: string): Observable<CurrentConditions> {
    return this.http.get<CurrentConditions>(`${WeatherService.URL}/weather?zip=${zipcode},us&units=imperial&APPID=${WeatherService.APPID}`)
  }

  getForecast(zipcode: string): Observable<Forecast> {
    // Here we make a request to get the forecast data from the API. Note the use of backticks and an expression to insert the zipcode
    return this.http.get<Forecast>(`${WeatherService.URL}/forecast/daily?zip=${zipcode},us&units=imperial&cnt=5&APPID=${WeatherService.APPID}`);
  }

  getWeatherIcon(id): string {
    if (id >= 200 && id <= 232)
      return WeatherService.ICON_URL + "art_storm.png";
    else if (id >= 501 && id <= 511)
      return WeatherService.ICON_URL + "art_rain.png";
    else if (id === 500 || (id >= 520 && id <= 531))
      return WeatherService.ICON_URL + "art_light_rain.png";
    else if (id >= 600 && id <= 622)
      return WeatherService.ICON_URL + "art_snow.png";
    else if (id >= 801 && id <= 804)
      return WeatherService.ICON_URL + "art_clouds.png";
    else if (id === 741 || id === 761)
      return WeatherService.ICON_URL + "art_fog.png";
    else
      return WeatherService.ICON_URL + "art_clear.png";
  }

  private updateConditions(locations: string[]) {
      let added = locations.filter(zip => !this.currentConditions().some(c => c.zip === zip));
      let remain = this.currentConditions().filter(({zip}) => locations.some(l => l === zip));

      console.log({ added, remain, locations});

      forkJoin(added.map(zip => this.getCurrentCondition(zip)))
        .subscribe(conditions => {
          let conditionAndZips = conditions.map((c, i) => ({ zip: added[i], data: c }));
          this.currentConditions.set([...remain, ...conditionAndZips]);
        });

      // If nothing is added forkJoin will never emit 
      if(added.length === 0) {
          this.currentConditions.set(remain);
      }
  }
}