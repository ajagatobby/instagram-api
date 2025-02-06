import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InstagramService } from './instagram.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InstagramCronService {
  private readonly logger = new Logger(InstagramCronService.name);
  private isJobRunning = false;

  constructor(
    private readonly instagramService: InstagramService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 */5 * * *', {
    name: 'instagram-comment-job',
  })
  async handleCommentCron() {
    try {
      if (this.isJobRunning) {
        this.logger.warn(
          'Previous job is still running. Skipping this iteration.',
        );
        return;
      }

      this.isJobRunning = true;
      this.logger.log('Starting periodic comment job');

      const targetUserId = this.configService.get<string>(
        'INSTAGRAM_TARGET_USER_ID',
      );
      const commentText = this.configService.get<string>(
        'INSTAGRAM_COMMENT_TEXT',
      );

      if (!targetUserId || !commentText) {
        throw new Error(
          'Missing required configuration: INSTAGRAM_TARGET_USER_ID or INSTAGRAM_COMMENT_TEXT',
        );
      }

      // Get the latest posts
      const posts = await this.instagramService.getUserPosts(targetUserId);

      // Comment on each post
      for (const post of posts.data) {
        try {
          // Random delay between 5-10 minutes (300000-600000 milliseconds)
          const delayMs = Math.floor(
            Math.random() * (600000 - 300000 + 1) + 300000,
          );
          this.logger.log(
            `Waiting ${Math.round(delayMs / 1000)} seconds before commenting on post ${post.id}`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));

          await this.instagramService.addComment(post.id, commentText);
          this.logger.log(`Successfully commented on post ${post.id}`);
        } catch (error) {
          this.logger.error(`Failed to comment on post ${post.id}:`, error);
          continue;
        }
      }

      this.logger.log('Completed periodic comment job');
    } catch (error) {
      this.logger.error('Error in comment cron job:', error);
    } finally {
      this.isJobRunning = false;
    }
  }
}
