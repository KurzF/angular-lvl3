import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.css'
})
export class TabComponent {
  @Input() title = "";
  @Output('close') _close = new EventEmitter<undefined>();

  @ViewChild('tabContent')
  content: TemplateRef<any>;

  close() {
    this._close.emit();
  }
}
