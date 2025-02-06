import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InstagramService } from './instagram.service';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2200)
  commentText: string;

  @IsString()
  @IsNotEmpty()
  mediaId: string;
}

export class GetUserPostsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  pageSize: number = 12;

  @IsString()
  @IsOptional()
  cursor?: string;
}

@ApiTags('Instagram')
@Controller('instagram')
@UsePipes(new ValidationPipe({ transform: true }))
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Post('comments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a comment to an Instagram post' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comment added successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid Instagram cookies',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request payload',
  })
  async addComment(@Body() commentDto: AddCommentDto) {
    return await this.instagramService.addComment(
      commentDto.mediaId,
      commentDto.commentText,
    );
  }

  @Get('posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Instagram user posts with pagination' })
  @ApiQuery({
    name: 'userId',
    description: 'Instagram user ID',
    required: true,
  })
  @ApiQuery({
    name: 'pageSize',
    description: 'Number of posts to fetch per page',
    required: false,
  })
  @ApiQuery({
    name: 'cursor',
    description: 'Pagination cursor for fetching next page',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts fetched successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid Instagram cookies',
  })
  async getUserPosts(@Query() queryParams: GetUserPostsDto) {
    return await this.instagramService.getUserPosts(
      queryParams.userId,
      queryParams.pageSize,
      queryParams.cursor,
    );
  }
}
