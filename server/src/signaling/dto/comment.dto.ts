import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ICommentBaseDto {
  @IsNotEmpty()
  @IsString()
  liveId: string;
}

export class CreateCommentDto extends ICommentBaseDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

/**
 * Paginate cursor page
 */
export class CommentDto extends ICommentBaseDto {
  @IsOptional()
  @IsNumber()
  cursor: number;
}

export class CommentDelDto extends ICommentBaseDto {
  @IsNotEmpty()
  @IsString()
  commentId: string;

  @IsOptional()
  @IsNumber()
  score: number;
}

export class FakerCommentDto extends ICommentBaseDto {}
