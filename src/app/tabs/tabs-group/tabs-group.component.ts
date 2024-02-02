import { AfterContentInit, AfterViewInit, Component, ContentChildren, EventEmitter, Output, QueryList, TemplateRef, ViewChild, ViewContainerRef, ViewRef } from '@angular/core';
import { TabComponent } from '../tab.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs-group',
  standalone: true,
  imports: [ CommonModule, TabComponent ],
  templateUrl: './tabs-group.component.html',
  styleUrl: './tabs-group.component.css'
})
export class TabsGroupComponent {
  _selected = 0;

  @ContentChildren(TabComponent)
  tabs: QueryList<TabComponent>;

  @ViewChild('content', { read: ViewContainerRef })
  content_view: ViewContainerRef;

  @Output()
  onClose = new EventEmitter<{index: number, id?: any}>();

  get selected(): number {
    return this._selected;
  }

  set selected(v: number) {
    this._selected = v;
  }

  selected_content(): TemplateRef<any> | undefined {
    return this.tabs.get(this._selected)?.content;
  }

  close(index: number) {
    this.tabs.get(index)?.close();
    if(this.selected >= this.tabs.length) {
      this.selected = 0;
    }
  }


}
