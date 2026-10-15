import { Component, HostListener, effect, input, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MarkdownComponent } from 'ngx-markdown';
import { ButtonComponent } from '../../atoms/button/button.component';
import { TabItem, TabsComponent } from '../../atoms/tabs/tabs.component';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule,
    MarkdownComponent,
    ButtonComponent,
    TabsComponent
  ],
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss'
})
export class MarkdownEditorComponent {
  value = model<string>('');
  height = input<string>('440px');
  placeholder = input<string>('No content to preview yet.');
  readOnly = input<boolean>(false);

  editorTabs: TabItem<'edit' | 'preview'>[] = [
    { id: 'edit', label: 'Edit', icon: 'code' },
    { id: 'preview', label: 'Preview', icon: 'eye' }
  ];

  activeTab = signal<'edit' | 'preview'>('edit');
  isFullscreen = signal<boolean>(false);
  rawContent: string = '';
  private editorInstance: any = null;

  editorOptions = {
    theme: 'vs',
    language: 'markdown',
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineNumbers: 'on',
    roundedSelection: true,
    automaticLayout: true,
    padding: { top: 8 }
  };

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isFullscreen()) {
      this.toggleFullscreen();
    }
  }

  constructor() {
    effect(() => {
      const currentVal = this.value();
      if (currentVal !== this.rawContent) {
        this.rawContent = currentVal || '';
      }
    });
  }

  onContentChange(val: string): void {
    this.rawContent = val || '';
    this.value.set(this.rawContent);
  }

  onEditorInit(editor: any): void {
    this.editorInstance = editor;
    setTimeout(() => {
      editor.layout();
    }, 50);
  }

  setTab(tab: 'edit' | 'preview'): void {
    this.activeTab.set(tab);
    if (tab === 'edit') {
      setTimeout(() => {
        if (this.editorInstance) {
          this.editorInstance.layout();
        }
      }, 50);
    }
  }

  toggleFullscreen(): void {
    const nextState = !this.isFullscreen();
    this.isFullscreen.set(nextState);
    setTimeout(() => {
      if (this.editorInstance) {
        this.editorInstance.layout();
      }
    }, 50);
  }
}


