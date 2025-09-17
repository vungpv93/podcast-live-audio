import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  liveId: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}

/**
 * Paginate cursor page
 */
export class CommentDto {
  @IsNotEmpty()
  @IsString()
  liveId: string;

  @IsOptional()
  @IsString()
  cursor: string;
}
