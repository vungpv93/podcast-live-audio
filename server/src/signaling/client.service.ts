import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ERRCD } from '../constants/ERRCD.enum';

@Injectable()
export class ClientService {
  public async validated(client: Socket): Promise<number | void> {
    if (!client.data?.auth) {
      return ERRCD.E900401;
    }
    return;
  }
}
