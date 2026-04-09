import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getStatus() {
    return { module: 'auth', ready: false, note: 'Implement auth + SP calls later' };
  }
}
