import { IsNotEmpty, IsString } from 'class-validator';

export class ILiveBaseDto {
  @IsNotEmpty()
  @IsString()
  liveId: string;
}

export class LiveDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  liveId: string;
}

export class LivePingDto extends ILiveBaseDto {}

export class SubscribesDto extends ILiveBaseDto {}

export class AuthVerifiedDto extends ILiveBaseDto {}

export class LiveDetailDto extends ILiveBaseDto {}

export class BeginLiveDto extends ILiveBaseDto {}

export class EndLiveDto extends ILiveBaseDto {}

export class LeaveDto extends ILiveBaseDto {}
