import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ERRCD } from '../constants/ERRCD.enum';

@Injectable()
export class ClientService {
  public async validated(client: Socket, options?: { scope?: 'ADMIN' | 'USER' }): Promise<number | void> {
    if (!client.data?.auth) {
      return ERRCD.E900401;
    }

    if (options && options?.scope) {
      if (options?.scope !== client.data?.auth?.guard) {
        return ERRCD.E900403;
      }
    }

    return;
  }
}
