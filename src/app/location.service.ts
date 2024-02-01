import { Injectable, signal } from '@angular/core';
import {WeatherService} from "./weather.service";
import { BehaviorSubject } from 'rxjs';

export const LOCATIONS : string = "locations";

@Injectable()
export class LocationService {

  private _locations = new BehaviorSubject<string[]>([]);

  constructor() {
    let locString = localStorage.getItem(LOCATIONS);
    if (locString)
      this._locations.next(JSON.parse(locString));
  }

  addLocation(zipcode : string) {
    this._locations.value.push(zipcode);
    this._locations.next(this._locations.value);
    localStorage.setItem(LOCATIONS, JSON.stringify(this._locations.value));
  }

  removeLocation(zipcode : string) {
    console.log("remove")
    let index = this._locations.value.indexOf(zipcode);
    if (index !== -1){
      let newLocations = [...this._locations.value];
      newLocations.splice(index, 1);
      this._locations.next(newLocations);
      localStorage.setItem(LOCATIONS, JSON.stringify(this._locations.value));
    }
  }

  locations() {
    return this._locations.asObservable();
  }
}
