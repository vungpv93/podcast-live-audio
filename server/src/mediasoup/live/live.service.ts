import { Injectable } from '@nestjs/common';
import { MediasoupService } from '../mediasoup.service';

@Injectable()
export class LiveService {
  constructor(private readonly mediasoupService: MediasoupService) {}
}
