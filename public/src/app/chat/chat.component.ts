import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as io from 'socket.io-client';
import { ChatService } from './chat.service';
import { Message } from '../models/message';

@Component({
  selector: 'chat-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  onlineUsers: string[] = [];
  form: FormGroup;
  socket;
  smiles = [
    '😃', '🤤', '🤠', '😬', '😸', '😀', '😁',
    '🙌', '💩', '🤣', '🤳', '🙂', '😺', '😇',
    '😍', '😅', '😄', '😆', '😊', '😎'
  ];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private chat: ChatService
  ) { }

  get message(): FormControl {
    return this.form.get('message') as FormControl;
  }

  ngOnInit(): void {
    this.initForm();

    this.initSockets();

    this.getOldMessages();
  }

  initForm(): void {
    this.form = this.fb.group({
      message: ['', Validators.required]
    });
  }

  initSockets(): void {
    this.socket = io('localhost:3000');

    this.socket.emit('add-user', sessionStorage.getItem('username'));

    this.socket.on('messages', (message: Message) => {
      if (message) {
        this.messages = [message, ...this.messages].slice(0, 20); // Max 20 messages on screen
        this.cdr.detectChanges();
      }
    });

    this.socket.on('users-list', (users: string[]) => {
      if (users) {
        this.onlineUsers = users;
      }
    });
  }

  getOldMessages(): void {
    this.chat.getOldMessages().subscribe((messages: Message[]) => {
      this.messages = messages;
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.socket.emit('message', this.message.value);
      this.message.setValue('');
    }
  }

  insertUsername(username: string): void {
    this.message.setValue(`@${username} ` + this.message.value);
  }

  insertSmile(smile: string): void {
    this.message.setValue(this.message.value + ' ' + smile);
  }
}
