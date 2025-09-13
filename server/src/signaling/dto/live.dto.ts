import { IsNotEmpty, IsString } from 'class-validator';

export class LiveDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  liveId: string;
}

export class SubscribesDto extends LiveDto {}
