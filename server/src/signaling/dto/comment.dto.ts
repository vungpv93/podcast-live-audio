import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ICommentDto {
  @IsNotEmpty()
  @IsString()
  liveId: string;
}

export class CreateCommentDto extends ICommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

/**
 * Paginate cursor page
 */
export class CommentDto extends ICommentDto {
  @IsOptional()
  @IsNumber()
  cursor: number;
}

export class CommentDelDto extends ICommentDto {
  @IsNotEmpty()
  @IsString()
  commentId: string;

  @IsOptional()
  @IsNumber()
  score: number;
}
